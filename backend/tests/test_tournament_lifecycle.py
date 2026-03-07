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


def test_create_tournament_has_active_status(setup_db):
    response = client.post(
        "/tournaments", json={"name": "Lifecycle Tournament", "rounds": 3}
    )
    assert response.status_code == 200
    data = response.json()
    # This should fail until I update the schema and model
    assert data["status"] == "ACTIVE"


def test_tournament_completes_after_last_round(setup_db):
    # 1. Create tournament with 1 round and 2 players
    create_resp = client.post(
        "/tournaments", json={"name": "Quick Tournament", "rounds": 1}
    )
    code = create_resp.json()["code"]

    # 2. Add 2 players
    client.post(f"/tournaments/{code}/join", json={"name": "P1"})
    client.post(f"/tournaments/{code}/join", json={"name": "P2"})

    # 3. Generate pairings
    client.post(f"/tournaments/{code}/pairings")

    # 4. Get match ID
    matches = client.get(f"/tournaments/{code}/matches").json()
    match_id = matches[0]["id"]

    # 5. Report match result
    client.post(
        f"/matches/{match_id}/report",
        json={"player1_score": 2, "player2_score": 0, "is_admin": True},
    )

    # 6. Check tournament status
    client.get("/tournaments")
    # I need an endpoint to get a single tournament or check this one
    # test_api.py shows /tournaments returns a list? No, it doesn't show GET /tournaments/{code}

    # Let's check the created tournament again
    # I'll use the response from reporting match if it includes tournament status?
    # No, but I can check via a new endpoint if I add it, or just re-fetch matches/standings

    # For now I'll check if the tournament object in DB is COMPLETED
    # Or I'll add GET /tournaments/{code} endpoint which is useful anyway

    tournament_resp = client.get(f"/tournaments/{code}")
    assert tournament_resp.status_code == 200
    assert tournament_resp.json()["status"] == "COMPLETED"


def test_cannot_join_completed_tournament(setup_db):
    # 1. Create and complete a tournament
    create_resp = client.post("/tournaments", json={"name": "Finished", "rounds": 1})
    code = create_resp.json()["code"]
    client.post(f"/tournaments/{code}/join", json={"name": "P1"})
    client.post(f"/tournaments/{code}/join", json={"name": "P2"})
    client.post(f"/tournaments/{code}/pairings")
    matches = client.get(f"/tournaments/{code}/matches").json()
    client.post(
        f"/matches/{matches[0]['id']}/report",
        json={"player1_score": 2, "player2_score": 0, "is_admin": True},
    )

    # 2. Try to join
    join_resp = client.post(f"/tournaments/{code}/join", json={"name": "Late P3"})
    assert join_resp.status_code == 400
    assert "completed" in join_resp.json()["detail"].lower()


def test_cannot_report_match_in_completed_tournament(setup_db):
    # 1. Create and complete a tournament
    create_resp = client.post("/tournaments", json={"name": "Finished 2", "rounds": 1})
    code = create_resp.json()["code"]
    client.post(f"/tournaments/{code}/join", json={"name": "P1"})
    client.post(f"/tournaments/{code}/join", json={"name": "P2"})
    client.post(f"/tournaments/{code}/pairings")
    matches = client.get(f"/tournaments/{code}/matches").json()
    match_id = matches[0]["id"]
    client.post(
        f"/matches/{match_id}/report",
        json={"player1_score": 2, "player2_score": 0, "is_admin": True},
    )

    # 2. Try to report again
    report_resp = client.post(
        f"/matches/{match_id}/report",
        json={"player1_score": 1, "player2_score": 1, "is_admin": True},
    )
    assert report_resp.status_code == 400
    assert "completed" in report_resp.json()["detail"].lower()


def test_cannot_generate_pairings_in_completed_tournament(setup_db):
    # 1. Create and complete a tournament
    create_resp = client.post("/tournaments", json={"name": "Finished 3", "rounds": 1})
    code = create_resp.json()["code"]
    client.post(f"/tournaments/{code}/join", json={"name": "P1"})
    client.post(f"/tournaments/{code}/join", json={"name": "P2"})
    client.post(f"/tournaments/{code}/pairings")
    matches = client.get(f"/tournaments/{code}/matches").json()
    client.post(
        f"/matches/{matches[0]['id']}/report",
        json={"player1_score": 2, "player2_score": 0, "is_admin": True},
    )

    # 2. Try to generate pairings
    pair_resp = client.post(f"/tournaments/{code}/pairings")
    assert pair_resp.status_code == 400
    assert "completed" in pair_resp.json()["detail"].lower()
