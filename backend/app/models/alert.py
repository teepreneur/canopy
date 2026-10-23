import uuid
import enum
from sqlalchemy import String, ForeignKey, Boolean, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base, UUIDMixin, TimestampMixin


class AlertType(str, enum.Enum):
    blocked_attempt = "blocked_attempt"
    suspicious_activity = "suspicious_activity"
    access_request = "access_request"
    device_offline = "device_offline"


class AlertStatus(str, enum.Enum):
    pending = "pending"
    acknowledged = "acknowledged"
    approved = "approved"
    denied = "denied"


class Alert(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "alerts"

    family_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("families.id", ondelete="CASCADE")
    )
    device_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("devices.id", ondelete="CASCADE")
    )
    child_profile_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("child_profiles.id", ondelete="SET NULL"),
        nullable=True,
    )
    alert_type: Mapped[AlertType] = mapped_column(SAEnum(AlertType))
    status: Mapped[AlertStatus] = mapped_column(
        SAEnum(AlertStatus), default=AlertStatus.pending
    )
    title: Mapped[str] = mapped_column(String(255))
    detail: Mapped[str | None] = mapped_column(Text, nullable=True)
    target: Mapped[str | None] = mapped_column(String(512), nullable=True)
    acknowledged: Mapped[bool] = mapped_column(Boolean, default=False)
