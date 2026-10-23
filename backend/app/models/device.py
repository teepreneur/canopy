import uuid
import secrets
from datetime import datetime, timezone
from sqlalchemy import String, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, UUIDType, UUIDMixin, TimestampMixin


class Device(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "devices"

    family_id: Mapped[uuid.UUID] = mapped_column(
        UUIDType, ForeignKey("families.id", ondelete="CASCADE")
    )
    child_profile_id: Mapped[uuid.UUID | None] = mapped_column(
        UUIDType, ForeignKey("child_profiles.id", ondelete="SET NULL"),
        nullable=True,
    )
    name: Mapped[str] = mapped_column(String(255))
    platform: Mapped[str] = mapped_column(String(50), default="macos")
    device_token: Mapped[str] = mapped_column(
        String(64), unique=True, index=True,
        default=lambda: secrets.token_hex(32),
    )
    is_online: Mapped[bool] = mapped_column(Boolean, default=False)
    last_heartbeat: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    child_profile: Mapped["ChildProfile | None"] = relationship(
        "ChildProfile", back_populates="devices"
    )


class PairingCode(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "pairing_codes"

    family_id: Mapped[uuid.UUID] = mapped_column(
        UUIDType, ForeignKey("families.id", ondelete="CASCADE")
    )
    child_profile_id: Mapped[uuid.UUID | None] = mapped_column(
        UUIDType, ForeignKey("child_profiles.id", ondelete="SET NULL"),
        nullable=True,
    )
    code: Mapped[str] = mapped_column(String(8), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    used: Mapped[bool] = mapped_column(Boolean, default=False)
