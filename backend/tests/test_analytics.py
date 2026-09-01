from fastapi.testclient import TestClient
from app.core.security import create_access_token, get_password_hash
from app.models.user import User, UserRole


def setup_test_quiz_with_attempts(client: TestClient, teacher_auth_headers, db_session):
    """Helper fixture to set up a published quiz with 2 questions and 2 completed attempts."""
    # 1. Create Quiz
    q_res = client.post("/api/v1/quizzes", json={
        "title": "Analytics Test Quiz",
        "description": "Quiz for Leaderboard & Analytics testing",
        "difficulty": "medium",
        "time_limit_minutes": 15
    }, headers=teacher_auth_headers).json()
    quiz_id = q_res["id"]

    # 2. Add Question 1
    client.post(f"/api/v1/quizzes/{quiz_id}/questions", json={
        "text": "Question 1: 2 + 2?",
        "order": 1,
        "options": [
            {"option_text": "4", "is_correct": True},
            {"option_text": "22", "is_correct": False}
        ]
    }, headers=teacher_auth_headers)

    # 3. Add Question 2
    client.post(f"/api/v1/quizzes/{quiz_id}/questions", json={
        "text": "Question 2: Capital of UK?",
        "order": 2,
        "options": [
            {"option_text": "London", "is_correct": True},
            {"option_text": "Paris", "is_correct": False}
        ]
    }, headers=teacher_auth_headers)

    # 4. Publish Quiz
    client.patch(f"/api/v1/quizzes/{quiz_id}/publish", json={"is_published": True}, headers=teacher_auth_headers)

    # Create Student 1 and Student 2 in DB
    s1 = User(email="student1@quizverse.com", full_name="Student One", hashed_password=get_password_hash("pass"), role=UserRole.STUDENT, is_active=True)
    s2 = User(email="student2@quizverse.com", full_name="Student Two", hashed_password=get_password_hash("pass"), role=UserRole.STUDENT, is_active=True)
    db_session.add_all([s1, s2])
    db_session.commit()
    db_session.refresh(s1)
    db_session.refresh(s2)

    s1_token = create_access_token(subject=s1.id, role=s1.role.value)
    s2_token = create_access_token(subject=s2.id, role=s2.role.value)
    s1_headers = {"Authorization": f"Bearer {s1_token}"}
    s2_headers = {"Authorization": f"Bearer {s2_token}"}

    # Student 1 takes quiz (gets 100%)
    att1 = client.post(f"/api/v1/quizzes/{quiz_id}/attempts", headers=s1_headers).json()
    q1 = att1["questions"][0]
    q2 = att1["questions"][1]
    client.post(f"/api/v1/attempts/{att1['id']}/submit", json={
        "answers": [
            {"question_id": q1["id"], "selected_option_id": q1["options"][0]["id"]}, # 4 (correct)
            {"question_id": q2["id"], "selected_option_id": q2["options"][0]["id"]}  # London (correct)
        ]
    }, headers=s1_headers)

    # Student 2 takes quiz (gets 50%)
    att2 = client.post(f"/api/v1/quizzes/{quiz_id}/attempts", headers=s2_headers).json()
    client.post(f"/api/v1/attempts/{att2['id']}/submit", json={
        "answers": [
            {"question_id": q1["id"], "selected_option_id": q1["options"][0]["id"]}, # 4 (correct)
            {"question_id": q2["id"], "selected_option_id": q2["options"][1]["id"]}  # Paris (incorrect)
        ]
    }, headers=s2_headers)

    # Student 1 starts another active attempt (uncompleted)
    client.post(f"/api/v1/quizzes/{quiz_id}/attempts", headers=s1_headers)

    return quiz_id, s1_headers, s2_headers


def test_get_quiz_leaderboard(client: TestClient, teacher_auth_headers, db_session):
    quiz_id, s1_headers, s2_headers = setup_test_quiz_with_attempts(client, teacher_auth_headers, db_session)

    res = client.get(f"/api/v1/quizzes/{quiz_id}/leaderboard", headers=s1_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["quiz_id"] == quiz_id
    assert data["total_entries"] == 2  # Only 2 completed attempts included

    entries = data["entries"]
    assert entries[0]["rank"] == 1
    assert entries[0]["user_name"] == "Student One"
    assert entries[0]["score"] == 100.0

    assert entries[1]["rank"] == 2
    assert entries[1]["user_name"] == "Student Two"
    assert entries[1]["score"] == 50.0


def test_get_quiz_analytics_creator_teacher_success(client: TestClient, teacher_auth_headers, db_session):
    quiz_id, s1_headers, s2_headers = setup_test_quiz_with_attempts(client, teacher_auth_headers, db_session)

    res = client.get(f"/api/v1/quizzes/{quiz_id}/analytics", headers=teacher_auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["quiz_id"] == quiz_id
    assert data["total_attempts"] == 3  # 2 completed + 1 active
    assert data["completed_attempts"] == 2
    assert data["completion_rate"] == 66.67
    assert data["average_score"] == 75.0
    assert data["highest_score"] == 100.0
    assert data["lowest_score"] == 50.0
    assert len(data["question_analytics"]) == 2

    # Check question 1 stats (both student 1 and student 2 answered correct)
    q1_stats = data["question_analytics"][0]
    assert q1_stats["total_answers"] == 2
    assert q1_stats["correct_answers"] == 2
    assert q1_stats["accuracy_percentage"] == 100.0


def test_get_quiz_analytics_student_forbidden(client: TestClient, teacher_auth_headers, db_session):
    quiz_id, s1_headers, s2_headers = setup_test_quiz_with_attempts(client, teacher_auth_headers, db_session)

    res = client.get(f"/api/v1/quizzes/{quiz_id}/analytics", headers=s1_headers)
    assert res.status_code == 403
    assert "permitted" in res.json()["detail"].lower() or "permission" in res.json()["detail"].lower()


def test_get_quiz_analytics_other_teacher_forbidden(client: TestClient, teacher_auth_headers, db_session):
    quiz_id, s1_headers, s2_headers = setup_test_quiz_with_attempts(client, teacher_auth_headers, db_session)

    # Create another teacher user
    other_teacher = User(email="other.teacher@quizverse.com", full_name="Other Teacher", hashed_password=get_password_hash("pass"), role=UserRole.TEACHER, is_active=True)
    db_session.add(other_teacher)
    db_session.commit()
    db_session.refresh(other_teacher)
    other_teacher_token = create_access_token(subject=other_teacher.id, role=other_teacher.role.value)
    other_teacher_headers = {"Authorization": f"Bearer {other_teacher_token}"}

    res = client.get(f"/api/v1/quizzes/{quiz_id}/analytics", headers=other_teacher_headers)
    assert res.status_code == 403
    assert "permission" in res.json()["detail"]
