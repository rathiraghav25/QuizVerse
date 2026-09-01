from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional, Dict
from app.schemas.question import QuestionOptionResponse


class StudentQuestionOptionResponse(BaseModel):
    id: int
    option_text: str

    model_config = ConfigDict(from_attributes=True)


class StudentQuestionResponse(BaseModel):
    id: int
    text: str
    image_url: Optional[str] = None
    order: int
    options: List[StudentQuestionOptionResponse]

    model_config = ConfigDict(from_attributes=True)


class AttemptStartResponse(BaseModel):
    id: int
    quiz_id: int
    quiz_title: str
    quiz_description: Optional[str] = None
    time_limit_minutes: int
    started_at: datetime
    is_completed: bool
    questions: List[StudentQuestionResponse]
    current_answers: Dict[int, Optional[int]] = {}

    model_config = ConfigDict(from_attributes=True)


class SaveAnswerItem(BaseModel):
    question_id: int
    selected_option_id: Optional[int] = None


class SaveAnswersRequest(BaseModel):
    answers: List[SaveAnswerItem]


class AttemptAnswerDetailResponse(BaseModel):
    question_id: int
    question_text: str
    image_url: Optional[str] = None
    explanation: Optional[str] = None
    selected_option_id: Optional[int] = None
    correct_option_id: int
    is_correct: bool
    options: List[QuestionOptionResponse]

    model_config = ConfigDict(from_attributes=True)


class AttemptResultResponse(BaseModel):
    id: int
    quiz_id: int
    quiz_title: str
    user_id: int
    user_name: Optional[str] = None
    score: float
    total_questions: int
    correct_answers: int
    percentage: float
    time_taken_seconds: int
    is_completed: bool
    started_at: datetime
    completed_at: Optional[datetime] = None
    answer_details: Optional[List[AttemptAnswerDetailResponse]] = None

    model_config = ConfigDict(from_attributes=True)


class AttemptSummaryResponse(BaseModel):
    id: int
    quiz_id: int
    quiz_title: str
    user_id: int
    user_name: Optional[str] = None
    score: float
    total_questions: int
    correct_answers: int
    percentage: float
    time_taken_seconds: int
    is_completed: bool
    started_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
