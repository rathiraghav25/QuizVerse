from fastapi import APIRouter, Depends
from app.core.deps import get_current_active_user
from app.models.user import User
from app.schemas.user import UserResponse

router = APIRouter()


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current authenticated user profile"
)
def read_current_user(
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieve profile details of the currently authenticated user.
    """
    return UserResponse.model_validate(current_user)
