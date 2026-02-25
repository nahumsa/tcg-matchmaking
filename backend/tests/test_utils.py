import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.core.database import Base
from backend.app.api.tournaments import models, services as utils
from backend.app.core.config import settings

# Test database setup
engine = create_engine(
    settings.TEST_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="module")
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def test_generate_room_code(setup_db):
    db = TestingSessionLocal()
    # Generate a code and check its format
    code = utils.generate_room_code(db)
    assert len(code) == 6
    assert code.isupper()
    assert code.isalpha()
    db.close()


def test_generate_room_code_uniqueness(setup_db):
    db = TestingSessionLocal()
    # Mock an existing tournament with a specific code
    existing_code = "ABCDEF"
    db_tournament = models.Tournament(name="Test Tournament", code=existing_code)
    db.add(db_tournament)
    db.commit()

    # Generate a code and ensure it's not the existing one
    new_code = utils.generate_room_code(db)
    assert new_code != existing_code
    db.close()
