from typing import List, Dict
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User, UserRole
from app.models.question import Question
from app.models.quiz import Quiz
from app.repositories.question_repository import QuestionRepository
from app.repositories.quiz_repository import QuizRepository
from app.schemas.question import QuestionCreate, QuestionUpdate, QuestionResponse, QuestionReorderRequest


class QuestionService:
    """Business logic for Question and Option management."""

    def __init__(self, db: Session):
        self.db = db
        self.question_repo = QuestionRepository(db)
        self.quiz_repo = QuizRepository(db)

    def _check_quiz_permission(self, quiz: Quiz, user: User) -> None:
        if user.role == UserRole.ADMIN:
            return
        if quiz.creator_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to modify questions for this quiz."
            )

    def _validate_options(self, options) -> None:
        if len(options) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Question must have at least 2 options."
            )
        correct_count = sum(1 for opt in options if (opt.is_correct if hasattr(opt, 'is_correct') else opt.get('is_correct')))
        if correct_count != 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Question must have exactly 1 correct option (found {correct_count})."
            )

    def add_question(self, quiz_id: int, question_in: QuestionCreate, current_user: User) -> QuestionResponse:
        quiz = self.quiz_repo.get_by_id(quiz_id)
        if not quiz:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Quiz with ID {quiz_id} not found."
            )

        self._check_quiz_permission(quiz, current_user)
        self._validate_options(question_in.options)

        question = self.question_repo.create_question(quiz_id, question_in)
        return QuestionResponse.model_validate(question)

    def update_question(self, question_id: int, question_in: QuestionUpdate, current_user: User) -> QuestionResponse:
        question = self.question_repo.get_by_id(question_id)
        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Question with ID {question_id} not found."
            )

        quiz = self.quiz_repo.get_by_id(question.quiz_id)
        self._check_quiz_permission(quiz, current_user)

        if question_in.options is not None:
            self._validate_options(question_in.options)

        updated = self.question_repo.update_question(question, question_in)
        return QuestionResponse.model_validate(updated)

    def delete_question(self, question_id: int, current_user: User) -> None:
        question = self.question_repo.get_by_id(question_id)
        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Question with ID {question_id} not found."
            )

        quiz = self.quiz_repo.get_by_id(question.quiz_id)
        self._check_quiz_permission(quiz, current_user)

        self.question_repo.delete_question(question)

    def get_questions_for_quiz(self, quiz_id: int) -> List[QuestionResponse]:
        quiz = self.quiz_repo.get_by_id(quiz_id)
        if not quiz:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Quiz with ID {quiz_id} not found."
            )

        questions = self.question_repo.get_questions_by_quiz(quiz_id)
        return [QuestionResponse.model_validate(q) for q in questions]

    def reorder_questions(self, quiz_id: int, reorder_in: QuestionReorderRequest, current_user: User) -> List[QuestionResponse]:
        quiz = self.quiz_repo.get_by_id(quiz_id)
        if not quiz:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Quiz with ID {quiz_id} not found."
            )

        self._check_quiz_permission(quiz, current_user)

        orders_dict = {item.question_id: item.order for item in reorder_in.orders}
        reordered = self.question_repo.reorder_questions(quiz_id, orders_dict)
        return [QuestionResponse.model_validate(q) for q in reordered]
