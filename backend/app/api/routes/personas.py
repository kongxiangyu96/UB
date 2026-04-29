import uuid
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.persona import Persona
from app.schemas.persona import PersonaCreate, PersonaUpdate, PersonaOut, PersonaGenerateRequest, PersonaGenerateResponse
from app.services.persona_service import generate_system_prompt

router = APIRouter()


@router.get("", response_model=list[PersonaOut])
async def list_personas(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Persona).order_by(Persona.created_at.desc()))
    return result.scalars().all()


@router.post("", response_model=PersonaOut, status_code=201)
async def create_persona(body: PersonaCreate, db: AsyncSession = Depends(get_db)):
    persona = Persona(id=str(uuid.uuid4()), **body.model_dump())
    db.add(persona)
    await db.commit()
    await db.refresh(persona)
    return persona


@router.put("/{persona_id}", response_model=PersonaOut)
async def update_persona(persona_id: str, body: PersonaUpdate, db: AsyncSession = Depends(get_db)):
    persona = await db.get(Persona, persona_id)
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(persona, field, value)
    await db.commit()
    await db.refresh(persona)
    return persona


@router.delete("/{persona_id}", status_code=204)
async def delete_persona(persona_id: str, db: AsyncSession = Depends(get_db)):
    persona = await db.get(Persona, persona_id)
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")
    await db.delete(persona)
    await db.commit()


@router.post("/generate", response_model=PersonaGenerateResponse)
async def generate_persona_prompt(body: PersonaGenerateRequest):
    system_prompt = await generate_system_prompt(body.description)
    return PersonaGenerateResponse(system_prompt=system_prompt)
