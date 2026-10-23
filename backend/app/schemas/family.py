import uuid
from datetime import datetime
from pydantic import BaseModel


class FamilyCreate(BaseModel):
    name: str


class FamilyOut(BaseModel):
    id: uuid.UUID
    name: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ChildProfileCreate(BaseModel):
    name: str
    age: int | None = None
    avatar_url: str | None = None


class ChildProfileOut(BaseModel):
    id: uuid.UUID
    family_id: uuid.UUID
    name: str
    age: int | None
    avatar_url: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
