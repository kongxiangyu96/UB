"""WebSocket chat endpoint with streaming LLM responses."""
import json
import uuid
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from openai import AsyncOpenAI

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.models.persona import Persona
from app.models.conversation import Conversation, Message
from app.services import rag_service

router = APIRouter()
logger = logging.getLogger(__name__)

_llm = AsyncOpenAI(api_key=settings.deepseek_api_key, base_url=settings.deepseek_base_url)

_HISTORY_WINDOW = 10  # number of recent messages to include


async def _send(ws: WebSocket, type_: str, content: str) -> None:
    await ws.send_text(json.dumps({"type": type_, "content": content}))


@router.websocket("/ws/chat")
async def chat_ws(websocket: WebSocket, conversation_id: str):
    await websocket.accept()

    async with AsyncSessionLocal() as db:
        conv = await db.get(Conversation, conversation_id)
        if not conv:
            await _send(websocket, "error", "Conversation not found")
            await websocket.close(code=4004)
            return

        persona = await db.get(Persona, conv.persona_id)
        if not persona:
            await _send(websocket, "error", "Persona not found")
            await websocket.close(code=4004)
            return

    try:
        while True:
            raw = await websocket.receive_text()
            data = json.loads(raw)

            if data.get("type") != "message":
                continue

            user_content: str = data.get("content", "").strip()
            if not user_content:
                continue

            async with AsyncSessionLocal() as db:
                # Persist user message
                user_msg = Message(
                    id=str(uuid.uuid4()),
                    conversation_id=conversation_id,
                    role="user",
                    content=user_content,
                )
                db.add(user_msg)
                await db.commit()

                # Fetch recent history
                history_rows = await db.execute(
                    select(Message)
                    .where(Message.conversation_id == conversation_id)
                    .order_by(Message.created_at.desc())
                    .limit(_HISTORY_WINDOW + 1)
                )
                history_msgs = list(reversed(history_rows.scalars().all()))
                # exclude the just-added user message (last item)
                history_msgs = history_msgs[:-1]
                history = [{"role": m.role, "content": m.content} for m in history_msgs]

                # RAG retrieval
                try:
                    context_chunks = await rag_service.retrieve_chunks(user_content, db)
                except Exception:
                    logger.exception("RAG retrieval failed, continuing without context")
                    context_chunks = []

                messages = rag_service.build_prompt(
                    persona.system_prompt, context_chunks, history, user_content
                )

            # Stream LLM response
            full_reply = ""
            try:
                stream = await _llm.chat.completions.create(
                    model=settings.deepseek_model,
                    messages=messages,
                    stream=True,
                    temperature=0.7,
                    max_tokens=2048,
                )
                async for chunk in stream:
                    delta = chunk.choices[0].delta.content
                    if delta:
                        full_reply += delta
                        await _send(websocket, "token", delta)
            except Exception as exc:
                logger.exception("LLM streaming failed")
                await _send(websocket, "error", str(exc))
                continue

            await _send(websocket, "done", "")

            # Persist assistant message
            async with AsyncSessionLocal() as db:
                assistant_msg = Message(
                    id=str(uuid.uuid4()),
                    conversation_id=conversation_id,
                    role="assistant",
                    content=full_reply,
                )
                db.add(assistant_msg)
                await db.commit()

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected: conversation %s", conversation_id)
    except Exception:
        logger.exception("Unexpected WebSocket error")
        await websocket.close(code=1011)
