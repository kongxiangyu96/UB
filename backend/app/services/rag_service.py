"""RAG: embed query → pgvector retrieval → rerank → build prompt."""
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.services import embed_service

_TOP_K = 10
_TOP_N_RERANK = 3


async def retrieve_chunks(query: str, db: AsyncSession) -> list[str]:
    """Retrieve top chunks for a query using cosine similarity + reranking."""
    query_vec = await embed_service.embed_query(query)

    # pgvector cosine similarity search
    result = await db.execute(
        text(
            """
            SELECT content
            FROM document_chunks
            ORDER BY embedding <=> CAST(:vec AS vector)
            LIMIT :k
            """
        ),
        {"vec": str(query_vec), "k": _TOP_K},
    )
    rows = result.fetchall()
    if not rows:
        return []

    candidates = [row[0] for row in rows]

    # Rerank
    reranked = await embed_service.rerank(query, candidates, top_n=_TOP_N_RERANK)
    return [candidates[r["index"]] for r in reranked]


def build_prompt(
    system_prompt: str,
    context_chunks: list[str],
    history: list[dict],
    user_message: str,
) -> list[dict]:
    """Build the messages array for the LLM call."""
    context_text = "\n\n---\n\n".join(context_chunks)
    system = system_prompt
    if context_chunks:
        system += f"\n\n## Knowledge Base Context\n\n{context_text}"

    messages = [{"role": "system", "content": system}]
    messages.extend(history)
    messages.append({"role": "user", "content": user_message})
    return messages
