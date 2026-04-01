def test_root_redirects_to_static_index(client):
    response = client.get("/", follow_redirects=False)

    assert response.status_code in (302, 307)
    assert response.headers["location"] == "/static/index.html"


def test_get_activities_returns_all_activities(client):
    response = client.get("/activities")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert len(data) > 0
    assert "Chess Club" in data


def test_get_activities_has_expected_structure(client):
    response = client.get("/activities")
    data = response.json()

    for activity in data.values():
        assert "description" in activity
        assert "schedule" in activity
        assert "max_participants" in activity
        assert "participants" in activity
        assert isinstance(activity["participants"], list)


def test_signup_new_student_success(client):
    email = "new.student@mergington.edu"

    response = client.post(f"/activities/Chess Club/signup?email={email}")

    assert response.status_code == 200
    assert response.json() == {"message": f"Signed up {email} for Chess Club"}

    updated = client.get("/activities").json()
    assert email in updated["Chess Club"]["participants"]


def test_signup_duplicate_student_returns_400(client):
    existing_email = "michael@mergington.edu"

    response = client.post(f"/activities/Chess Club/signup?email={existing_email}")

    assert response.status_code == 400
    assert response.json()["detail"] == "Student already signed up for this activity"


def test_signup_missing_activity_returns_404(client):
    response = client.post("/activities/NotARealActivity/signup?email=student@mergington.edu")

    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_signup_fails_when_activity_is_full(client):
    activities = client.get("/activities").json()
    max_participants = activities["Chess Club"]["max_participants"]
    current_participants = len(activities["Chess Club"]["participants"])

    for index in range(current_participants, max_participants):
        response = client.post(
            f"/activities/Chess Club/signup?email=fill{index}@mergington.edu"
        )
        assert response.status_code == 200

    response = client.post("/activities/Chess Club/signup?email=overflow@mergington.edu")

    assert response.status_code == 400
    assert response.json()["detail"] == "Activity is at maximum capacity"


def test_unregister_success(client):
    email = "michael@mergington.edu"

    response = client.delete(f"/activities/Chess Club/participants/{email}")

    assert response.status_code == 200
    assert response.json() == {"message": f"Removed {email} from Chess Club"}

    updated = client.get("/activities").json()
    assert email not in updated["Chess Club"]["participants"]


def test_unregister_not_enrolled_returns_404(client):
    response = client.delete("/activities/Chess Club/participants/not-enrolled@mergington.edu")

    assert response.status_code == 404
    assert response.json()["detail"] == "Student is not signed up for this activity"


def test_unregister_missing_activity_returns_404(client):
    response = client.delete("/activities/NotARealActivity/participants/student@mergington.edu")

    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"
