from fastapi.testclient import TestClient


def setup_published_quiz(client: TestClient, teacher_auth_headers) -> int:
    """Helper fixture creating a published quiz with 2 MCQ questions."""
    # 1. Create Quiz
    q_res = client.post("/api/v1/quizzes", json={
        "title": "General Knowledge Quiz",
        "description": "General Knowledge Test",
        "difficulty": "easy",
        "time_limit_minutes": 10
    }, headers=teacher_auth_headers).json()
    quiz_id = q_res["id"]

    # 2. Add Question 1
    client.post(f"/api/v1/quizzes/{quiz_id}/questions", json={
        "text": "What is the capital of France?",
        "explanation": "Paris is the capital and largest city of France.",
        "order": 1,
        "options": [
            {"option_text": "Paris", "is_correct": True},
            {"option_text": "London", "is_correct": False},
            {"option_text": "Berlin", "is_correct": False},
            {"option_text": "Rome", "is_correct": False}
        ]
    }, headers=teacher_auth_headers)

    # 3. Add Question 2
    client.post(f"/api/v1/quizzes/{quiz_id}/questions", json={
        "text": "Which planet is known as the Red Planet?",
        "explanation": "Mars appears red due to iron oxide on its surface.",
        "order": 2,
        "options": [
            {"option_text": "Venus", "is_correct": False},
            {"option_text": "Mars", "is_correct": True},
            {"option_text": "Jupiter", "is_correct": False},
            {"option_text": "Saturn", "is_correct": False}
        ]
    }, headers=teacher_auth_headers)

    # 4. Publish Quiz
    client.patch(f"/api/v1/quizzes/{quiz_id}/publish", json={"is_published": True}, headers=teacher_auth_headers)
    return quiz_id


def test_start_attempt_unpublished_quiz_fails(client: TestClient, teacher_auth_headers, student_auth_headers):
    # Create unpublished quiz
    quiz_res = client.post("/api/v1/quizzes", json={"title": "Draft Quiz"}, headers=teacher_auth_headers).json()
    quiz_id = quiz_res["id"]

    # Student attempt to start -> 400 Bad Request
    start_res = client.post(f"/api/v1/quizzes/{quiz_id}/attempts", headers=student_auth_headers)
    assert start_res.status_code == 400
    assert "unpublished" in start_res.json()["detail"]


def test_start_attempt_and_security_payload(client: TestClient, teacher_auth_headers, student_auth_headers):
    quiz_id = setup_published_quiz(client, teacher_auth_headers)

    start_res = client.post(f"/api/v1/quizzes/{quiz_id}/attempts", headers=student_auth_headers)
    assert start_res.status_code == 201
    data = start_res.json()
    assert data["quiz_id"] == quiz_id
    assert len(data["questions"]) == 2

    # SECURITY VERIFICATION: Ensure is_correct & explanation are NOT in the question payload during test
    first_q = data["questions"][0]
    assert "explanation" not in first_q
    for opt in first_q["options"]:
        assert "is_correct" not in opt


def test_duplicate_active_attempt_prevention(client: TestClient, teacher_auth_headers, student_auth_headers):
    quiz_id = setup_published_quiz(client, teacher_auth_headers)

    res1 = client.post(f"/api/v1/quizzes/{quiz_id}/attempts", headers=student_auth_headers).json()
    res2 = client.post(f"/api/v1/quizzes/{quiz_id}/attempts", headers=student_auth_headers).json()

    # Returns the exact same active attempt ID
    assert res1["id"] == res2["id"]


