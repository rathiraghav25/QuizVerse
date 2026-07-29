from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_teacher_or_admin, get_optional_current_user
from app.models.user import User
from app.models.quiz import QuizDifficulty
from app.schemas.quiz import (
    QuizCreate, QuizUpdate, QuizPublishUpdate, QuizResponse, QuizPaginatedResponse
)
from app.services.quiz_service import QuizService

router = APIRouter()


@router.post(
    "",
    response_model=QuizResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new quiz (Teacher/Admin only)"
)
def create_quiz(
    quiz_in: QuizCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher_or_admin)
):
    service = QuizService(db)
    return service.create_quiz(quiz_in, current_user)


@router.get(
    "",
    response_model=QuizPaginatedResponse,
    summary="Get paginated list of quizzes with filters and search"
)
def list_quizzes(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    difficulty: Optional[QuizDifficulty] = Query(None),
    is_published: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    service = QuizService(db)
    return service.list_quizzes(
        page=page,
        page_size=page_size,
        search=search,
        category_id=category_id,
        difficulty=difficulty,
        is_published=is_published,
        current_user=current_user
    )


@router.get(
    "/{quiz_id}",
    response_model=QuizResponse,
    summary="Get quiz by ID (including questions and options)"
)
def get_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    service = QuizService(db)
    return service.get_quiz(quiz_id, current_user)


@router.put(
    "/{quiz_id}",
    response_model=QuizResponse,
    summary="Update quiz details (Creator Teacher/Admin only)"
)
def update_quiz(
    quiz_id: int,
    quiz_in: QuizUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher_or_admin)
):
    service = QuizService(db)
    return service.update_quiz(quiz_id, quiz_in, current_user)


@router.patch(
    "/{quiz_id}/publish",
    response_model=QuizResponse,
    summary="Publish or unpublish a quiz (Creator Teacher/Admin only)"
)
def toggle_publish(
    quiz_id: int,
    publish_in: QuizPublishUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher_or_admin)
):
    service = QuizService(db)
    return service.toggle_publish(quiz_id, publish_in.is_published, current_user)


@router.delete(
    "/{quiz_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a quiz (Creator Teacher/Admin only)"
)
def delete_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher_or_admin)
):
    service = QuizService(db)
    service.delete_quiz(quiz_id, current_user)
