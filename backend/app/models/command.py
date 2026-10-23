import uuid
import enum
from sqlalchemy import String, ForeignKey, Enum as SAEnum, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, UUIDType, UUIDMixin, TimestampMixin


class CommandType(str, enum.Enum):
    kill_internet = "kill_internet"
    restore_internet = "restore_internet"
    lock_app = "lock_app"
    unlock_app = "unlock_app"
    refresh_rules = "refresh_rules"


class CommandStatus(str, enum.Enum):
    pending = "pending"
    delivered = "delivered"
    executed = "executed"
    failed = "failed"


class Command(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "commands"

    family_id: Mapped[uuid.UUID] = mapped_column(
        UUIDType, ForeignKey("families.id", ondelete="CASCADE")
    )
    device_id: Mapped[uuid.UUID] = mapped_column(
        UUIDType, ForeignKey("devices.id", ondelete="CASCADE")
    )
    command_type: Mapped[CommandType] = mapped_column(SAEnum(CommandType))
    status: Mapped[CommandStatus] = mapped_column(
        SAEnum(CommandStatus), default=CommandStatus.pending
    )
    payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
