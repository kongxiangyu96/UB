import uuid
from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from arq.connections import ArqRedis, create_pool, RedisSettings

from app.core.config import settings
from app.core.database import get_db
from app.models.document import Document, DocumentChunk
from app.schemas.document import DocumentOut

router = APIRouter()


async def _get_arq() -> ArqRedis:
    return await create_pool(RedisSettings.from_dsn(settings.redis_url))


@router.get("", response_model=list[DocumentOut])
async def list_documents(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Document).order_by(Document.created_at.desc()))
    return result.scalars().all()


@router.post("/upload", response_model=DocumentOut, status_code=202)
async def upload_document(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    pdf_bytes = await file.read()
    document_id = str(uuid.uuid4())

    doc = Document(id=document_id, filename=file.filename, status="pending")
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    arq = await _get_arq()
    await arq.enqueue_job("process_pdf", document_id, pdf_bytes, file.filename)
    await arq.aclose()

    return doc


@router.delete("/{document_id}", status_code=204)
async def delete_document(document_id: str, db: AsyncSession = Depends(get_db)):
    doc = await db.get(Document, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    await db.execute(delete(DocumentChunk).where(DocumentChunk.document_id == document_id))
    await db.delete(doc)
    await db.commit()
