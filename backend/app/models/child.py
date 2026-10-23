import uuid
from sqlalchemy import String, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base, UUIDMixin, TimestampMixin


class ChildProfile(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "child_profiles"

    family_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("families.id", ondelete="CASCADE")
    )
    name: Mapped[str] = mapped_column(String(255))
    age: Mapped[int] = mapped_column(Integer, nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(512), nullable=True)

    family: Mapped["Family"] = relationship("Family", back_populates="children")
    devices: Mapped[list["Device"]] = relationship(
        "Device", back_populates="child_profile", lazy="selectin"
    )
