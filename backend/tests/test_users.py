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
