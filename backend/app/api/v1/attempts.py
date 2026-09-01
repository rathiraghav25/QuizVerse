from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_active_user, require_teacher_or_admin
from app.models.user import User
from app.schemas.attempt import (
    AttemptStartResponse, SaveAnswersRequest, AttemptResultResponse, AttemptSummaryResponse
)
from app.services.attempt_service import AttemptService

router = APIRouter()


@router.post(
    "/quizzes/{quiz_id}/attempts",
    response_model=AttemptStartResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Start a new quiz attempt or resume active attempt (Student)"
)
def start_quiz_attempt(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    service = AttemptService(db)
    return service.start_attempt(quiz_id, current_user)


@router.put(
    "/attempts/{attempt_id}/answers",
    summary="Save / Autosave draft answers for an active attempt (Student)"
)
def save_attempt_answers(
    attempt_id: int,
    save_in: SaveAnswersRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    service = AttemptService(db)
    return service.save_answers(attempt_id, save_in, current_user)


@router.post(
    "/attempts/{attempt_id}/submit",
    response_model=AttemptResultResponse,
    summary="Finish and submit a quiz attempt for final scoring (Student)"
)
def submit_quiz_attempt(
    attempt_id: int,
    save_in: Optional[SaveAnswersRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    service = AttemptService(db)
    return service.submit_attempt(attempt_id, save_in, current_user)


@router.get(
    "/attempts/me",
    response_model=List[AttemptSummaryResponse],
    summary="Get list of previous quiz attempts for current user"
)
def get_my_attempts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    service = AttemptService(db)
    return service.list_my_attempts(current_user)


@router.get(
    "/attempts/{attempt_id}/result",
    response_model=AttemptResultResponse,
    summary="Get detailed result review for a completed attempt"
)
def get_attempt_result(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    service = AttemptService(db)
    return service.get_attempt_result(attempt_id, current_user)


@router.get(
    "/quizzes/{quiz_id}/attempts",
    response_model=List[AttemptSummaryResponse],
    summary="Get attempt history for a specific quiz (Creator Teacher/Admin only)"
)
def get_quiz_attempts(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher_or_admin)
):
    service = AttemptService(db)
    return service.list_quiz_attempts(quiz_id, current_user)
