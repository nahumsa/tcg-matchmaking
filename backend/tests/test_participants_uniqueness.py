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

def test_join_tournament_duplicate_name(setup_db):
    # First create a tournament
    create_resp = client.post("/tournaments", json={"name": "Duplicate Name Tournament"})
    code = create_resp.json()["code"]

    # First player joins
    join1_resp = client.post(f"/tournaments/{code}/join", json={"name": "SameName"})
    assert join1_resp.status_code == 200

    # Second player joins with same name
    join2_resp = client.post(f"/tournaments/{code}/join", json={"name": "SameName"})
    
    # This should fail with 400 Bad Request
    assert join2_resp.status_code == 400
    assert join2_resp.json()["detail"] == "Participant with this name already exists in this tournament"
