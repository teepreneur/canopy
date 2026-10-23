import uuid
import enum
from sqlalchemy import String, ForeignKey, Enum as SAEnum, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, UUIDType, UUIDMixin, TimestampMixin


class RuleType(str, enum.Enum):
    block_site = "block_site"
    block_app = "block_app"
    schedule = "schedule"


class BlockingRule(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "blocking_rules"

    family_id: Mapped[uuid.UUID] = mapped_column(
        UUIDType, ForeignKey("families.id", ondelete="CASCADE")
    )
    device_id: Mapped[uuid.UUID | None] = mapped_column(
        UUIDType, ForeignKey("devices.id", ondelete="CASCADE"),
        nullable=True,
    )
    child_profile_id: Mapped[uuid.UUID | None] = mapped_column(
        UUIDType, ForeignKey("child_profiles.id", ondelete="CASCADE"),
        nullable=True,
    )
    rule_type: Mapped[RuleType] = mapped_column(SAEnum(RuleType))
    target: Mapped[str] = mapped_column(String(512))
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    schedule_days: Mapped[list[str] | None] = mapped_column(
        JSON, nullable=True
    )
    schedule_start: Mapped[str | None] = mapped_column(String(5), nullable=True)
    schedule_end: Mapped[str | None] = mapped_column(String(5), nullable=True)
