from datetime import datetime, timezone
from typing import Optional, List, Dict
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User, UserRole
from app.models.attempt import Attempt
from app.models.quiz import Quiz
from app.models.question import Question, QuestionOption
from app.repositories.attempt_repository import AttemptRepository
from app.repositories.quiz_repository import QuizRepository
from app.repositories.question_repository import QuestionRepository
from app.schemas.question import QuestionOptionResponse
from app.schemas.attempt import (
    StudentQuestionOptionResponse, StudentQuestionResponse, AttemptStartResponse,
    SaveAnswersRequest, AttemptAnswerDetailResponse, AttemptResultResponse, AttemptSummaryResponse
)


class AttemptService:
    """Business logic for Quiz Attempt execution, answer submission, and scoring."""

    def __init__(self, db: Session):
        self.db = db
        self.attempt_repo = AttemptRepository(db)
        self.quiz_repo = QuizRepository(db)
        self.question_repo = QuestionRepository(db)

    def start_attempt(self, quiz_id: int, current_user: User) -> AttemptStartResponse:
        quiz = self.quiz_repo.get_by_id(quiz_id)
        if not quiz:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Quiz with ID {quiz_id} not found."
            )

        if not quiz.is_published:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot start attempt on an unpublished quiz."
            )

        # Check for active (uncompleted) attempt
        active_attempt = self.attempt_repo.get_active_attempt(current_user.id, quiz_id)
        if active_attempt:
            attempt = active_attempt
        else:
            attempt = self.attempt_repo.create_attempt(current_user.id, quiz_id)

        # Fetch questions for quiz
        questions = self.question_repo.get_questions_by_quiz(quiz_id)
        
        # Build student questions (WITHOUT exposing is_correct or explanation)
        student_questions = []
        for q in questions:
            opts = [
                StudentQuestionOptionResponse(id=opt.id, option_text=opt.option_text)
                for opt in q.options
            ]
            student_questions.append(
                StudentQuestionResponse(
                    id=q.id,
                    text=q.text,
                    image_url=q.image_url,
                    order=q.order,
                    options=opts
                )
            )

        # Build current answers dictionary
        current_answers_list = self.attempt_repo.get_answers_for_attempt(attempt.id)
        current_answers = {ans.question_id: ans.selected_option_id for ans in current_answers_list}

        return AttemptStartResponse(
            id=attempt.id,
            quiz_id=quiz.id,
            quiz_title=quiz.title,
            quiz_description=quiz.description,
            time_limit_minutes=quiz.time_limit_minutes,
            started_at=attempt.started_at,
            is_completed=attempt.is_completed,
            questions=student_questions,
            current_answers=current_answers
        )

    def save_answers(self, attempt_id: int, save_in: SaveAnswersRequest, current_user: User) -> Dict[str, str]:
        attempt = self.attempt_repo.get_by_id(attempt_id)
        if not attempt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Attempt with ID {attempt_id} not found."
            )

        if attempt.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to modify this attempt."
            )

        if attempt.is_completed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot modify answers on a completed attempt."
            )

        # Fetch all questions and valid options for this quiz
        questions = self.question_repo.get_questions_by_quiz(attempt.quiz_id)
        valid_question_ids = {q.id for q in questions}
        valid_question_options = {q.id: {opt.id for opt in q.options} for q in questions}

        answers_map: Dict[int, Optional[int]] = {}
        for item in save_in.answers:
            if item.question_id not in valid_question_ids:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Question ID {item.question_id} does not belong to quiz {attempt.quiz_id}."
                )

            if item.selected_option_id is not None:
                if item.selected_option_id not in valid_question_options[item.question_id]:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Option ID {item.selected_option_id} is invalid for question {item.question_id}."
                    )

            answers_map[item.question_id] = item.selected_option_id

        self.attempt_repo.save_answers(attempt.id, answers_map)
        return {"status": "success", "message": "Answers saved successfully."}

    def submit_attempt(self, attempt_id: int, save_in: Optional[SaveAnswersRequest], current_user: User) -> AttemptResultResponse:
        attempt = self.attempt_repo.get_by_id(attempt_id)
        if not attempt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Attempt with ID {attempt_id} not found."
            )

        if attempt.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to submit this attempt."
            )

        if attempt.is_completed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Attempt has already been submitted."
            )

        # Save any final answers provided in submission payload
        if save_in:
            self.save_answers(attempt_id, save_in, current_user)

        completed_at = datetime.now(timezone.utc)
        questions = self.question_repo.get_questions_by_quiz(attempt.quiz_id)
        total_questions = len(questions)

        # Retrieve saved answers
        saved_answers = self.attempt_repo.get_answers_for_attempt(attempt.id)
        answers_by_qid = {ans.question_id: ans for ans in saved_answers}

        correct_answers_count = 0
        answer_correctness_updates: Dict[int, bool] = {}

        for q in questions:
            correct_opt = next((opt for opt in q.options if opt.is_correct), None)
            correct_opt_id = correct_opt.id if correct_opt else None

            ans_record = answers_by_qid.get(q.id)
            if ans_record and ans_record.selected_option_id and ans_record.selected_option_id == correct_opt_id:
                correct_answers_count += 1
                if ans_record.id:
                    answer_correctness_updates[ans_record.id] = True
            else:
                if ans_record and ans_record.id:
                    answer_correctness_updates[ans_record.id] = False

        percentage = round((correct_answers_count / total_questions * 100.0), 2) if total_questions > 0 else 0.0
        started_at = attempt.started_at
        if started_at.tzinfo is None:
            started_at = started_at.replace(tzinfo=timezone.utc)
        time_taken_seconds = max(1, int((completed_at - started_at).total_seconds()))

        # Update answer correctness records
        if answer_correctness_updates:
            self.attempt_repo.update_attempt_answers_correctness(answer_correctness_updates)

        # Lock & update attempt in DB
        updated_attempt = self.attempt_repo.finish_attempt(
            attempt=attempt,
            score=percentage,
            total_questions=total_questions,
            correct_answers=correct_answers_count,
            time_taken_seconds=time_taken_seconds,
            completed_at=completed_at
        )

        return self.get_attempt_result(updated_attempt.id, current_user)

    def get_attempt_result(self, attempt_id: int, current_user: User) -> AttemptResultResponse:
        attempt = self.attempt_repo.get_by_id(attempt_id)
        if not attempt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Attempt with ID {attempt_id} not found."
            )

        # Access check
        if current_user.role == UserRole.STUDENT and attempt.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view this attempt result."
            )
        elif current_user.role == UserRole.TEACHER:
            if attempt.quiz.creator_id != current_user.id and attempt.user_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to view attempt results for this quiz."
                )

        questions = self.question_repo.get_questions_by_quiz(attempt.quiz_id)
        saved_answers = self.attempt_repo.get_answers_for_attempt(attempt.id)
        answers_by_qid = {ans.question_id: ans for ans in saved_answers}

        answer_details = []
        for q in questions:
            correct_opt = next((opt for opt in q.options if opt.is_correct), None)
            correct_opt_id = correct_opt.id if correct_opt else 0

            ans_record = answers_by_qid.get(q.id)
            selected_opt_id = ans_record.selected_option_id if ans_record else None
            is_corr = (selected_opt_id == correct_opt_id) if selected_opt_id else False

            opt_responses = [QuestionOptionResponse.model_validate(opt) for opt in q.options]

            answer_details.append(
                AttemptAnswerDetailResponse(
                    question_id=q.id,
                    question_text=q.text,
                    image_url=q.image_url,
                    explanation=q.explanation,
                    selected_option_id=selected_opt_id,
                    correct_option_id=correct_opt_id,
                    is_correct=is_corr,
                    options=opt_responses
                )
            )

        percentage = round((attempt.correct_answers / attempt.total_questions * 100.0), 2) if attempt.total_questions > 0 else attempt.score

        return AttemptResultResponse(
            id=attempt.id,
            quiz_id=attempt.quiz_id,
            quiz_title=attempt.quiz.title if attempt.quiz else "Quiz",
            user_id=attempt.user_id,
            user_name=attempt.user.full_name if attempt.user else None,
            score=attempt.score,
            total_questions=attempt.total_questions,
            correct_answers=attempt.correct_answers,
            percentage=percentage,
            time_taken_seconds=attempt.time_taken_seconds,
            is_completed=attempt.is_completed,
            started_at=attempt.started_at,
            completed_at=attempt.completed_at,
            answer_details=answer_details
        )

    def list_my_attempts(self, current_user: User) -> List[AttemptSummaryResponse]:
        attempts = self.attempt_repo.list_user_attempts(current_user.id)
        res = []
        for att in attempts:
            percentage = round((att.correct_answers / att.total_questions * 100.0), 2) if att.total_questions > 0 else att.score
            res.append(
                AttemptSummaryResponse(
                    id=att.id,
                    quiz_id=att.quiz_id,
                    quiz_title=att.quiz.title if att.quiz else "Quiz",
                    user_id=att.user_id,
                    user_name=att.user.full_name if att.user else None,
                    score=att.score,
                    total_questions=att.total_questions,
                    correct_answers=att.correct_answers,
                    percentage=percentage,
                    time_taken_seconds=att.time_taken_seconds,
                    is_completed=att.is_completed,
                    started_at=att.started_at,
                    completed_at=att.completed_at
                )
            )
        return res

    def list_quiz_attempts(self, quiz_id: int, current_user: User) -> List[AttemptSummaryResponse]:
        quiz = self.quiz_repo.get_by_id(quiz_id)
        if not quiz:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Quiz with ID {quiz_id} not found."
            )

        if current_user.role != UserRole.ADMIN and quiz.creator_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view attempt history for this quiz."
            )

        attempts = self.attempt_repo.list_quiz_attempts(quiz_id)
        res = []
        for att in attempts:
            percentage = round((att.correct_answers / att.total_questions * 100.0), 2) if att.total_questions > 0 else att.score
            res.append(
                AttemptSummaryResponse(
                    id=att.id,
                    quiz_id=att.quiz_id,
                    quiz_title=att.quiz.title if att.quiz else "Quiz",
                    user_id=att.user_id,
                    user_name=att.user.full_name if att.user else None,
                    score=att.score,
                    total_questions=att.total_questions,
                    correct_answers=att.correct_answers,
                    percentage=percentage,
                    time_taken_seconds=att.time_taken_seconds,
                    is_completed=att.is_completed,
                    started_at=att.started_at,
                    completed_at=att.completed_at
                )
            )
        return res
