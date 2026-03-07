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


def test_create_tournament(setup_db):
    response = client.post(
        "/tournaments", json={"name": "Test Tournament", "rounds": 5}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Tournament"
    assert data["rounds"] == 1
    assert "code" in data
    assert len(data["code"]) == 6
    assert data["code"].isupper()


def test_rounds_set_on_first_pairing(setup_db):
    response = client.post("/tournaments", json={"name": "Auto Rounds Tournament"})
    assert response.status_code == 200
    code = response.json()["code"]

    for idx in range(8):
        join_resp = client.post(f"/tournaments/{code}/join", json={"name": f"P{idx}"})
        assert join_resp.status_code == 200

    tournament_resp = client.get(f"/tournaments/{code}")
    assert tournament_resp.status_code == 200
    assert tournament_resp.json()["rounds"] == 1

    pairings_resp = client.post(f"/tournaments/{code}/pairings")
    assert pairings_resp.status_code == 200

    tournament_resp = client.get(f"/tournaments/{code}")
    assert tournament_resp.status_code == 200
    assert tournament_resp.json()["rounds"] == 3


def test_join_tournament(setup_db):
    # First create a tournament
    create_resp = client.post("/tournaments", json={"name": "Tournament for Joining"})
    code = create_resp.json()["code"]

    # Then join it
    join_resp = client.post(f"/tournaments/{code}/join", json={"name": "Test Player"})
    assert join_resp.status_code == 200
    data = join_resp.json()
    assert data["name"] == "Test Player"
    assert data["points"] == 0
    assert "id" in data


def test_join_non_existent_tournament(setup_db):
    response = client.post(
        "/tournaments/NONEXISTENT/join", json={"name": "Lost Player"}
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Tournament not found"


def test_join_tournament_with_pokemon_selection(setup_db):
    create_resp = client.post("/tournaments", json={"name": "Pokemon Join"})
    code = create_resp.json()["code"]

    join_resp = client.post(
        f"/tournaments/{code}/join",
        json={"name": "Misty", "pokemon_1": "Pikachu", "pokemon_2": "Eevee"},
    )
    assert join_resp.status_code == 200
    data = join_resp.json()
    assert data["pokemon_1"] == "Pikachu"
    assert data["pokemon_2"] == "Eevee"


def test_join_tournament_rejects_duplicate_pokemon(setup_db):
    create_resp = client.post("/tournaments", json={"name": "Pokemon Validation"})
    code = create_resp.json()["code"]

    join_resp = client.post(
        f"/tournaments/{code}/join",
        json={"name": "Brock", "pokemon_1": "Pikachu", "pokemon_2": "Pikachu"},
    )
    assert join_resp.status_code == 422
