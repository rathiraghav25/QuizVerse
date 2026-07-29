from typing import Generator, Callable, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User, UserRole
from app.repositories.user_repository import UserRepository

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    """Validate Bearer token and retrieve target User entity."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_access_token(token)
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        raise credentials_exception

    repo = UserRepository(db)
    user = repo.get_by_id(user_id)
    if user is None:
        raise credentials_exception

    return user


def get_optional_current_user(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme_optional)
) -> Optional[User]:
    """Retrieve current user if token is present, else None."""
    if not token:
        return None
    try:
        payload = decode_access_token(token)
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            return None
        repo = UserRepository(db)
        return repo.get_by_id(int(user_id_str))
    except Exception:
        return None


def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Ensure active user status."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account."
        )
    return current_user


def require_role(allowed_roles: list[UserRole]) -> Callable:
    """Dependency factory enforcing Role-Based Access Control (RBAC)."""
    def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required role: {[r.value for r in allowed_roles]}"
            )
        return current_user
    return role_checker


require_admin = require_role([UserRole.ADMIN])
require_teacher_or_admin = require_role([UserRole.ADMIN, UserRole.TEACHER])
require_student = require_role([UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN])
