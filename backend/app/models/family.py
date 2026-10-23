import uuid
from sqlalchemy import String, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base, UUIDMixin, TimestampMixin
import enum


class FamilyRole(str, enum.Enum):
    owner = "owner"
    admin = "admin"
    viewer = "viewer"


class Family(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "families"

    name: Mapped[str] = mapped_column(String(255))

    members: Mapped[list["FamilyMember"]] = relationship(
        "FamilyMember", back_populates="family", lazy="selectin"
    )
    children: Mapped[list["ChildProfile"]] = relationship(
        "ChildProfile", back_populates="family", lazy="selectin"
    )


class FamilyMember(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "family_members"

    family_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("families.id", ondelete="CASCADE")
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    role: Mapped[FamilyRole] = mapped_column(
        SAEnum(FamilyRole), default=FamilyRole.owner
    )

    family: Mapped["Family"] = relationship("Family", back_populates="members")
    user: Mapped["User"] = relationship("User", back_populates="family_memberships")
