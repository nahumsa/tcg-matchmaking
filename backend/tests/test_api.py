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
    assert data["rounds"] == 5
    assert "code" in data
    assert len(data["code"]) == 6
    assert data["code"].isupper()


def test_create_tournament_default_rounds(setup_db):
    response = client.post("/tournaments", json={"name": "Default Rounds Tournament"})
    assert response.status_code == 200
    data = response.json()
    assert data["rounds"] == 3


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
