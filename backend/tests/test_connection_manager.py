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


@pytest.mark.anyio
async def test_broadcast_ignores_already_disconnected_stale_socket() -> None:
    manager = ConnectionManager()
    working = _WorkingSocket()
    failing = _FailingSocket()

    manager.active_connections["ABC123"] = [working, failing]

    original_disconnect = manager.disconnect

    def racing_disconnect(websocket, code):
        if websocket is failing and code in manager.active_connections:
            manager.active_connections[code].remove(websocket)
        original_disconnect(websocket, code)

    manager.disconnect = racing_disconnect

    await manager.broadcast("ABC123", {"event": "match_reported"})

    assert manager.active_connections["ABC123"] == [working]
