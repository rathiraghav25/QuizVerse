from typing import Optional, List, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, func

from app.models.quiz import Quiz, QuizDifficulty
from app.schemas.quiz import QuizCreate, QuizUpdate


class QuizRepository:
    """Data Access Layer for Quiz entity."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, quiz_id: int, include_questions: bool = False) -> Optional[Quiz]:
        stmt = select(Quiz).where(Quiz.id == quiz_id).options(joinedload(Quiz.category))
        if include_questions:
            stmt = stmt.options(joinedload(Quiz.questions).joinedload(Quiz.questions.property.mapper.class_.options))
        return self.db.execute(stmt).unique().scalar_one_or_none()

    def create(self, quiz_in: QuizCreate, creator_id: int) -> Quiz:
        db_quiz = Quiz(
            title=quiz_in.title.strip(),
            description=quiz_in.description,
            category_id=quiz_in.category_id,
            creator_id=creator_id,
            difficulty=quiz_in.difficulty,
            time_limit_minutes=quiz_in.time_limit_minutes,
            is_published=False
        )
        self.db.add(db_quiz)
        self.db.commit()
        self.db.refresh(db_quiz)
        return db_quiz

    def update(self, db_quiz: Quiz, quiz_in: QuizUpdate) -> Quiz:
        update_data = quiz_in.model_dump(exclude_unset=True)
        if "title" in update_data and update_data["title"]:
            update_data["title"] = update_data["title"].strip()
        for field, value in update_data.items():
            setattr(db_quiz, field, value)
        self.db.commit()
        self.db.refresh(db_quiz)
        return db_quiz

    def set_published(self, db_quiz: Quiz, is_published: bool) -> Quiz:
        db_quiz.is_published = is_published
        self.db.commit()
        self.db.refresh(db_quiz)
        return db_quiz

    def delete(self, db_quiz: Quiz) -> None:
        self.db.delete(db_quiz)
        self.db.commit()

    def list_quizzes(
        self,
        page: int = 1,
        page_size: int = 10,
        search: Optional[str] = None,
        category_id: Optional[int] = None,
        difficulty: Optional[QuizDifficulty] = None,
        is_published: Optional[bool] = None,
        creator_id: Optional[int] = None,
    ) -> Tuple[List[Quiz], int]:
        stmt = select(Quiz).options(joinedload(Quiz.category))

        if search:
            stmt = stmt.where(Quiz.title.ilike(f"%{search.strip()}%"))
        if category_id is not None:
            stmt = stmt.where(Quiz.category_id == category_id)
        if difficulty is not None:
            stmt = stmt.where(Quiz.difficulty == difficulty)
        if is_published is not None:
            stmt = stmt.where(Quiz.is_published == is_published)
        if creator_id is not None:
            stmt = stmt.where(Quiz.creator_id == creator_id)

        # Count total matching
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = self.db.execute(count_stmt).scalar() or 0

        # Pagination & Ordering
        offset = (page - 1) * page_size
        stmt = stmt.order_by(Quiz.created_at.desc()).offset(offset).limit(page_size)

        quizzes = list(self.db.execute(stmt).unique().scalars().all())
        return quizzes, total
