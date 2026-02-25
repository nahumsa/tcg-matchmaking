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

def test_admin_manual_add_participant(setup_db):
    # First create a tournament
    create_resp = client.post("/tournaments", json={"name": "Admin Action Tournament"})
    code = create_resp.json()["code"]

    # Admin manually adds a participant
    # We'll use a new endpoint: POST /tournaments/{code}/participants
    add_resp = client.post(f"/tournaments/{code}/participants", json={"name": "Manual Player"})
    
    assert add_resp.status_code == 201
    data = add_resp.json()
    assert data["name"] == "Manual Player"
    assert data["points"] == 0
    assert "id" in data

def test_admin_remove_participant(setup_db):
    # First create a tournament
    create_resp = client.post("/tournaments", json={"name": "Admin Remove Tournament"})
    code = create_resp.json()["code"]

    # Join a player
    join_resp = client.post(f"/tournaments/{code}/join", json={"name": "RemoveMe"})
    participant_id = join_resp.json()["id"]

    # Admin removes the participant
    # We'll use a new endpoint: DELETE /tournaments/{code}/participants/{id}
    del_resp = client.delete(f"/tournaments/{code}/participants/{participant_id}")
    
    assert del_resp.status_code == 204
    
    # Verify player is gone
    # We can check by trying to join with same name (it should succeed if previous was deleted)
    join_again_resp = client.post(f"/tournaments/{code}/join", json={"name": "RemoveMe"})
    assert join_again_resp.status_code == 200
