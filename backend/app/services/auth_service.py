from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.schemas.auth import Token
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.user import User


class AuthService:
    """Business Logic Service for Authentication operations."""

    def __init__(self, db: Session):
        self.user_repo = UserRepository(db)

    def register_user(self, user_in: UserCreate) -> UserResponse:
        """Register a new user after validating email uniqueness."""
        existing_user = self.user_repo.get_by_email(user_in.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email address already exists."
            )

        if len(user_in.password) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 6 characters long."
            )

        hashed_password = get_password_hash(user_in.password)
        db_user = self.user_repo.create(user_in, hashed_password)
        return UserResponse.model_validate(db_user)

    def authenticate_user(self, credentials: UserLogin) -> Token:
        """Authenticate user credentials and issue JWT access token."""
        user = self.user_repo.get_by_email(credentials.email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not verify_password(credentials.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user account."
            )

        access_token = create_access_token(subject=user.id, role=user.role.value)
        return Token(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse.model_validate(user)
        )
