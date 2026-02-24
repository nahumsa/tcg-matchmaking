import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.main import app, get_db
from backend.app.database import Base
from backend.app.config import settings

# Test database setup
engine = create_engine(settings.TEST_DATABASE_URL, connect_args={"check_same_thread": False})
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
        "/tournaments",
        json={"name": "Test Tournament", "rounds": 5}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Tournament"
    assert data["rounds"] == 5
    assert "code" in data
    assert len(data["code"]) == 6
    assert data["code"].isupper()

def test_create_tournament_default_rounds(setup_db):
    response = client.post(
        "/tournaments",
        json={"name": "Default Rounds Tournament"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["rounds"] == 3
