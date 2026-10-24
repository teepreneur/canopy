from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, UUIDMixin, TimestampMixin


class User(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(255))
    push_token: Mapped[str | None] = mapped_column(String(255), nullable=True)

    family_memberships: Mapped[list["FamilyMember"]] = relationship(
        "FamilyMember", back_populates="user", lazy="selectin"
    )
