from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional


class QuestionOptionBase(BaseModel):
    option_text: str = Field(..., min_length=1, max_length=500)
    is_correct: bool = Field(False)


class QuestionOptionCreate(QuestionOptionBase):
    pass


class QuestionOptionResponse(QuestionOptionBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class QuestionBase(BaseModel):
    text: str = Field(..., min_length=3)
    image_url: Optional[str] = Field(None, max_length=500)
    explanation: Optional[str] = Field(None)
    order: int = Field(1, ge=1)


class QuestionCreate(QuestionBase):
    options: List[QuestionOptionCreate] = Field(..., min_length=2, description="At least two options required")


class QuestionUpdate(BaseModel):
    text: Optional[str] = Field(None, min_length=3)
    image_url: Optional[str] = Field(None, max_length=500)
    explanation: Optional[str] = Field(None)
    order: Optional[int] = Field(None, ge=1)
    options: Optional[List[QuestionOptionCreate]] = Field(None, min_length=2)


class QuestionItemReorder(BaseModel):
    question_id: int
    order: int = Field(..., ge=1)


class QuestionReorderRequest(BaseModel):
    orders: List[QuestionItemReorder]


class QuestionResponse(QuestionBase):
    id: int
    quiz_id: int
    options: List[QuestionOptionResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
