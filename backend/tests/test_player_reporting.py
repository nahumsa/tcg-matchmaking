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


def test_player_report_success(setup_db):
    # 1. Create tournament
    resp = client.post("/tournaments", json={"name": "Player Report Test", "rounds": 3})
    code = resp.json()["code"]

    # 2. Join 2 players
    p1 = client.post(f"/tournaments/{code}/join", json={"name": "Alice"}).json()
    p2 = client.post(f"/tournaments/{code}/join", json={"name": "Bob"}).json()

    # 3. Generate pairings
    client.post(f"/tournaments/{code}/pairings")
    matches = client.get(f"/tournaments/{code}/matches").json()
    match = matches[0]

    # 4. Alice reports the match via the NEW endpoint
    # URL: /tournaments/{code}/matches/{match_id}/report
    resp = client.post(
        f"/tournaments/{code}/matches/{match['id']}/report",
        json={
            "player1_score": 2,
            "player2_score": 0,
            "reported_by_id": p1["id"]
        }
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["is_completed"] == 1
    assert data["player1_score"] == 2
    assert data["player2_score"] == 0

    # 5. Check standings
    standings = client.get(f"/tournaments/{code}/standings").json()
    alice = next(s for s in standings if s["id"] == p1["id"])
    bob = next(s for s in standings if s["id"] == p2["id"])
    assert alice["points"] == 3
    assert bob["points"] == 0


def test_admin_report_success(setup_db):
    resp = client.post("/tournaments", json={"name": "Admin Report Test", "rounds": 3})
    code = resp.json()["code"]
    p1 = client.post(f"/tournaments/{code}/join", json={"name": "Alice"}).json()
    p2 = client.post(f"/tournaments/{code}/join", json={"name": "Bob"}).json()
    client.post(f"/tournaments/{code}/pairings")
    match = client.get(f"/tournaments/{code}/matches").json()[0]

    # Admin reports (no reported_by_id, but is_admin=True)
    resp = client.post(
        f"/tournaments/{code}/matches/{match['id']}/report",
        json={
            "player1_score": 1,
            "player2_score": 2,
            "is_admin": True
        }
    )
    assert resp.status_code == 200
    assert resp.json()["player1_score"] == 1
    assert resp.json()["player2_score"] == 2


def test_player_report_forbidden(setup_db):
    resp = client.post("/tournaments", json={"name": "Forbidden Report Test", "rounds": 3})
    code = resp.json()["code"]
    p1 = client.post(f"/tournaments/{code}/join", json={"name": "Alice"}).json()
    p2 = client.post(f"/tournaments/{code}/join", json={"name": "Bob"}).json()
    p3 = client.post(f"/tournaments/{code}/join", json={"name": "Charlie"}).json()
    
    client.post(f"/tournaments/{code}/pairings")
    matches = client.get(f"/tournaments/{code}/matches").json()
    # Find a match where P3 is NOT a participant
    match = next(m for m in matches if m["player1_id"] != p3["id"] and m["player2_id"] != p3["id"] and not m["is_bye"])

    # Charlie (P3) tries to report Alice's match
    resp = client.post(
        f"/tournaments/{code}/matches/{match['id']}/report",
        json={
            "player1_score": 2,
            "player2_score": 0,
            "reported_by_id": p3["id"]
        }
    )
    assert resp.status_code == 403
    assert "Not authorized" in resp.json()["detail"]


def test_edit_report_success(setup_db):
    resp = client.post("/tournaments", json={"name": "Edit Report Test", "rounds": 3})
    code = resp.json()["code"]
    p1 = client.post(f"/tournaments/{code}/join", json={"name": "Alice"}).json()
    p2 = client.post(f"/tournaments/{code}/join", json={"name": "Bob"}).json()
    client.post(f"/tournaments/{code}/pairings")
    match = client.get(f"/tournaments/{code}/matches").json()[0]

    # 1. Alice reports 2-0
    client.post(
        f"/tournaments/{code}/matches/{match['id']}/report",
        json={"player1_score": 2, "player2_score": 0, "reported_by_id": p1["id"]}
    )
    
    # Verify points
    standings = client.get(f"/tournaments/{code}/standings").json()
    assert next(s for s in standings if s["id"] == p1["id"])["points"] == 3

    # 2. Bob corrects to 1-2 (Alice loses)
    resp = client.post(
        f"/tournaments/{code}/matches/{match['id']}/report",
        json={"player1_score": 1, "player2_score": 2, "reported_by_id": p2["id"]}
    )
    assert resp.status_code == 200
    
    # Verify points updated (Bob should have 3, Alice 0)
    standings = client.get(f"/tournaments/{code}/standings").json()
    assert next(s for s in standings if s["id"] == p1["id"])["points"] == 0
    assert next(s for s in standings if s["id"] == p2["id"])["points"] == 3


def test_report_completed_tournament(setup_db):
    resp = client.post("/tournaments", json={"name": "Completed Test", "rounds": 1})
    code = resp.json()["code"]
    p1 = client.post(f"/tournaments/{code}/join", json={"name": "Alice"}).json()
    p2 = client.post(f"/tournaments/{code}/join", json={"name": "Bob"}).json()
    client.post(f"/tournaments/{code}/pairings")
    match = client.get(f"/tournaments/{code}/matches").json()[0]

    # 1. Report to complete tournament
    client.post(
        f"/tournaments/{code}/matches/{match['id']}/report",
        json={"player1_score": 2, "player2_score": 0, "is_admin": True}
    )
    
    # Verify completed
    t_resp = client.get(f"/tournaments/{code}").json()
    assert t_resp["status"] == "COMPLETED"

    # 2. Try to edit after completion (should fail)
    resp = client.post(
        f"/tournaments/{code}/matches/{match['id']}/report",
        json={"player1_score": 0, "player2_score": 2, "is_admin": True}
    )
    assert resp.status_code == 400
    assert "completed" in resp.json()["detail"].lower()
