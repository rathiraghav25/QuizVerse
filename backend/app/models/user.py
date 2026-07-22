from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, Integer, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, TYPE_CHECKING
import enum

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.quiz import Quiz
    from app.models.attempt import Attempt


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    TEACHER = "teacher"
    STUDENT = "student"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        SQLEnum(UserRole, name="user_role_enum", native_enum=False),
        nullable=False,
        default=UserRole.STUDENT
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    created_quizzes: Mapped[List["Quiz"]] = relationship(
        "Quiz",
        back_populates="creator",
        cascade="all, delete-orphan"
    )
    attempts: Mapped[List["Attempt"]] = relationship(
        "Attempt",
        back_populates="user",
        cascade="all, delete-orphan"
    )
