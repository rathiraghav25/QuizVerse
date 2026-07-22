from datetime import datetime, timezone
from sqlalchemy import Float, Boolean, DateTime, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, TYPE_CHECKING

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.quiz import Quiz
    from app.models.question import Question, QuestionOption


class Attempt(Base):
    __tablename__ = "attempts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    quiz_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    total_questions: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    correct_answers: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    time_taken_seconds: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    quiz: Mapped["Quiz"] = relationship("Quiz", back_populates="attempts")
    user: Mapped["User"] = relationship("User", back_populates="attempts")
    answers: Mapped[List["AttemptAnswer"]] = relationship(
        "AttemptAnswer", back_populates="attempt", cascade="all, delete-orphan"
    )


class AttemptAnswer(Base):
    __tablename__ = "attempt_answers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    attempt_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("attempts.id", ondelete="CASCADE"), nullable=False, index=True
    )
    question_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    selected_option_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("question_options.id", ondelete="SET NULL"), nullable=True
    )
    is_correct: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    attempt: Mapped["Attempt"] = relationship("Attempt", back_populates="answers")
    question: Mapped["Question"] = relationship("Question")
    selected_option: Mapped["QuestionOption | None"] = relationship("QuestionOption")
