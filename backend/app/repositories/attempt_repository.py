from datetime import datetime, timezone
from typing import Optional, List, Dict
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select

from app.models.attempt import Attempt, AttemptAnswer
from app.models.question import QuestionOption


class AttemptRepository:
    """Data Access Layer for Attempt and AttemptAnswer entities."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, attempt_id: int) -> Optional[Attempt]:
        stmt = (
            select(Attempt)
            .where(Attempt.id == attempt_id)
            .options(
                joinedload(Attempt.quiz),
                joinedload(Attempt.user),
                joinedload(Attempt.answers).joinedload(AttemptAnswer.question),
                joinedload(Attempt.answers).joinedload(AttemptAnswer.selected_option),
            )
        )
        return self.db.execute(stmt).unique().scalar_one_or_none()

    def get_active_attempt(self, user_id: int, quiz_id: int) -> Optional[Attempt]:
        stmt = (
            select(Attempt)
            .where(
                Attempt.user_id == user_id,
                Attempt.quiz_id == quiz_id,
                Attempt.is_completed == False
            )
            .options(joinedload(Attempt.quiz))
        )
        return self.db.execute(stmt).unique().scalar_one_or_none()

    def create_attempt(self, user_id: int, quiz_id: int) -> Attempt:
        db_attempt = Attempt(
            user_id=user_id,
            quiz_id=quiz_id,
            score=0.0,
            total_questions=0,
            correct_answers=0,
            time_taken_seconds=0,
            is_completed=False,
            started_at=datetime.now(timezone.utc)
        )
        self.db.add(db_attempt)
        self.db.commit()
        self.db.refresh(db_attempt)
        return db_attempt

    def get_answers_for_attempt(self, attempt_id: int) -> List[AttemptAnswer]:
        stmt = (
            select(AttemptAnswer)
            .where(AttemptAnswer.attempt_id == attempt_id)
            .options(joinedload(AttemptAnswer.question), joinedload(AttemptAnswer.selected_option))
        )
        return list(self.db.execute(stmt).unique().scalars().all())

    def save_answers(self, attempt_id: int, answers_map: Dict[int, Optional[int]]) -> None:
        """
        answers_map: question_id -> selected_option_id
        Upsert AttemptAnswer records for the specified attempt.
        """
        stmt = select(AttemptAnswer).where(AttemptAnswer.attempt_id == attempt_id)
        existing_answers = {ans.question_id: ans for ans in self.db.execute(stmt).scalars().all()}

        for q_id, opt_id in answers_map.items():
            if q_id in existing_answers:
                existing_answers[q_id].selected_option_id = opt_id
            else:
                new_ans = AttemptAnswer(
                    attempt_id=attempt_id,
                    question_id=q_id,
                    selected_option_id=opt_id,
                    is_correct=False
                )
                self.db.add(new_ans)

        self.db.commit()

    def finish_attempt(
        self,
        attempt: Attempt,
        score: float,
        total_questions: int,
        correct_answers: int,
        time_taken_seconds: int,
        completed_at: datetime
    ) -> Attempt:
        attempt.score = score
        attempt.total_questions = total_questions
        attempt.correct_answers = correct_answers
        attempt.time_taken_seconds = time_taken_seconds
        attempt.is_completed = True
        attempt.completed_at = completed_at

        self.db.commit()
        self.db.refresh(attempt)
        return attempt

    def update_attempt_answers_correctness(self, answer_correctness_map: Dict[int, bool]) -> None:
        """
        answer_correctness_map: attempt_answer_id -> is_correct
        """
        for ans_id, is_corr in answer_correctness_map.items():
            db_ans = self.db.get(AttemptAnswer, ans_id)
            if db_ans:
                db_ans.is_correct = is_corr
        self.db.commit()

    def list_user_attempts(self, user_id: int) -> List[Attempt]:
        stmt = (
            select(Attempt)
            .where(Attempt.user_id == user_id)
            .options(joinedload(Attempt.quiz), joinedload(Attempt.user))
            .order_by(Attempt.started_at.desc())
        )
        return list(self.db.execute(stmt).unique().scalars().all())

    def list_quiz_attempts(self, quiz_id: int) -> List[Attempt]:
        stmt = (
            select(Attempt)
            .where(Attempt.quiz_id == quiz_id)
            .options(joinedload(Attempt.quiz), joinedload(Attempt.user))
            .order_by(Attempt.started_at.desc())
        )
        return list(self.db.execute(stmt).unique().scalars().all())
