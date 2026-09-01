from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, func

from app.models.attempt import Attempt, AttemptAnswer
from app.models.quiz import Quiz
from app.models.question import Question, QuestionOption


class AnalyticsRepository:
    """Data Access Layer for Leaderboard and Quiz Analytics aggregations."""

    def __init__(self, db: Session):
        self.db = db

    def get_leaderboard_attempts(self, quiz_id: int, limit: int = 100) -> List[Attempt]:
        """
        Fetch completed attempts for a quiz sorted by score (desc), time taken (asc), and completed timestamp (asc).
        """
        stmt = (
            select(Attempt)
            .where(Attempt.quiz_id == quiz_id, Attempt.is_completed == True)
            .options(joinedload(Attempt.user), joinedload(Attempt.quiz))
            .order_by(
                Attempt.score.desc(),
                Attempt.time_taken_seconds.asc(),
                Attempt.completed_at.asc()
            )
            .limit(limit)
        )
        return list(self.db.execute(stmt).unique().scalars().all())

    def get_all_attempts_for_quiz(self, quiz_id: int) -> List[Attempt]:
        """Fetch all attempts (both active and completed) for a quiz."""
        stmt = (
            select(Attempt)
            .where(Attempt.quiz_id == quiz_id)
            .options(joinedload(Attempt.user))
        )
        return list(self.db.execute(stmt).scalars().all())

    def get_question_answers_stats(self, quiz_id: int) -> List[AttemptAnswer]:
        """Fetch all attempt answers for completed attempts of a quiz."""
        stmt = (
            select(AttemptAnswer)
            .join(Attempt, AttemptAnswer.attempt_id == Attempt.id)
            .where(Attempt.quiz_id == quiz_id, Attempt.is_completed == True)
            .options(
                joinedload(AttemptAnswer.question),
                joinedload(AttemptAnswer.selected_option)
            )
        )
        return list(self.db.execute(stmt).unique().scalars().all())
