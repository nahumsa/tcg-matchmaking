import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.main import app
from backend.app.core.database import get_db, Base
from backend.app.core.config import settings

# Test database setup
engine = create_engine(
    settings.TEST_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# Dependency override
def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(scope="module")
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def test_admin_manual_add_participant(setup_db):
    # First create a tournament
    create_resp = client.post("/tournaments", json={"name": "Admin Action Tournament"})
    code = create_resp.json()["code"]

    # Admin manually adds a participant
    # We'll use a new endpoint: POST /tournaments/{code}/participants
    add_resp = client.post(
        f"/tournaments/{code}/participants", json={"name": "Manual Player"}
    )

    assert add_resp.status_code == 201
    data = add_resp.json()
    assert data["name"] == "Manual Player"
    assert data["points"] == 0
    assert "id" in data


def test_admin_remove_participant(setup_db):
    # First create a tournament
    create_resp = client.post("/tournaments", json={"name": "Admin Remove Tournament"})
    code = create_resp.json()["code"]

    # Join a player
    join_resp = client.post(f"/tournaments/{code}/join", json={"name": "RemoveMe"})
    participant_id = join_resp.json()["id"]

    # Removing before any round has ended is blocked.
    del_resp = client.delete(f"/tournaments/{code}/participants/{participant_id}")
    assert del_resp.status_code == 400

    # Start and complete round 1.
    client.post(f"/tournaments/{code}/join", json={"name": "Round Opponent"})
    client.post(f"/tournaments/{code}/join", json={"name": "Round Third"})
    client.post(f"/tournaments/{code}/join", json={"name": "Round Fourth"})
    pairings_resp = client.post(f"/tournaments/{code}/pairings")
    assert pairings_resp.status_code == 200
    matches = client.get(f"/tournaments/{code}/matches").json()
    round_1_matches = [match for match in matches if match["round_number"] == 1]
    for match in round_1_matches:
        report_resp = client.post(
            f"/matches/{match['id']}/report",
            json={"player1_score": 2, "player2_score": 0, "is_admin": True},
        )
        assert report_resp.status_code == 200

    # Admin can drop the participant now that a round ended.
    del_resp = client.delete(f"/tournaments/{code}/participants/{participant_id}")
    assert del_resp.status_code == 204

    # Reassigning in the same round boundary is blocked.
    join_again_resp = client.post(
        f"/tournaments/{code}/join", json={"name": "RemoveMe"}
    )
    assert join_again_resp.status_code == 400

    # Once the next round starts, reassignment is allowed.
    pairings_resp = client.post(f"/tournaments/{code}/pairings")
    assert pairings_resp.status_code == 200
    join_again_resp = client.post(
        f"/tournaments/{code}/join", json={"name": "RemoveMe"}
    )
    assert join_again_resp.status_code == 200


def test_removing_participants_mid_event_does_not_shrink_rounds(setup_db):
    create_resp = client.post("/tournaments", json={"name": "Stable Rounds Tournament"})
    code = create_resp.json()["code"]

    participant_ids = []
    for idx in range(8):
        join_resp = client.post(f"/tournaments/{code}/join", json={"name": f"P{idx}"})
        participant_ids.append(join_resp.json()["id"])

    pairings_resp = client.post(f"/tournaments/{code}/pairings")
    assert pairings_resp.status_code == 200
    tournament_resp = client.get(f"/tournaments/{code}")
    assert tournament_resp.status_code == 200
    assert tournament_resp.json()["rounds"] == 3

    matches = client.get(f"/tournaments/{code}/matches").json()
    round_1_matches = [match for match in matches if match["round_number"] == 1]
    for match in round_1_matches:
        report_resp = client.post(
            f"/matches/{match['id']}/report",
            json={"player1_score": 2, "player2_score": 0, "is_admin": True},
        )
        assert report_resp.status_code == 200

    for participant_id in participant_ids[4:]:
        delete_resp = client.delete(
            f"/tournaments/{code}/participants/{participant_id}"
        )
        assert delete_resp.status_code == 204

    tournament_resp = client.get(f"/tournaments/{code}")
    assert tournament_resp.status_code == 200
    assert tournament_resp.json()["rounds"] == 3

    pairings_resp = client.post(f"/tournaments/{code}/pairings")
    assert pairings_resp.status_code == 200
    matches = client.get(f"/tournaments/{code}/matches").json()
    round_2_matches = [match for match in matches if match["round_number"] == 2]
    assert round_2_matches
    for match in round_2_matches:
        report_resp = client.post(
            f"/matches/{match['id']}/report",
            json={"player1_score": 2, "player2_score": 0, "is_admin": True},
        )
        assert report_resp.status_code == 200

    pairings_resp = client.post(f"/tournaments/{code}/pairings")
    assert pairings_resp.status_code == 200
    matches = client.get(f"/tournaments/{code}/matches").json()
    round_3_matches = [match for match in matches if match["round_number"] == 3]
    assert round_3_matches
    for match in round_3_matches:
        report_resp = client.post(
            f"/matches/{match['id']}/report",
            json={"player1_score": 2, "player2_score": 0, "is_admin": True},
        )
        assert report_resp.status_code == 200

    tournament_resp = client.get(f"/tournaments/{code}")
    assert tournament_resp.status_code == 200
    assert tournament_resp.json()["status"] == "COMPLETED"
