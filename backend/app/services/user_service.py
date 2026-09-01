from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserUpdate, UserResponse


class UserService:
    """Business logic for User Profile management."""

    def __init__(self, db: Session):
        self.user_repo = UserRepository(db)

    def get_profile(self, current_user: User) -> UserResponse:
        """Get profile of currently logged-in user."""
        return UserResponse.model_validate(current_user)

    def update_profile(self, current_user: User, user_in: UserUpdate) -> UserResponse:
        """Update current user's profile information (full_name, email). Role cannot be modified."""
        if user_in.email and user_in.email.lower() != current_user.email.lower():
            existing = self.user_repo.get_by_email(user_in.email)
            if existing and existing.id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A user with this email address already exists."
                )

        updated_user = self.user_repo.update(current_user, user_in)
        return UserResponse.model_validate(updated_user)
