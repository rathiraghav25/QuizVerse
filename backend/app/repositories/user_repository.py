from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.user import User, UserRole
from app.schemas.user import UserCreate


class UserRepository:
    """Repository layer responsible strictly for Database queries on User entities."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: int) -> Optional[User]:
        """Fetch user entity by integer primary key."""
        return self.db.get(User, user_id)

    def get_by_email(self, email: str) -> Optional[User]:
        """Fetch user entity by unique email address."""
        stmt = select(User).where(User.email == email.lower())
        return self.db.execute(stmt).scalar_one_or_none()

    def create(self, user_data: UserCreate, hashed_password: str) -> User:
        """Create new User database record."""
        db_user = User(
            email=user_data.email.lower(),
            full_name=user_data.full_name,
            hashed_password=hashed_password,
            role=user_data.role,
            is_active=True
        )
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return db_user

    def list_all(self, skip: int = 0, limit: int = 100) -> List[User]:
        """Get paginated list of users."""
        stmt = select(User).offset(skip).limit(limit)
        return list(self.db.execute(stmt).scalars().all())
