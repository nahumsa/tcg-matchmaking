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


def test_e2e_table_ordering(setup_db):
    # 1. Create tournament
    create_resp = client.post(
        "/tournaments", json={"name": "E2E Table Test", "rounds": 2}
    )
    code = create_resp.json()["code"]

    # 2. Join 4 players
    client.post(f"/tournaments/{code}/join", json={"name": "P1"}).json()
    client.post(f"/tournaments/{code}/join", json={"name": "P2"}).json()
    client.post(f"/tournaments/{code}/join", json={"name": "P3"}).json()
    client.post(f"/tournaments/{code}/join", json={"name": "P4"}).json()

    # 3. Generate Round 1 pairings
    client.post(f"/tournaments/{code}/pairings")
    r1_matches = client.get(f"/tournaments/{code}/matches").json()
    assert len(r1_matches) == 2
    # In round 1, everyone has 0 points, so table numbers are effectively random within brackets
    # but they should be 1 and 2
    table_numbers = {m["table_number"] for m in r1_matches}
    assert table_numbers == {1, 2}

    # 4. Report results to create point difference
    # Let's say P1 wins (3pts), P2 loses (0pts), P3 wins (3pts), P4 loses (0pts)
    m1 = r1_matches[0]
    m2 = r1_matches[1]

    # We need to know who is who in matches
    client.post(
        f"/matches/{m1['id']}/report", json={"player1_score": 2, "player2_score": 0}
    )
    client.post(
        f"/matches/{m2['id']}/report", json={"player1_score": 2, "player2_score": 0}
    )

    # 5. Generate Round 2 pairings
    client.post(f"/tournaments/{code}/pairings")
    r2_matches = [
        m
        for m in client.get(f"/tournaments/{code}/matches").json()
        if m["round_number"] == 2
    ]
    assert len(r2_matches) == 2

    # Standings check
    standings = client.get(f"/tournaments/{code}/standings").json()
    # P1 and P3 should have 3 points. P2 and P4 should have 0 points.
    top_players = [s["id"] for s in standings if s["points"] == 3]
    bot_players = [s["id"] for s in standings if s["points"] == 0]
    assert len(top_players) == 2
    assert len(bot_players) == 2

    # Match with top players should be Table 1
    m_top = next(
        m
        for m in r2_matches
        if m["player1_id"] in top_players and m["player2_id"] in top_players
    )
    m_bot = next(
        m
        for m in r2_matches
        if m["player1_id"] in bot_players and m["player2_id"] in bot_players
    )

    assert m_top["table_number"] == 1
    assert m_bot["table_number"] == 2
