from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_optional_current_user, get_current_active_user, require_teacher_or_admin
from app.models.user import User
from app.schemas.leaderboard import QuizLeaderboardResponse
from app.schemas.analytics import QuizAnalyticsResponse
from app.services.analytics_service import AnalyticsService

router = APIRouter()


@router.get(
    "/quizzes/{quiz_id}/leaderboard",
    response_model=QuizLeaderboardResponse,
    summary="Get leaderboard rankings for a completed quiz"
)
def get_quiz_leaderboard(
    quiz_id: int,
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Retrieve ranked list of completed attempts for a quiz.
    Attempts are ranked by score (desc), time taken (asc), and completion timestamp (asc).
    """
    service = AnalyticsService(db)
    return service.get_quiz_leaderboard(quiz_id, current_user, limit=limit)


@router.get(
    "/quizzes/{quiz_id}/analytics",
    response_model=QuizAnalyticsResponse,
    summary="Get detailed performance analytics for a quiz (Quiz Creator Teacher/Admin only)"
)
def get_quiz_analytics(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher_or_admin)
):
    """
    Retrieve aggregated analytics including total attempts, completion rate, score distributions, and question accuracy stats.
    """
    service = AnalyticsService(db)
    return service.get_quiz_analytics(quiz_id, current_user)
