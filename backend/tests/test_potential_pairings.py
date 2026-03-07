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


def test_potential_pairings(setup_db):
    # Create tournament
    create_resp = client.post(
        "/tournaments", json={"name": "Potential Pairings Tournament", "rounds": 3}
    )
    code = create_resp.json()["code"]

    # Add 4 players
    p1 = client.post(f"/tournaments/{code}/join", json={"name": "Player 1"}).json()
    client.post(f"/tournaments/{code}/join", json={"name": "Player 2"}).json()
    client.post(f"/tournaments/{code}/join", json={"name": "Player 3"}).json()
    client.post(f"/tournaments/{code}/join", json={"name": "Player 4"}).json()

    # ROUND 1: Pair 1-2, 3-4. P1 wins, P3 wins.
    client.post(f"/tournaments/{code}/pairings")
    matches = client.get(f"/tournaments/{code}/matches").json()

    # Force report matches
    for m in matches:
        # Just report some results to update points
        client.post(
            f"/matches/{m['id']}/report",
            json={"player1_score": 2, "player2_score": 0, "is_admin": True},
        )

    # Get points for P1
    p1_data = client.get(f"/tournaments/{code}/standings").json()
    next(p for p in p1_data if p["id"] == p1["id"])

    # Potential pairings for P1 should not include who they just played
    # Find who P1 played
    m_p1 = next(
        m for m in matches if m["player1_id"] == p1["id"] or m["player2_id"] == p1["id"]
    )
    played_opp_id = (
        m_p1["player2_id"] if m_p1["player1_id"] == p1["id"] else m_p1["player1_id"]
    )

    potential_resp = client.get(
        f"/tournaments/{code}/participants/{p1['id']}/potential-pairings"
    )
    assert potential_resp.status_code == 200
    potential = potential_resp.json()

    # Should NOT contain who they already played
    assert not any(opp["id"] == played_opp_id for opp in potential)
    # Should contain others with similar points (everyone is 2-0 or 0-2, so points are 3 or 0)
    assert len(potential) > 0
