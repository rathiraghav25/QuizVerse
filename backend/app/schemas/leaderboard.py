from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import List, Optional


class LeaderboardEntry(BaseModel):
    rank: int
    attempt_id: int
    user_id: int
    user_name: str
    score: float
    percentage: float
    time_taken_seconds: int
    completed_at: datetime

    model_config = ConfigDict(from_attributes=True)


class QuizLeaderboardResponse(BaseModel):
    quiz_id: int
    quiz_title: str
    entries: List[LeaderboardEntry]
    total_entries: int

    model_config = ConfigDict(from_attributes=True)
