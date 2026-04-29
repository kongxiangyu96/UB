"""
arq worker: consumes PDF processing jobs from Redis queue.
Scale with: docker compose up --scale pdf-worker=N
"""
import uuid
import asyncio
import logging
from arq import cron
from arq.connections import RedisSettings
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy import text

from config import settings
from services.pdf_service import pdf_to_markdown
from services.chunker import chunk_markdown
from services.embed_service import embed_texts
from services.oss_service import upload_bytes

logger = logging.getLogger(__name__)

engine = create_async_engine(settings.database_url, echo=False, pool_pre_ping=True)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def _set_status(db: AsyncSession, document_id: str, status: str, error_msg: str | None = None) -> None:
    await db.execute(
        text("UPDATE documents SET status = :status, error_msg = :error WHERE id = :id"),
        {"status": status, "error": error_msg, "id": document_id},
    )
    await db.commit()


async def process_pdf(ctx: dict, document_id: str, pdf_bytes: bytes, filename: str) -> None:
    """Main job handler: PDF bytes → OSS + pgvector."""
    logger.info("Processing document %s (%s)", document_id, filename)

    async with AsyncSessionLocal() as db:
        try:
            await _set_status(db, document_id, "processing")

            # 1. PDF → Markdown
            markdown = await asyncio.get_event_loop().run_in_executor(None, pdf_to_markdown, pdf_bytes)

            # 2. Upload Markdown to OSS
            oss_key = f"documents/{document_id}/{filename}.md"
            upload_bytes(markdown.encode("utf-8"), oss_key, content_type="text/markdown; charset=utf-8")

            # 3. Update oss_path in DB
            await db.execute(
                text("UPDATE documents SET oss_path = :path WHERE id = :id"),
                {"path": oss_key, "id": document_id},
            )
            await db.commit()

            # 4. Chunk
            chunks = chunk_markdown(markdown)
            if not chunks:
                await _set_status(db, document_id, "done")
                return

            # 5. Embed all chunks
            vectors = await embed_texts(chunks)

            # 6. Bulk insert document_chunks
            rows = [
                {
                    "id": idx,
                    "document_id": document_id,
                    "content": chunk,
                    "embedding": str(vec),
                    "metadata": {"filename": filename, "chunk_index": idx},
                    "chunk_index": idx,
                }
                for idx, (chunk, vec) in enumerate(zip(chunks, vectors))
            ]
            await db.execute(
                text(
                    """
                    INSERT INTO document_chunks (document_id, content, embedding, metadata, chunk_index)
                    VALUES (:document_id, :content, CAST(:embedding AS vector), CAST(:metadata AS jsonb), :chunk_index)
                    """
                ),
                rows,
            )
            await db.commit()

            await _set_status(db, document_id, "done")
            logger.info("Document %s processed: %d chunks", document_id, len(chunks))

        except Exception as exc:
            logger.exception("Failed to process document %s", document_id)
            await _set_status(db, document_id, "error", str(exc))


class WorkerSettings:
    functions = [process_pdf]
    redis_settings = RedisSettings.from_dsn(settings.redis_url)
    max_jobs = 4
    job_timeout = 600  # 10 minutes per PDF
    keep_result = 3600
