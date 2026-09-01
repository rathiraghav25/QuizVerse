from pydantic import BaseModel, ConfigDict
from typing import List, Optional


class OptionAnalytics(BaseModel):
    option_id: int
    option_text: str
    is_correct: bool
    selection_count: int
    selection_percentage: float

    model_config = ConfigDict(from_attributes=True)


class QuestionAnalytics(BaseModel):
    question_id: int
    question_text: str
    order: int
    total_answers: int
    correct_answers: int
    accuracy_percentage: float
    options: List[OptionAnalytics]

    model_config = ConfigDict(from_attributes=True)


class QuizAnalyticsResponse(BaseModel):
    quiz_id: int
    quiz_title: str
    total_attempts: int
    completed_attempts: int
    completion_rate: float
    average_score: float
    highest_score: float
    lowest_score: float
    average_time_taken_seconds: float
    question_analytics: List[QuestionAnalytics]

    model_config = ConfigDict(from_attributes=True)
