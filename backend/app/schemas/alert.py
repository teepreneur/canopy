import uuid
from datetime import datetime
from pydantic import BaseModel
from app.models.alert import AlertType, AlertStatus


class AlertCreate(BaseModel):
    alert_type: AlertType
    title: str
    detail: str | None = None
    target: str | None = None


class AlertOut(BaseModel):
    id: uuid.UUID
    family_id: uuid.UUID
    device_id: uuid.UUID
    child_profile_id: uuid.UUID | None
    alert_type: AlertType
    status: AlertStatus
    title: str
    detail: str | None
    target: str | None
    acknowledged: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class AlertAction(BaseModel):
    status: AlertStatus
