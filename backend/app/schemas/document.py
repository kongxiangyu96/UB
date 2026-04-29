from datetime import datetime
from pydantic import BaseModel


class DocumentOut(BaseModel):
    id: str
    filename: str
    oss_path: str | None
    status: str
    error_msg: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
