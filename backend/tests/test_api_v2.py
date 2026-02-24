import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.main import app
from backend.app.core.database import get_db, Base
from backend.app.core.config import settings
from backend.app.api.participants import models

# Test database setup
engine = create_engine(settings.TEST_DATABASE_URL, connect_args={"check_same_thread": False})
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

def test_full_tournament_flow(setup_db):
    # 1. Create tournament
    resp = client.post("/tournaments", json={"name": "Swiss Test", "rounds": 2})
    code = resp.json()["code"]

    # 2. Join 3 players (to test BYE)
    client.post(f"/tournaments/{code}/join", json={"name": "P1"})
    client.post(f"/tournaments/{code}/join", json={"name": "P2"})
    client.post(f"/tournaments/{code}/join", json={"name": "P3"})

    # 3. Generate Round 1 Pairings
    resp = client.post(f"/tournaments/{code}/pairings")
    assert resp.status_code == 200
    matches = resp.json()
    assert len(matches) == 2 # One match, one bye
    
    bye_match = next(m for m in matches if m["is_bye"] == 1)
    regular_match = next(m for m in matches if m["is_bye"] == 0)
    
    assert bye_match["is_completed"] == 1
    assert regular_match["is_completed"] == 0

    # 4. Try to generate Round 2 (should fail)
    resp = client.post(f"/tournaments/{code}/pairings")
    assert resp.status_code == 400
    assert "Complete all current round matches first" in resp.json()["detail"]

    # 5. Report Round 1 match
    match_id = regular_match["id"]
    resp = client.post(f"/matches/{match_id}/report", json={"player1_score": 2, "player2_score": 1})
    assert resp.status_code == 200
    assert resp.json()["is_completed"] == 1
    
    # 6. Check points
    db = TestingSessionLocal()
    p1 = db.query(models.Participant).filter(models.Participant.id == regular_match["player1_id"]).first()
    p2 = db.query(models.Participant).filter(models.Participant.id == regular_match["player2_id"]).first()
    pb = db.query(models.Participant).filter(models.Participant.id == bye_match["player1_id"]).first()
    
    assert p1.points == 3
    assert p2.points == 0
    assert pb.points == 3
    db.close()

    # 7. Generate Round 2 Pairings
    resp = client.post(f"/tournaments/{code}/pairings")
    assert resp.status_code == 200
    matches_r2 = resp.json()
    assert len(matches_r2) == 2
    assert matches_r2[0]["round_number"] == 2
