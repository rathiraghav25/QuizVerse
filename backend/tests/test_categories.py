from fastapi.testclient import TestClient


def test_create_category_teacher(client: TestClient, teacher_auth_headers):
    payload = {
        "name": "Science & Tech",
        "description": "Quizzes related to Physics, Chemistry, and CS"
    }
    response = client.post("/api/v1/categories", json=payload, headers=teacher_auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Science & Tech"
    assert "id" in data


def test_create_category_student_forbidden(client: TestClient, student_auth_headers):
    payload = {
        "name": "History",
        "description": "World History Quizzes"
    }
    response = client.post("/api/v1/categories", json=payload, headers=student_auth_headers)
    assert response.status_code == 403


def test_create_duplicate_category(client: TestClient, teacher_auth_headers):
    payload = {"name": "Mathematics", "description": "Math Quizzes"}
    res1 = client.post("/api/v1/categories", json=payload, headers=teacher_auth_headers)
    assert res1.status_code == 201

    res2 = client.post("/api/v1/categories", json=payload, headers=teacher_auth_headers)
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"]


def test_list_categories(client: TestClient, teacher_auth_headers):
    client.post("/api/v1/categories", json={"name": "Cat 1"}, headers=teacher_auth_headers)
    client.post("/api/v1/categories", json={"name": "Cat 2"}, headers=teacher_auth_headers)

    response = client.get("/api/v1/categories")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2


def test_update_category(client: TestClient, teacher_auth_headers):
    res = client.post("/api/v1/categories", json={"name": "Old Category"}, headers=teacher_auth_headers)
    cat_id = res.json()["id"]

    update_res = client.put(
        f"/api/v1/categories/{cat_id}",
        json={"name": "Updated Category", "description": "New description"},
        headers=teacher_auth_headers
    )
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Updated Category"


def test_delete_category(client: TestClient, teacher_auth_headers):
    res = client.post("/api/v1/categories", json={"name": "To Delete"}, headers=teacher_auth_headers)
    cat_id = res.json()["id"]

    del_res = client.delete(f"/api/v1/categories/{cat_id}", headers=teacher_auth_headers)
    assert del_res.status_code == 204

    get_res = client.get(f"/api/v1/categories/{cat_id}")
    assert get_res.status_code == 404
