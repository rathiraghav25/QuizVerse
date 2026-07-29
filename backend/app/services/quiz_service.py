import math
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User, UserRole
from app.models.quiz import QuizDifficulty, Quiz
from app.repositories.quiz_repository import QuizRepository
from app.repositories.category_repository import CategoryRepository
from app.repositories.question_repository import QuestionRepository
from app.schemas.quiz import QuizCreate, QuizUpdate, QuizResponse, QuizPaginatedResponse
from app.schemas.question import QuestionResponse


class QuizService:
    """Business logic for Quiz management."""

    def __init__(self, db: Session):
        self.db = db
        self.quiz_repo = QuizRepository(db)
        self.category_repo = CategoryRepository(db)
        self.question_repo = QuestionRepository(db)

    def _check_quiz_permission(self, quiz: Quiz, user: User) -> None:
        if user.role == UserRole.ADMIN:
            return
        if quiz.creator_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to modify this quiz."
            )

    def create_quiz(self, quiz_in: QuizCreate, current_user: User) -> QuizResponse:
        if quiz_in.category_id is not None:
            category = self.category_repo.get_by_id(quiz_in.category_id)
            if not category:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Category with ID {quiz_in.category_id} not found."
                )

        quiz = self.quiz_repo.create(quiz_in, creator_id=current_user.id)
        res = QuizResponse.model_validate(quiz)
        res.question_count = 0
        return res

    def update_quiz(self, quiz_id: int, quiz_in: QuizUpdate, current_user: User) -> QuizResponse:
        quiz = self.quiz_repo.get_by_id(quiz_id)
        if not quiz:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Quiz with ID {quiz_id} not found."
            )

        self._check_quiz_permission(quiz, current_user)

        if quiz_in.category_id is not None:
            category = self.category_repo.get_by_id(quiz_in.category_id)
            if not category:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Category with ID {quiz_in.category_id} not found."
                )

        updated = self.quiz_repo.update(quiz, quiz_in)
        questions = self.question_repo.get_questions_by_quiz(quiz_id)
        res = QuizResponse.model_validate(updated)
        res.question_count = len(questions)
        return res

    def delete_quiz(self, quiz_id: int, current_user: User) -> None:
        quiz = self.quiz_repo.get_by_id(quiz_id)
        if not quiz:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Quiz with ID {quiz_id} not found."
            )

        self._check_quiz_permission(quiz, current_user)
        self.quiz_repo.delete(quiz)

    def toggle_publish(self, quiz_id: int, is_published: bool, current_user: User) -> QuizResponse:
        quiz = self.quiz_repo.get_by_id(quiz_id)
        if not quiz:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Quiz with ID {quiz_id} not found."
            )

        self._check_quiz_permission(quiz, current_user)

        if is_published:
            questions = self.question_repo.get_questions_by_quiz(quiz_id)
            if len(questions) == 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot publish quiz: A quiz must have at least one question before publishing."
                )
            for idx, q in enumerate(questions, start=1):
                if len(q.options) < 2:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Cannot publish quiz: Question {idx} must have at least 2 options."
                    )
                correct_count = sum(1 for opt in q.options if opt.is_correct)
                if correct_count != 1:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Cannot publish quiz: Question {idx} must have exactly 1 correct option (found {correct_count})."
                    )

        updated = self.quiz_repo.set_published(quiz, is_published)
        questions = self.question_repo.get_questions_by_quiz(quiz_id)
        res = QuizResponse.model_validate(updated)
        res.question_count = len(questions)
        return res

    def get_quiz(self, quiz_id: int, current_user: Optional[User] = None) -> QuizResponse:
        quiz = self.quiz_repo.get_by_id(quiz_id, include_questions=True)
        if not quiz:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Quiz with ID {quiz_id} not found."
            )

        # If student and quiz is unpublished, deny access
        if (not current_user or current_user.role == UserRole.STUDENT) and not quiz.is_published:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This quiz is not published."
            )

        questions = self.question_repo.get_questions_by_quiz(quiz_id)
        res = QuizResponse.model_validate(quiz)
        res.question_count = len(questions)
        res.questions = [QuestionResponse.model_validate(q) for q in questions]
        return res

    def list_quizzes(
        self,
        page: int = 1,
        page_size: int = 10,
        search: Optional[str] = None,
        category_id: Optional[int] = None,
        difficulty: Optional[QuizDifficulty] = None,
        is_published: Optional[bool] = None,
        current_user: Optional[User] = None,
    ) -> QuizPaginatedResponse:
        # If student, force is_published=True
        filter_published = is_published
        if current_user and current_user.role == UserRole.STUDENT:
            filter_published = True

        quizzes, total = self.quiz_repo.list_quizzes(
            page=page,
            page_size=page_size,
            search=search,
            category_id=category_id,
            difficulty=difficulty,
            is_published=filter_published,
        )

        items = []
        for q in quizzes:
            questions = self.question_repo.get_questions_by_quiz(q.id)
            res = QuizResponse.model_validate(q)
            res.question_count = len(questions)
            items.append(res)

        total_pages = math.ceil(total / page_size) if total > 0 else 1

        return QuizPaginatedResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )
