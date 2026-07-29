from fastapi.testclient import TestClient


def test_add_question_option_validation(client: TestClient, teacher_auth_headers):
    # 1. Create a Quiz
    quiz_res = client.post("/api/v1/quizzes", json={"title": "JavaScript Basics"}, headers=teacher_auth_headers)
    quiz_id = quiz_res.json()["id"]

    # 2. Try adding question with less than 2 options -> Fails
    q_invalid_options = {
        "text": "What is typeof null?",
        "options": [{"option_text": "object", "is_correct": True}]
    }
    res1 = client.post(f"/api/v1/quizzes/{quiz_id}/questions", json=q_invalid_options, headers=teacher_auth_headers)
    assert res1.status_code == 422 or res1.status_code == 400

    # 3. Try adding question with 0 correct options -> Fails 400
    q_no_correct = {
        "text": "What is typeof null?",
        "options": [
            {"option_text": "object", "is_correct": False},
            {"option_text": "null", "is_correct": False}
        ]
    }
    res2 = client.post(f"/api/v1/quizzes/{quiz_id}/questions", json=q_no_correct, headers=teacher_auth_headers)
    assert res2.status_code == 400
    assert "exactly 1 correct option" in res2.json()["detail"]

    # 4. Add valid question with 1 correct option -> Succeeds 201
    q_valid = {
        "text": "What is typeof null in JavaScript?",
        "explanation": "In JS, typeof null returns 'object' due to historical reasons.",
        "options": [
            {"option_text": "object", "is_correct": True},
            {"option_text": "null", "is_correct": False},
            {"option_text": "undefined", "is_correct": False},
            {"option_text": "boolean", "is_correct": False}
        ]
    }
    res3 = client.post(f"/api/v1/quizzes/{quiz_id}/questions", json=q_valid, headers=teacher_auth_headers)
    assert res3.status_code == 201
    q_data = res3.json()
    assert len(q_data["options"]) == 4

    # 5. Now publish the quiz -> Should succeed!
    pub_res = client.patch(f"/api/v1/quizzes/{quiz_id}/publish", json={"is_published": True}, headers=teacher_auth_headers)
    assert pub_res.status_code == 200
    assert pub_res.json()["is_published"] is True


def test_reorder_questions(client: TestClient, teacher_auth_headers):
    quiz_res = client.post("/api/v1/quizzes", json={"title": "Reorder Test Quiz"}, headers=teacher_auth_headers)
    quiz_id = quiz_res.json()["id"]

    q1 = client.post(f"/api/v1/quizzes/{quiz_id}/questions", json={
        "text": "Question 1",
        "order": 1,
        "options": [{"option_text": "A", "is_correct": True}, {"option_text": "B", "is_correct": False}]
    }, headers=teacher_auth_headers).json()

    q2 = client.post(f"/api/v1/quizzes/{quiz_id}/questions", json={
        "text": "Question 2",
        "order": 2,
        "options": [{"option_text": "A", "is_correct": True}, {"option_text": "B", "is_correct": False}]
    }, headers=teacher_auth_headers).json()

    reorder_payload = {
        "orders": [
            {"question_id": q1["id"], "order": 2},
            {"question_id": q2["id"], "order": 1}
        ]
    }
    reorder_res = client.patch(f"/api/v1/quizzes/{quiz_id}/questions/reorder", json=reorder_payload, headers=teacher_auth_headers)
    assert reorder_res.status_code == 200
    items = reorder_res.json()
    assert items[0]["id"] == q2["id"]
    assert items[1]["id"] == q1["id"]
