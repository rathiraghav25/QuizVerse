from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate
from app.services.user_service import UserService

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


@router.put(
    "/me",
    response_model=UserResponse,
    summary="Update current user profile information"
)
def update_current_user(
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update profile details (full_name, email). Role cannot be modified.
    """
    service = UserService(db)
    return service.update_profile(current_user, user_in)
