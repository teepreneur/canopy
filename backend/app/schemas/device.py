import uuid
from datetime import datetime
from pydantic import BaseModel


class PairingCodeCreate(BaseModel):
    child_profile_id: uuid.UUID | None = None


class PairingCodeOut(BaseModel):
    code: str
    expires_at: datetime

    model_config = {"from_attributes": True}


class DeviceRegister(BaseModel):
    pairing_code: str
    name: str
    platform: str = "macos"


class DeviceOut(BaseModel):
    id: uuid.UUID
    family_id: uuid.UUID
    child_profile_id: uuid.UUID | None
    name: str
    platform: str
    device_token: str
    is_online: bool
    last_heartbeat: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class DeviceListOut(BaseModel):
    id: uuid.UUID
    family_id: uuid.UUID
    child_profile_id: uuid.UUID | None
    name: str
    platform: str
    is_online: bool
    last_heartbeat: datetime | None

    model_config = {"from_attributes": True}
