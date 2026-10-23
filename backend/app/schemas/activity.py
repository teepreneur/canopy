import uuid
from datetime import datetime
from pydantic import BaseModel
from app.models.activity import ActivityType


class ActivityEntry(BaseModel):
    activity_type: ActivityType
    target: str
    title: str | None = None
    duration_seconds: int = 0
    timestamp: datetime


class ActivityBatchSubmit(BaseModel):
    entries: list[ActivityEntry]


class ActivityLogOut(BaseModel):
    id: uuid.UUID
    device_id: uuid.UUID
    child_profile_id: uuid.UUID | None
    activity_type: ActivityType
    target: str
    title: str | None
    duration_seconds: int
    timestamp: datetime

    model_config = {"from_attributes": True}


class DailySummary(BaseModel):
    date: str
    total_screen_time_seconds: int
    top_sites: list[dict]
    top_apps: list[dict]
