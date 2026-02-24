import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.database import Base, get_db
from backend.app.config import settings

# Test database setup
engine = create_engine(settings.TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module")
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

def test_db_session(setup_db):
    db = TestingSessionLocal()
    assert db is not None
    db.close()

def test_get_db(setup_db):
    db_gen = get_db()
    db = next(db_gen)
    assert db is not None
    db.close()
