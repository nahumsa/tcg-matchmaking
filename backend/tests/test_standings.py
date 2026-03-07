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


def test_standings_calculation(setup_db):
    # Create tournament
    create_resp = client.post(
        "/tournaments", json={"name": "Standings Tournament", "rounds": 3}
    )
    code = create_resp.json()["code"]

    # Add players
    client.post(f"/tournaments/{code}/join", json={"name": "Player 1"}).json()
    client.post(f"/tournaments/{code}/join", json={"name": "Player 2"}).json()
    client.post(f"/tournaments/{code}/join", json={"name": "Player 3"}).json()
    client.post(f"/tournaments/{code}/join", json={"name": "Player 4"}).json()

    # Generate pairings for Round 1
    pair_resp = client.post(f"/tournaments/{code}/pairings")
    assert pair_resp.status_code == 200

    # Get matches for Round 1
    matches_resp = client.get(f"/tournaments/{code}/matches")
    matches = matches_resp.json()
    assert len(matches) == 2

    # Report results: First match is a win for P1 (whoever that is), second is a draw.
    m1 = matches[0]
    client.post(
        f"/matches/{m1['id']}/report",
        json={"player1_score": 2, "player2_score": 0, "is_admin": True},
    )

    m2 = matches[1]
    client.post(
        f"/matches/{m2['id']}/report",
        json={"player1_score": 1, "player2_score": 1, "is_admin": True},
    )

    # Get standings
    standings_resp = client.get(f"/tournaments/{code}/standings")
    assert standings_resp.status_code == 200
    standings = standings_resp.json()

    # One player should have 3 points, two should have 1 point, one should have 0 points.
    points = [s["points"] for s in standings]
    assert sorted(points, reverse=True) == [3, 1, 1, 0]

    # Check ranks
    ranks = [s["rank"] for s in standings]
    assert ranks == [1, 2, 3, 4]

    # Check OMW% existence
    assert all("omw_percentage" in s for s in standings)
