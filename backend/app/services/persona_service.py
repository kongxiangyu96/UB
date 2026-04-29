"""Persona system prompt generation via DeepSeek API."""
from openai import AsyncOpenAI
from app.core.config import settings

_client = AsyncOpenAI(api_key=settings.deepseek_api_key, base_url=settings.deepseek_base_url)

_GENERATE_SYSTEM = """You are an expert AI persona designer.
Given a user's description of a persona, generate a detailed, high-quality system prompt
that will make an LLM behave as that persona.
The system prompt should define personality, tone, expertise, and behavioral guidelines.
Return ONLY the system prompt text, no extra commentary."""


async def generate_system_prompt(description: str) -> str:
    response = await _client.chat.completions.create(
        model=settings.deepseek_model,
        messages=[
            {"role": "system", "content": _GENERATE_SYSTEM},
            {"role": "user", "content": f"Persona description: {description}"},
        ],
        temperature=0.7,
        max_tokens=1000,
    )
    return response.choices[0].message.content.strip()
