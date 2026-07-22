from fastapi.testclient import TestClient


def test_signup_student(client: TestClient):
    """Test user registration for Student role."""
    payload = {
        "email": "newstudent@quizverse.com",
        "password": "secretpassword",
        "full_name": "Charlie Student",
        "role": "student"
    }
    response = client.post("/api/v1/auth/signup", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newstudent@quizverse.com"
    assert data["role"] == "student"
    assert "id" in data
    assert "hashed_password" not in data


def test_signup_teacher(client: TestClient):
    """Test user registration for Teacher role."""
    payload = {
        "email": "prof.smith@quizverse.com",
        "password": "profpassword123",
        "full_name": "Professor Smith",
        "role": "teacher"
    }
    response = client.post("/api/v1/auth/signup", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["role"] == "teacher"


def test_signup_duplicate_email(client: TestClient, test_student_user):
    """Test user registration fails if email already exists."""
    payload = {
        "email": test_student_user.email,
        "password": "anotherpassword",
        "full_name": "Duplicate User",
        "role": "student"
    }
    response = client.post("/api/v1/auth/signup", json=payload)
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_login_success(client: TestClient, test_student_user):
    """Test successful login with valid credentials."""
    payload = {
        "email": test_student_user.email,
        "password": "password123"
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == test_student_user.email


def test_login_invalid_password(client: TestClient, test_student_user):
    """Test login failure with incorrect password."""
    payload = {
        "email": test_student_user.email,
        "password": "wrongpassword"
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]


def test_login_nonexistent_user(client: TestClient):
    """Test login failure with non-registered email."""
    payload = {
        "email": "nonexistent@quizverse.com",
        "password": "somepassword"
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401
