from datetime import datetime
from pydantic import BaseModel


class ConversationCreate(BaseModel):
    persona_id: str
    title: str = "New Conversation"


class ConversationOut(BaseModel):
    id: str
    persona_id: str
    title: str
    created_at: datetime

    model_config = {"from_attributes": True}


class MessageOut(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}
