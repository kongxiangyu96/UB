"""DashScope embedding and reranking via HTTP API."""
import httpx
from app.core.config import settings

_EMBED_URL = "https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding"
_RERANK_URL = "https://dashscope.aliyuncs.com/api/v1/services/rerank/text-rerank/text-rerank"
_EMBED_MODEL = "text-embedding-v3"
_RERANK_MODEL = "gte-rerank"


async def embed_texts(texts: list[str]) -> list[list[float]]:
    """
    Embed a list of texts using DashScope text-embedding-v3.
    Returns a list of 1536-dim float vectors.
    Batches automatically at 25 texts per request (API limit).
    """
    all_vectors: list[list[float]] = []
    batch_size = 25

    async with httpx.AsyncClient(timeout=60) as client:
        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            resp = await client.post(
                _EMBED_URL,
                headers={
                    "Authorization": f"Bearer {settings.dashscope_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": _EMBED_MODEL,
                    "input": {"texts": batch},
                    "parameters": {"dimension": 1536, "output_type": "dense&sparse"},
                },
            )
            resp.raise_for_status()
            data = resp.json()
            embeddings = data["output"]["embeddings"]
            embeddings.sort(key=lambda x: x["text_index"])
            all_vectors.extend(e["embedding"] for e in embeddings)

    return all_vectors


async def embed_query(text: str) -> list[float]:
    vectors = await embed_texts([text])
    return vectors[0]


async def rerank(query: str, documents: list[str], top_n: int = 3) -> list[dict]:
    """
    Rerank documents with DashScope gte-rerank.
    Returns list of {"index": int, "score": float, "document": str} sorted by score desc.
    """
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            _RERANK_URL,
            headers={
                "Authorization": f"Bearer {settings.dashscope_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": _RERANK_MODEL,
                "input": {
                    "query": query,
                    "documents": documents,
                    "top_n": top_n,
                },
            },
        )
        resp.raise_for_status()
        data = resp.json()
        results = data["output"]["results"]
        return sorted(results, key=lambda x: x["relevance_score"], reverse=True)
