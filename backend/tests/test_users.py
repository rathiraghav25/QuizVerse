from fastapi.testclient import TestClient


def test_get_current_user_me_authenticated(client: TestClient, student_auth_headers, test_student_user):
    """Test retrieving current profile with valid JWT bearer token."""
    response = client.get("/api/v1/users/me", headers=student_auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_student_user.email
    assert data["full_name"] == test_student_user.full_name
    assert data["role"] == "student"


def test_get_current_user_me_unauthenticated(client: TestClient):
    """Test accessing protected route without auth token returns 401."""
    response = client.get("/api/v1/users/me")
    assert response.status_code == 401


def test_get_current_user_me_invalid_token(client: TestClient):
    """Test accessing protected route with invalid token returns 401."""
    headers = {"Authorization": "Bearer invalid_jwt_token_string"}
    response = client.get("/api/v1/users/me", headers=headers)
    assert response.status_code == 401


def test_update_user_profile(client: TestClient, student_auth_headers, test_student_user):
    """Test updating user profile full_name and email."""
    payload = {
        "full_name": "Alice Updated",
        "email": "alice.updated@quizverse.com"
    }
    response = client.put("/api/v1/users/me", json=payload, headers=student_auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "Alice Updated"
    assert data["email"] == "alice.updated@quizverse.com"
    assert data["role"] == "student"


def test_update_user_profile_role_tamper_ignored(client: TestClient, student_auth_headers, test_student_user):
    """Test that attempting to pass role='admin' in profile update payload is ignored or prevented."""
    payload = {
        "full_name": "Tamper Attempt",
        "role": "admin"
    }
    response = client.put("/api/v1/users/me", json=payload, headers=student_auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "student"


def test_update_user_profile_duplicate_email_fails(client: TestClient, student_auth_headers, teacher_auth_headers, test_teacher_user):
    """Test updating profile email to an existing user's email fails with 400 Bad Request."""
    payload = {
        "email": test_teacher_user.email
    }
    response = client.put("/api/v1/users/me", json=payload, headers=student_auth_headers)
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]
