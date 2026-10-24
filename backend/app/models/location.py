import uuid
from sqlalchemy import String, Float, ForeignKey, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, UUIDType, UUIDMixin, TimestampMixin


class LocationUpdate(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "location_updates"

    device_id: Mapped[uuid.UUID] = mapped_column(
        UUIDType, ForeignKey("devices.id", ondelete="CASCADE"), index=True
    )
    child_profile_id: Mapped[uuid.UUID | None] = mapped_column(
        UUIDType, ForeignKey("child_profiles.id", ondelete="SET NULL"),
        nullable=True, index=True,
    )
    family_id: Mapped[uuid.UUID] = mapped_column(
        UUIDType, ForeignKey("families.id", ondelete="CASCADE"), index=True
    )
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    accuracy: Mapped[float | None] = mapped_column(Float, nullable=True)
    address: Mapped[str | None] = mapped_column(String(512), nullable=True)


class Geofence(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "geofences"

    family_id: Mapped[uuid.UUID] = mapped_column(
        UUIDType, ForeignKey("families.id", ondelete="CASCADE"), index=True
    )
    child_profile_id: Mapped[uuid.UUID | None] = mapped_column(
        UUIDType, ForeignKey("child_profiles.id", ondelete="SET NULL"),
        nullable=True,
    )
    name: Mapped[str] = mapped_column(String(255))
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    radius_meters: Mapped[int] = mapped_column(Integer, default=200)
    is_safe_zone: Mapped[bool] = mapped_column(Boolean, default=True)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
