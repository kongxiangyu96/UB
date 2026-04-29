from datetime import datetime
from pydantic import BaseModel


class PersonaCreate(BaseModel):
    name: str
    description: str = ""
    system_prompt: str = ""
    avatar_url: str | None = None


class PersonaUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    system_prompt: str | None = None
    avatar_url: str | None = None


class PersonaOut(BaseModel):
    id: str
    name: str
    description: str
    system_prompt: str
    avatar_url: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PersonaGenerateRequest(BaseModel):
    description: str


class PersonaGenerateResponse(BaseModel):
    system_prompt: str
