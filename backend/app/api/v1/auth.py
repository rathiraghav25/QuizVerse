from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.schemas.auth import Token
from app.services.auth_service import AuthService

router = APIRouter()


@router.post(
    "/signup",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register new user account"
)
def signup(
    user_in: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new user account with specified role (student, teacher, admin).
    """
    service = AuthService(db)
    return service.register_user(user_in)


@router.post(
    "/login",
    response_model=Token,
    summary="User Login & JWT Token issuance (JSON payload)"
)
def login_json(
    credentials: UserLogin,
    db: Session = Depends(get_db)
):
    """
    Authenticate user using email and password, returning JWT access token.
    """
    service = AuthService(db)
    return service.authenticate_user(credentials)


@router.post(
    "/login/token",
    response_model=Token,
    summary="User Login & JWT Token issuance (Swagger Form payload)",
    include_in_schema=True
)
def login_form(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    OAuth2 compatible token login endpoint for FastAPI Swagger UI.
    """
    credentials = UserLogin(email=form_data.username, password=form_data.password)
    service = AuthService(db)
    return service.authenticate_user(credentials)
