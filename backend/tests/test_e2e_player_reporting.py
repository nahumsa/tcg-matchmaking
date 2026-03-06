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


def test_full_player_reporting_flow(setup_db):
    # 1. Create tournament (Admin)
    resp = client.post("/tournaments", json={"name": "E2E Reporting Flow", "rounds": 3})
    code = resp.json()["code"]

    # 2. Join 4 players
    client.post(f"/tournaments/{code}/join", json={"name": "Alice"})
    client.post(f"/tournaments/{code}/join", json={"name": "Bob"})
    client.post(f"/tournaments/{code}/join", json={"name": "Charlie"})
    client.post(f"/tournaments/{code}/join", json={"name": "David"})

    # 3. Start Round 1 (Admin pairings)
    client.post(f"/tournaments/{code}/pairings")
    matches = client.get(f"/tournaments/{code}/matches").json()
    assert len(matches) == 2

    m1 = matches[0]
    m2 = matches[1]

    # Assign roles for testing
    reporter1_id = m1["player1_id"]
    opponent1_id = m1["player2_id"]
    reporter2_id = m2["player1_id"]
    opponent2_id = m2["player2_id"]

    # 4. Reporter 1 reports match 1 (Reporter 1 wins 2-0)
    resp = client.post(
        f"/tournaments/{code}/matches/{m1['id']}/report",
        json={"player1_score": 2, "player2_score": 0, "reported_by_id": reporter1_id},
    )
    assert resp.status_code == 200

    # 5. Reporter 2 reports match 2 (Reporter 2 wins 2-1)
    client.post(
        f"/tournaments/{code}/matches/{m2['id']}/report",
        json={"player1_score": 2, "player2_score": 1, "reported_by_id": reporter2_id},
    )

    # 6. Verify Standings
    standings = client.get(f"/tournaments/{code}/standings").json()
    assert next(s for s in standings if s["id"] == reporter1_id)["points"] == 3
    assert next(s for s in standings if s["id"] == reporter2_id)["points"] == 3
    assert next(s for s in standings if s["id"] == opponent1_id)["points"] == 0
    assert next(s for s in standings if s["id"] == opponent2_id)["points"] == 0

    # 7. Opponent 2 corrects the score to them winning 2-0
    resp = client.post(
        f"/tournaments/{code}/matches/{m2['id']}/report",
        json={"player1_score": 0, "player2_score": 2, "reported_by_id": opponent2_id},
    )
    assert resp.status_code == 200

    # 8. Verify Standings
    standings = client.get(f"/tournaments/{code}/standings").json()
    assert next(s for s in standings if s["id"] == opponent2_id)["points"] == 3
    assert next(s for s in standings if s["id"] == reporter2_id)["points"] == 0

    # 9. Admin overrides Match 1 to a Draw 1-1
    client.post(
        f"/tournaments/{code}/matches/{m1['id']}/report",
        json={"player1_score": 1, "player2_score": 1, "is_admin": True},
    )

    # 10. Verify Standings
    standings = client.get(f"/tournaments/{code}/standings").json()
    assert next(s for s in standings if s["id"] == reporter1_id)["points"] == 1
    assert next(s for s in standings if s["id"] == opponent1_id)["points"] == 1
    assert next(s for s in standings if s["id"] == opponent2_id)["points"] == 3
    assert next(s for s in standings if s["id"] == reporter2_id)["points"] == 0
