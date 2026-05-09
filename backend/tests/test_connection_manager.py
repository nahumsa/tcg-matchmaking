import pytest

from backend.app.core.manager import ConnectionManager


class _WorkingSocket:
    def __init__(self) -> None:
        self.messages = []

    async def send_json(self, message: dict) -> None:
        self.messages.append(message)


class _FailingSocket:
    async def send_json(self, message: dict) -> None:
        raise RuntimeError("socket closed")


@pytest.mark.anyio
async def test_broadcast_prunes_failed_connections_and_continues() -> None:
    manager = ConnectionManager()
    working = _WorkingSocket()
    failing = _FailingSocket()

    manager.active_connections["ABC123"] = [working, failing]

    payload = {"event": "match_reported"}
    await manager.broadcast("ABC123", payload)

    assert working.messages == [payload]
    assert manager.active_connections["ABC123"] == [working]
