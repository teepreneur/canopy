import uuid
from datetime import datetime
from pydantic import BaseModel


class LocationSubmit(BaseModel):
    latitude: float
    longitude: float
    accuracy: float | None = None
    address: str | None = None


class LocationOut(BaseModel):
    id: uuid.UUID
    device_id: uuid.UUID
    child_profile_id: uuid.UUID | None
    latitude: float
    longitude: float
    accuracy: float | None
    address: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class GeofenceCreate(BaseModel):
    child_profile_id: uuid.UUID | None = None
    name: str
    latitude: float
    longitude: float
    radius_meters: int = 200
    is_safe_zone: bool = True


class GeofenceUpdate(BaseModel):
    name: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    radius_meters: int | None = None
    is_safe_zone: bool | None = None
    enabled: bool | None = None


class GeofenceOut(BaseModel):
    id: uuid.UUID
    family_id: uuid.UUID
    child_profile_id: uuid.UUID | None
    name: str
    latitude: float
    longitude: float
    radius_meters: int
    is_safe_zone: bool
    enabled: bool
    created_at: datetime

    model_config = {"from_attributes": True}
