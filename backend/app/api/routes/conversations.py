import uuid
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.conversation import Conversation, Message
from app.schemas.conversation import ConversationCreate, ConversationOut, MessageOut

router = APIRouter()


@router.get("", response_model=list[ConversationOut])
async def list_conversations(persona_id: str | None = None, db: AsyncSession = Depends(get_db)):
    q = select(Conversation).order_by(Conversation.created_at.desc())
    if persona_id:
        q = q.where(Conversation.persona_id == persona_id)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("", response_model=ConversationOut, status_code=201)
async def create_conversation(body: ConversationCreate, db: AsyncSession = Depends(get_db)):
    conv = Conversation(id=str(uuid.uuid4()), **body.model_dump())
    db.add(conv)
    await db.commit()
    await db.refresh(conv)
    return conv


@router.delete("/{conversation_id}", status_code=204)
async def delete_conversation(conversation_id: str, db: AsyncSession = Depends(get_db)):
    conv = await db.get(Conversation, conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    await db.delete(conv)
    await db.commit()


@router.get("/{conversation_id}/messages", response_model=list[MessageOut])
async def get_messages(conversation_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
    )
    return result.scalars().all()
