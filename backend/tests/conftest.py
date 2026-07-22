import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base, get_db
from app.core.security import get_password_hash, create_access_token
from app.models.user import User, UserRole

# Shared in-memory SQLite engine for tests with StaticPool
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session() -> Session:
    """Create a fresh database schema for each test."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session: Session) -> TestClient:
    """FastAPI TestClient with overridden database session dependency."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def test_student_user(db_session: Session) -> User:
    """Fixture creating a test student user in database."""
    user = User(
        email="student@quizverse.com",
        full_name="Alice Student",
        hashed_password=get_password_hash("password123"),
        role=UserRole.STUDENT,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
def test_teacher_user(db_session: Session) -> User:
    """Fixture creating a test teacher user in database."""
    user = User(
        email="teacher@quizverse.com",
        full_name="Bob Teacher",
        hashed_password=get_password_hash("password123"),
        role=UserRole.TEACHER,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
def student_auth_headers(test_student_user: User) -> dict[str, str]:
    """Return Authorization header with valid JWT for student user."""
    token = create_access_token(subject=test_student_user.id, role=test_student_user.role.value)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="function")
def teacher_auth_headers(test_teacher_user: User) -> dict[str, str]:
    """Return Authorization header with valid JWT for teacher user."""
    token = create_access_token(subject=test_teacher_user.id, role=test_teacher_user.role.value)
    return {"Authorization": f"Bearer {token}"}
