import uuid
from datetime import datetime
from pydantic import BaseModel
from app.models.rule import RuleType


class RuleCreate(BaseModel):
    device_id: uuid.UUID | None = None
    child_profile_id: uuid.UUID | None = None
    rule_type: RuleType
    target: str
    enabled: bool = True
    schedule_days: list[str] | None = None
    schedule_start: str | None = None
    schedule_end: str | None = None


class RuleUpdate(BaseModel):
    enabled: bool | None = None
    target: str | None = None
    schedule_days: list[str] | None = None
    schedule_start: str | None = None
    schedule_end: str | None = None


class RuleOut(BaseModel):
    id: uuid.UUID
    family_id: uuid.UUID
    device_id: uuid.UUID | None
    child_profile_id: uuid.UUID | None
    rule_type: RuleType
    target: str
    enabled: bool
    schedule_days: list[str] | None
    schedule_start: str | None
    schedule_end: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
