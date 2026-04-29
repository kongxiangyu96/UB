from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routes import personas, documents, conversations
from app.api.websocket import chat

app = FastAPI(title="UB API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.backend_cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(personas.router, prefix="/api/personas", tags=["personas"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(conversations.router, prefix="/api/conversations", tags=["conversations"])
app.include_router(chat.router, tags=["chat"])


@app.get("/health")
async def health():
    return {"status": "ok"}
