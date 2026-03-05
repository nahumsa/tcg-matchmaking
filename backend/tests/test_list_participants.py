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


def test_list_participants(setup_db):
    # 1. Create a tournament
    create_resp = client.post("/tournaments", json={"name": "List Test", "rounds": 3})
    code = create_resp.json()["code"]

    # 2. Add some participants
    client.post(f"/tournaments/{code}/join", json={"name": "Alice"})
    client.post(f"/tournaments/{code}/join", json={"name": "Bob"})

    # 3. List participants
    list_resp = client.get(f"/tournaments/{code}/participants")

    assert list_resp.status_code == 200
    data = list_resp.json()
    assert len(data) == 2
    names = [p["name"] for p in data]
    assert "Alice" in names
    assert "Bob" in names
