import uuid
import enum
from sqlalchemy import String, ForeignKey, Enum as SAEnum, Time, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from app.models.base import Base, UUIDMixin, TimestampMixin


class RuleType(str, enum.Enum):
    block_site = "block_site"
    block_app = "block_app"
    schedule = "schedule"


class BlockingRule(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "blocking_rules"

    family_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("families.id", ondelete="CASCADE")
    )
    device_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("devices.id", ondelete="CASCADE"),
        nullable=True,
    )
    child_profile_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("child_profiles.id", ondelete="CASCADE"),
        nullable=True,
    )
    rule_type: Mapped[RuleType] = mapped_column(SAEnum(RuleType))
    target: Mapped[str] = mapped_column(String(512))
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    schedule_days: Mapped[list[str] | None] = mapped_column(
        ARRAY(String), nullable=True
    )
    schedule_start: Mapped[str | None] = mapped_column(String(5), nullable=True)
    schedule_end: Mapped[str | None] = mapped_column(String(5), nullable=True)
