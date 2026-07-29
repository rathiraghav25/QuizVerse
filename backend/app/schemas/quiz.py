from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional
from app.models.quiz import QuizDifficulty
from app.schemas.category import CategoryResponse
from app.schemas.question import QuestionResponse


class QuizBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=255, description="Quiz title is required")
    description: Optional[str] = Field(None)
    category_id: Optional[int] = Field(None)
    difficulty: QuizDifficulty = Field(QuizDifficulty.MEDIUM)
    time_limit_minutes: int = Field(15, gt=0, description="Time limit in minutes must be greater than 0")


class QuizCreate(QuizBase):
    pass


class QuizUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = Field(None)
    category_id: Optional[int] = Field(None)
    difficulty: Optional[QuizDifficulty] = Field(None)
    time_limit_minutes: Optional[int] = Field(None, gt=0)


class QuizPublishUpdate(BaseModel):
    is_published: bool


class QuizResponse(QuizBase):
    id: int
    creator_id: int
    is_published: bool
    created_at: datetime
    updated_at: datetime
    category: Optional[CategoryResponse] = None
    question_count: int = 0
    questions: Optional[List[QuestionResponse]] = None

    model_config = ConfigDict(from_attributes=True)


class QuizPaginatedResponse(BaseModel):
    items: List[QuizResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
