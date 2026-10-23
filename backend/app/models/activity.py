import uuid
import enum
from datetime import datetime
from sqlalchemy import String, ForeignKey, DateTime, Integer, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base, UUIDMixin


class ActivityType(str, enum.Enum):
    site_visit = "site_visit"
    app_usage = "app_usage"


class ActivityLog(Base, UUIDMixin):
    __tablename__ = "activity_logs"

    device_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("devices.id", ondelete="CASCADE"), index=True
    )
    child_profile_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("child_profiles.id", ondelete="SET NULL"),
        nullable=True,
    )
    activity_type: Mapped[ActivityType] = mapped_column(SAEnum(ActivityType))
    target: Mapped[str] = mapped_column(String(512))
    title: Mapped[str | None] = mapped_column(String(512), nullable=True)
    duration_seconds: Mapped[int] = mapped_column(Integer, default=0)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), index=True
    )
