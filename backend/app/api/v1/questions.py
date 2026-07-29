from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_teacher_or_admin, get_optional_current_user
from app.models.user import User
from app.schemas.question import (
    QuestionCreate, QuestionUpdate, QuestionReorderRequest, QuestionResponse
)
from app.services.question_service import QuestionService

router = APIRouter()


@router.post(
    "/quizzes/{quiz_id}/questions",
    response_model=QuestionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a new question to a quiz (Teacher/Admin only)"
)
def add_question(
    quiz_id: int,
    question_in: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher_or_admin)
):
    service = QuestionService(db)
    return service.add_question(quiz_id, question_in, current_user)


@router.get(
    "/quizzes/{quiz_id}/questions",
    response_model=List[QuestionResponse],
    summary="Get all questions for a quiz"
)
def get_quiz_questions(
    quiz_id: int,
    db: Session = Depends(get_db)
):
    service = QuestionService(db)
    return service.get_questions_for_quiz(quiz_id)


@router.put(
    "/questions/{question_id}",
    response_model=QuestionResponse,
    summary="Update a question and its options (Teacher/Admin only)"
)
def update_question(
    question_id: int,
    question_in: QuestionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher_or_admin)
):
    service = QuestionService(db)
    return service.update_question(question_id, question_in, current_user)


@router.delete(
    "/questions/{question_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a question (Teacher/Admin only)"
)
def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher_or_admin)
):
    service = QuestionService(db)
    service.delete_question(question_id, current_user)


@router.patch(
    "/quizzes/{quiz_id}/questions/reorder",
    response_model=List[QuestionResponse],
    summary="Reorder questions in a quiz (Teacher/Admin only)"
)
def reorder_questions(
    quiz_id: int,
    reorder_in: QuestionReorderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher_or_admin)
):
    service = QuestionService(db)
    return service.reorder_questions(quiz_id, reorder_in, current_user)
