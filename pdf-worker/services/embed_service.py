"""DashScope embed for pdf-worker (sync-friendly async wrapper)."""
import httpx
from config import settings

_EMBED_URL = "https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding"
_EMBED_MODEL = "text-embedding-v3"


async def embed_texts(texts: list[str]) -> list[list[float]]:
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