def test_save_answers_validation(client: TestClient, teacher_auth_headers, student_auth_headers):
    quiz_id = setup_published_quiz(client, teacher_auth_headers)
    attempt = client.post(f"/api/v1/quizzes/{quiz_id}/attempts", headers=student_auth_headers).json()
    attempt_id = attempt["id"]
    q1_id = attempt["questions"][0]["id"]
    q1_opt1_id = attempt["questions"][0]["options"][0]["id"]

    # Valid answer save -> 200 OK
    save_payload = {
        "answers": [
            {"question_id": q1_id, "selected_option_id": q1_opt1_id}
        ]
    }
    save_res = client.put(f"/api/v1/attempts/{attempt_id}/answers", json=save_payload, headers=student_auth_headers)
    assert save_res.status_code == 200

    # Invalid Question ID -> 400 Bad Request
    bad_q_payload = {"answers": [{"question_id": 9999, "selected_option_id": q1_opt1_id}]}
    bad_q_res = client.put(f"/api/v1/attempts/{attempt_id}/answers", json=bad_q_payload, headers=student_auth_headers)
    assert bad_q_res.status_code == 400

    # Invalid Option ID -> 400 Bad Request
    bad_opt_payload = {"answers": [{"question_id": q1_id, "selected_option_id": 9999}]}
    bad_opt_res = client.put(f"/api/v1/attempts/{attempt_id}/answers", json=bad_opt_payload, headers=student_auth_headers)
    assert bad_opt_res.status_code == 400


def test_submit_attempt_and_scoring(client: TestClient, teacher_auth_headers, student_auth_headers):
    quiz_id = setup_published_quiz(client, teacher_auth_headers)
    attempt = client.post(f"/api/v1/quizzes/{quiz_id}/attempts", headers=student_auth_headers).json()
    attempt_id = attempt["id"]

    q1 = attempt["questions"][0]  # Capital of France (Paris is options[0])
    q2 = attempt["questions"][1]  # Red Planet (Mars is options[1])

    paris_opt_id = q1["options"][0]["id"]
    venus_opt_id = q2["options"][0]["id"]  # Incorrect (Venus)

    # Submit 1 correct, 1 incorrect -> 50% score
    sub_payload = {
        "answers": [
            {"question_id": q1["id"], "selected_option_id": paris_opt_id},
            {"question_id": q2["id"], "selected_option_id": venus_opt_id}
        ]
    }
    sub_res = client.post(f"/api/v1/attempts/{attempt_id}/submit", json=sub_payload, headers=student_auth_headers)
    assert sub_res.status_code == 200
    result = sub_res.json()
    assert result["is_completed"] is True
    assert result["total_questions"] == 2
    assert result["correct_answers"] == 1
    assert result["score"] == 50.0

    # Test post-submission review payload (Explanations & correct options ARE now returned)
    ans_details = result["answer_details"]
    assert len(ans_details) == 2
    assert ans_details[0]["explanation"] is not None
    assert ans_details[0]["is_correct"] is True
    assert ans_details[1]["is_correct"] is False

    # Test submitting twice fails -> 400 Bad Request
    sub_again_res = client.post(f"/api/v1/attempts/{attempt_id}/submit", json=sub_payload, headers=student_auth_headers)
    assert sub_again_res.status_code == 400
    assert "already been submitted" in sub_again_res.json()["detail"]


def test_attempt_history_and_permissions(client: TestClient, teacher_auth_headers, student_auth_headers):
    quiz_id = setup_published_quiz(client, teacher_auth_headers)
    attempt = client.post(f"/api/v1/quizzes/{quiz_id}/attempts", headers=student_auth_headers).json()
    client.post(f"/api/v1/attempts/{attempt['id']}/submit", headers=student_auth_headers)

    # Student views own attempts
    my_attempts_res = client.get("/api/v1/attempts/me", headers=student_auth_headers)
    assert my_attempts_res.status_code == 200
    assert len(my_attempts_res.json()) >= 1

    # Teacher views attempts for created quiz
    quiz_attempts_res = client.get(f"/api/v1/quizzes/{quiz_id}/attempts", headers=teacher_auth_headers)
    assert quiz_attempts_res.status_code == 200
    assert len(quiz_attempts_res.json()) >= 1
