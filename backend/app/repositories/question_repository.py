from typing import Optional, List, Dict
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select

from app.models.question import Question, QuestionOption
from app.schemas.question import QuestionCreate, QuestionUpdate, QuestionOptionCreate


class QuestionRepository:
    """Data Access Layer for Question and QuestionOption entities."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, question_id: int) -> Optional[Question]:
        stmt = select(Question).where(Question.id == question_id).options(joinedload(Question.options))
        return self.db.execute(stmt).unique().scalar_one_or_none()

    def get_questions_by_quiz(self, quiz_id: int) -> List[Question]:
        stmt = (
            select(Question)
            .where(Question.quiz_id == quiz_id)
            .options(joinedload(Question.options))
            .order_by(Question.order.asc(), Question.id.asc())
        )
        return list(self.db.execute(stmt).unique().scalars().all())

    def create_question(self, quiz_id: int, question_in: QuestionCreate) -> Question:
        db_question = Question(
            quiz_id=quiz_id,
            text=question_in.text.strip(),
            image_url=question_in.image_url,
            explanation=question_in.explanation,
            order=question_in.order
        )
        self.db.add(db_question)
        self.db.flush()  # assign db_question.id

        for opt in question_in.options:
            db_option = QuestionOption(
                question_id=db_question.id,
                option_text=opt.option_text.strip(),
                is_correct=opt.is_correct
            )
            self.db.add(db_option)

        self.db.commit()
        self.db.refresh(db_question)
        return db_question

    def update_question(self, db_question: Question, question_in: QuestionUpdate) -> Question:
        update_data = question_in.model_dump(exclude_unset=True)

        options_data = update_data.pop("options", None)

        if "text" in update_data and update_data["text"]:
            update_data["text"] = update_data["text"].strip()

        for field, value in update_data.items():
            setattr(db_question, field, value)

        if options_data is not None:
            # Replace options
            for opt in db_question.options:
                self.db.delete(opt)
            self.db.flush()

            for opt in options_data:
                db_option = QuestionOption(
                    question_id=db_question.id,
                    option_text=opt["option_text"].strip(),
                    is_correct=opt["is_correct"]
                )
                self.db.add(db_option)

        self.db.commit()
        self.db.refresh(db_question)
        return db_question

    def delete_question(self, db_question: Question) -> None:
        self.db.delete(db_question)
        self.db.commit()

    def reorder_questions(self, quiz_id: int, orders: Dict[int, int]) -> List[Question]:
        """
        orders: map of question_id -> order integer
        """
        stmt = select(Question).where(Question.quiz_id == quiz_id)
        questions = list(self.db.execute(stmt).scalars().all())

        for q in questions:
            if q.id in orders:
                q.order = orders[q.id]

        self.db.commit()
        return self.get_questions_by_quiz(quiz_id)
