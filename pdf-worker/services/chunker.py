"""Chunking utilities: split Markdown into ~500-token chunks with overlap."""
import re
import tiktoken

_enc = tiktoken.get_encoding("cl100k_base")
CHUNK_SIZE = 500
OVERLAP = 50


def _count_tokens(text: str) -> int:
    return len(_enc.encode(text))


def chunk_markdown(text: str) -> list[str]:
    """
    Split Markdown text by headings first, then by token count.
    Returns list of chunk strings.
    """
    # Split on heading boundaries
    sections = re.split(r"(?=^#{1,3} )", text, flags=re.MULTILINE)
    sections = [s.strip() for s in sections if s.strip()]

    chunks: list[str] = []
    for section in sections:
        tokens = _enc.encode(section)
        if len(tokens) <= CHUNK_SIZE:
            chunks.append(section)
        else:
            # Slide window over large sections
            start = 0
            while start < len(tokens):
                end = min(start + CHUNK_SIZE, len(tokens))
                chunk_tokens = tokens[start:end]
                chunks.append(_enc.decode(chunk_tokens))
                start += CHUNK_SIZE - OVERLAP

    return [c for c in chunks if c.strip()]
