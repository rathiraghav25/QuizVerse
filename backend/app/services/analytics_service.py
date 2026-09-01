from typing import Optional, List, Dict
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User, UserRole
from app.models.quiz import Quiz
from app.repositories.quiz_repository import QuizRepository
from app.repositories.question_repository import QuestionRepository
from app.repositories.analytics_repository import AnalyticsRepository
from app.schemas.leaderboard import LeaderboardEntry, QuizLeaderboardResponse
from app.schemas.analytics import OptionAnalytics, QuestionAnalytics, QuizAnalyticsResponse


class AnalyticsService:
    """Business logic for Leaderboard ranking and Quiz Analytics Dashboard."""

    def __init__(self, db: Session):
        self.db = db
        self.quiz_repo = QuizRepository(db)
        self.question_repo = QuestionRepository(db)
        self.analytics_repo = AnalyticsRepository(db)

    def get_quiz_leaderboard(self, quiz_id: int, current_user: Optional[User] = None, limit: int = 100) -> QuizLeaderboardResponse:
        quiz = self.quiz_repo.get_by_id(quiz_id)
        if not quiz:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Quiz with ID {quiz_id} not found."
            )

        # Students cannot view leaderboard of unpublished quiz
        if (not current_user or current_user.role == UserRole.STUDENT) and not quiz.is_published:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This quiz is not published."
            )

        attempts = self.analytics_repo.get_leaderboard_attempts(quiz_id, limit=limit)

        entries: List[LeaderboardEntry] = []
        current_rank = 0
        prev_key = None

        for idx, att in enumerate(attempts, start=1):
            key = (att.score, att.time_taken_seconds, att.completed_at)
            if key != prev_key:
                current_rank = idx
                prev_key = key

            user_name = att.user.full_name if att.user else "Anonymous User"
            percentage = round((att.correct_answers / att.total_questions * 100.0), 2) if att.total_questions > 0 else att.score

            entries.append(
                LeaderboardEntry(
                    rank=current_rank,
                    attempt_id=att.id,
                    user_id=att.user_id,
                    user_name=user_name,
                    score=att.score,
                    percentage=percentage,
                    time_taken_seconds=att.time_taken_seconds,
                    completed_at=att.completed_at
                )
            )

        return QuizLeaderboardResponse(
            quiz_id=quiz.id,
            quiz_title=quiz.title,
            entries=entries,
            total_entries=len(entries)
        )

    def get_quiz_analytics(self, quiz_id: int, current_user: User) -> QuizAnalyticsResponse:
        quiz = self.quiz_repo.get_by_id(quiz_id)
        if not quiz:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Quiz with ID {quiz_id} not found."
            )

        # Access check: Only creator Teacher or Admin can access quiz analytics
        if current_user.role != UserRole.ADMIN and quiz.creator_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view analytics for this quiz."
            )

        all_attempts = self.analytics_repo.get_all_attempts_for_quiz(quiz_id)
        total_attempts = len(all_attempts)

        completed_attempts = [a for a in all_attempts if a.is_completed]
        completed_count = len(completed_attempts)
        completion_rate = round((completed_count / total_attempts * 100.0), 2) if total_attempts > 0 else 0.0

        if completed_count > 0:
            scores = [a.score for a in completed_attempts]
            average_score = round(sum(scores) / completed_count, 2)
            highest_score = round(max(scores), 2)
            lowest_score = round(min(scores), 2)
            times = [a.time_taken_seconds for a in completed_attempts]
            average_time_taken_seconds = round(sum(times) / completed_count, 2)
        else:
            average_score = 0.0
            highest_score = 0.0
            lowest_score = 0.0
            average_time_taken_seconds = 0.0

        # Question level analytics
        questions = self.question_repo.get_questions_by_quiz(quiz_id)
        attempt_answers = self.analytics_repo.get_question_answers_stats(quiz_id)

        # Group attempt answers by question_id
        answers_by_q: Dict[int, List[Any]] = {q.id: [] for q in questions}
        for ans in attempt_answers:
            if ans.question_id in answers_by_q:
                answers_by_q[ans.question_id].append(ans)

        question_analytics: List[QuestionAnalytics] = []
        for q in questions:
            q_answers = answers_by_q.get(q.id, [])
            q_total_ans = len(q_answers)
            q_correct_ans = sum(1 for ans in q_answers if ans.is_correct)
            q_accuracy = round((q_correct_ans / q_total_ans * 100.0), 2) if q_total_ans > 0 else 0.0

            # Count option selections
            option_counts: Dict[int, int] = {opt.id: 0 for opt in q.options}
            for ans in q_answers:
                if ans.selected_option_id and ans.selected_option_id in option_counts:
                    option_counts[ans.selected_option_id] += 1

            option_analytics: List[OptionAnalytics] = []
            for opt in q.options:
                sel_count = option_counts.get(opt.id, 0)
                sel_percentage = round((sel_count / q_total_ans * 100.0), 2) if q_total_ans > 0 else 0.0
                option_analytics.append(
                    OptionAnalytics(
                        option_id=opt.id,
                        option_text=opt.option_text,
                        is_correct=opt.is_correct,
                        selection_count=sel_count,
                        selection_percentage=sel_percentage
                    )
                )

            question_analytics.append(
                QuestionAnalytics(
                    question_id=q.id,
                    question_text=q.text,
                    order=q.order,
                    total_answers=q_total_ans,
                    correct_answers=q_correct_ans,
                    accuracy_percentage=q_accuracy,
                    options=option_analytics
                )
            )

        return QuizAnalyticsResponse(
            quiz_id=quiz.id,
            quiz_title=quiz.title,
            total_attempts=total_attempts,
            completed_attempts=completed_count,
            completion_rate=completion_rate,
            average_score=average_score,
            highest_score=highest_score,
            lowest_score=lowest_score,
            average_time_taken_seconds=average_time_taken_seconds,
            question_analytics=question_analytics
        )
