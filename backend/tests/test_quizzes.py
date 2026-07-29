from fastapi.testclient import TestClient


def test_create_quiz_teacher(client: TestClient, teacher_auth_headers):
    payload = {
        "title": "Python Programming Basics",
        "description": "Test your basic Python knowledge",
        "difficulty": "medium",
        "time_limit_minutes": 20
    }
    response = client.post("/api/v1/quizzes", json=payload, headers=teacher_auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Python Programming Basics"
    assert data["is_published"] is False
    assert data["time_limit_minutes"] == 20


def test_create_quiz_student_forbidden(client: TestClient, student_auth_headers):
    payload = {
        "title": "Unauthorized Quiz",
        "time_limit_minutes": 10
    }
    response = client.post("/api/v1/quizzes", json=payload, headers=student_auth_headers)
    assert response.status_code == 403


def test_quiz_publish_without_questions_fails(client: TestClient, teacher_auth_headers):
    res = client.post("/api/v1/quizzes", json={"title": "Empty Quiz", "time_limit_minutes": 15}, headers=teacher_auth_headers)
    quiz_id = res.json()["id"]

    publish_res = client.patch(
        f"/api/v1/quizzes/{quiz_id}/publish",
        json={"is_published": True},
        headers=teacher_auth_headers
    )
    assert publish_res.status_code == 400
    assert "at least one question" in publish_res.json()["detail"]


def test_list_quizzes_search_and_filter(client: TestClient, teacher_auth_headers):
    client.post("/api/v1/quizzes", json={"title": "React Fundamentals", "difficulty": "easy"}, headers=teacher_auth_headers)
    client.post("/api/v1/quizzes", json={"title": "Advanced Quantum Physics", "difficulty": "hard"}, headers=teacher_auth_headers)

    res = client.get("/api/v1/quizzes?search=React")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 1
    assert data["items"][0]["title"] == "React Fundamentals"

    diff_res = client.get("/api/v1/quizzes?difficulty=hard")
    assert diff_res.status_code == 200
    assert diff_res.json()["total"] == 1
    assert diff_res.json()["items"][0]["title"] == "Advanced Quantum Physics"


def test_update_and_delete_quiz(client: TestClient, teacher_auth_headers):
    create_res = client.post("/api/v1/quizzes", json={"title": "Quiz To Update"}, headers=teacher_auth_headers)
    quiz_id = create_res.json()["id"]

    update_res = client.put(
        f"/api/v1/quizzes/{quiz_id}",
        json={"title": "Updated Quiz Title", "time_limit_minutes": 30},
        headers=teacher_auth_headers
    )
    assert update_res.status_code == 200
    assert update_res.json()["title"] == "Updated Quiz Title"

    del_res = client.delete(f"/api/v1/quizzes/{quiz_id}", headers=teacher_auth_headers)
    assert del_res.status_code == 204
