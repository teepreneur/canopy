import uuid
from datetime import datetime
from pydantic import BaseModel
from app.models.command import CommandType, CommandStatus


class CommandCreate(BaseModel):
    device_id: uuid.UUID
    command_type: CommandType
    payload: dict | None = None


class CommandOut(BaseModel):
    id: uuid.UUID
    family_id: uuid.UUID
    device_id: uuid.UUID
    command_type: CommandType
    status: CommandStatus
    payload: dict | None
    created_at: datetime

    model_config = {"from_attributes": True}
