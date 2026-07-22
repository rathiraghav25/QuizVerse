from datetime import datetime, timezone
from sqlalchemy import String, Text, Boolean, DateTime, Integer, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, TYPE_CHECKING
import enum

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.category import Category
    from app.models.question import Question
    from app.models.attempt import Attempt


class QuizDifficulty(str, enum.Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class Quiz(Base):
    __tablename__ = "quizzes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True
    )
    creator_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    difficulty: Mapped[QuizDifficulty] = mapped_column(
        SQLEnum(QuizDifficulty, name="quiz_difficulty_enum", native_enum=False),
        default=QuizDifficulty.MEDIUM,
        nullable=False
    )
    time_limit_minutes: Mapped[int] = mapped_column(Integer, default=15, nullable=False)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
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
    category: Mapped["Category | None"] = relationship("Category", back_populates="quizzes")
    creator: Mapped["User"] = relationship("User", back_populates="created_quizzes")
    questions: Mapped[List["Question"]] = relationship(
        "Question", back_populates="quiz", cascade="all, delete-orphan", order_by="Question.order"
    )
    attempts: Mapped[List["Attempt"]] = relationship(
        "Attempt", back_populates="quiz", cascade="all, delete-orphan"
    )
