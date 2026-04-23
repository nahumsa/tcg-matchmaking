import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.api.participants.router import relogin_rate_limiter
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


def _client_with_ip(ip_address: str) -> TestClient:
    return TestClient(app, client=(ip_address, 50000))


@pytest.fixture(scope="module")
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(autouse=True)
def reset_relogin_limiters():
    relogin_rate_limiter._attempts.clear()
    yield


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
    assert "reconnect_code" in data
    assert len(data["reconnect_code"]) > 20


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


def test_join_generates_unique_reconnect_codes(setup_db):
    create_resp = client.post("/tournaments", json={"name": "Reconnect Uniqueness"})
    code = create_resp.json()["code"]

    first = client.post(f"/tournaments/{code}/join", json={"name": "Player One"})
    second = client.post(f"/tournaments/{code}/join", json={"name": "Player Two"})

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["reconnect_code"] != second.json()["reconnect_code"]


def test_relogin_with_reconnect_code_success(setup_db):
    create_resp = client.post("/tournaments", json={"name": "Relogin Tournament"})
    code = create_resp.json()["code"]
    join_resp = client.post(f"/tournaments/{code}/join", json={"name": "Relogin User"})
    reconnect_code = join_resp.json()["reconnect_code"]

    relogin_resp = client.post(
        f"/tournaments/{code}/participants/relogin",
        json={"reconnect_code": reconnect_code},
    )

    assert relogin_resp.status_code == 200
    assert relogin_resp.json()["id"] == join_resp.json()["id"]
    assert "reconnect_code" not in relogin_resp.json()


def test_relogin_with_reconnect_code_not_found(setup_db):
    create_resp = client.post("/tournaments", json={"name": "Relogin Missing"})
    code = create_resp.json()["code"]

    relogin_resp = client.post(
        f"/tournaments/{code}/participants/relogin",
        json={"reconnect_code": "does-not-exist"},
    )

    assert relogin_resp.status_code == 401
    assert relogin_resp.json()["detail"] == "Invalid reconnect credentials"


def test_relogin_rate_limited_after_repeated_failures(setup_db):
    create_resp = client.post("/tournaments", json={"name": "Relogin Rate Limit"})
    code = create_resp.json()["code"]
    for idx in range(5):
        join_resp = client.post(f"/tournaments/{code}/join", json={"name": f"P{idx}"})
        assert join_resp.status_code == 200

    for _ in range(10):
        relogin_resp = client.post(
            f"/tournaments/{code}/participants/relogin",
            json={"reconnect_code": "invalid"},
        )
        assert relogin_resp.status_code == 401

    limited_resp = client.post(
        f"/tournaments/{code}/participants/relogin",
        json={"reconnect_code": "invalid"},
    )
    assert limited_resp.status_code == 429


def test_relogin_rate_limit_scales_with_active_participants(setup_db):
    create_resp = client.post(
        "/tournaments", json={"name": "Relogin Tournament Budget"}
    )
    code = create_resp.json()["code"]
    for idx in range(3):
        join_resp = client.post(
            f"/tournaments/{code}/join", json={"name": f"Player {idx}"}
        )
        assert join_resp.status_code == 200

    for _ in range(6):
        relogin_resp = client.post(
            f"/tournaments/{code}/participants/relogin",
            json={"reconnect_code": "invalid"},
        )
        assert relogin_resp.status_code == 401

    limited_resp = client.post(
        f"/tournaments/{code}/participants/relogin",
        json={"reconnect_code": "invalid"},
    )
    assert limited_resp.status_code == 429


def test_relogin_rate_limit_isolated_per_ip(setup_db):
    create_resp = client.post("/tournaments", json={"name": "Relogin IP Isolation"})
    code = create_resp.json()["code"]
    join_resp = client.post(f"/tournaments/{code}/join", json={"name": "Reset User"})
    reconnect_code = join_resp.json()["reconnect_code"]

    first_ip_client = _client_with_ip("203.0.113.10")
    second_ip_client = _client_with_ip("203.0.113.11")
    try:
        for _ in range(2):
            failed = first_ip_client.post(
                f"/tournaments/{code}/participants/relogin",
                json={"reconnect_code": "invalid"},
            )
            assert failed.status_code == 401

        limited_resp = first_ip_client.post(
            f"/tournaments/{code}/participants/relogin",
            json={"reconnect_code": reconnect_code},
        )
        assert limited_resp.status_code == 429

        unaffected_resp = second_ip_client.post(
            f"/tournaments/{code}/participants/relogin",
            json={"reconnect_code": reconnect_code},
        )
        assert unaffected_resp.status_code == 200
        assert unaffected_resp.json()["id"] == join_resp.json()["id"]
    finally:
        first_ip_client.close()
        second_ip_client.close()


def test_successful_relogin_does_not_reset_tournament_failure_budget(setup_db):
    create_resp = client.post("/tournaments", json={"name": "Relogin Reset"})
    code = create_resp.json()["code"]
    join_resp = client.post(f"/tournaments/{code}/join", json={"name": "Reset User"})
    reconnect_code = join_resp.json()["reconnect_code"]

    failed = client.post(
        f"/tournaments/{code}/participants/relogin",
        json={"reconnect_code": "invalid"},
    )
    assert failed.status_code == 401

    success = client.post(
        f"/tournaments/{code}/participants/relogin",
        json={"reconnect_code": reconnect_code},
    )
    assert success.status_code == 200

    failed = client.post(
        f"/tournaments/{code}/participants/relogin",
        json={"reconnect_code": "invalid"},
    )
    assert failed.status_code == 401

    limited_resp = client.post(
        f"/tournaments/{code}/participants/relogin",
        json={"reconnect_code": reconnect_code},
    )
    assert limited_resp.status_code == 429
