import pytest
from fastapi import WebSocketDisconnect

from backend.app.core.manager import ConnectionManager


class _WorkingSocket:
    def __init__(self) -> None:
        self.messages = []

    async def send_json(self, message: dict) -> None:
        self.messages.append(message)


class _FailingSocket:
    async def send_json(self, message: dict) -> None:
        raise WebSocketDisconnect(code=1006)


class _BuggySocket:
    async def send_json(self, message: dict) -> None:
        raise TypeError("Object of type set is not JSON serializable")


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


@pytest.mark.anyio
async def test_broadcast_ignores_stale_socket_when_code_already_removed() -> None:
    manager = ConnectionManager()
    failing = _FailingSocket()

    manager.active_connections["ABC123"] = [failing]

    original_disconnect = manager.disconnect

    def racing_disconnect(websocket, code):
        if websocket is failing and code in manager.active_connections:
            del manager.active_connections[code]
        original_disconnect(websocket, code)

    manager.disconnect = racing_disconnect

    await manager.broadcast("ABC123", {"event": "match_reported"})

    assert "ABC123" not in manager.active_connections


@pytest.mark.anyio
async def test_broadcast_propagates_payload_errors_without_pruning_connections() -> (
    None
):
    manager = ConnectionManager()
    working = _WorkingSocket()
    buggy = _BuggySocket()

    manager.active_connections["ABC123"] = [working, buggy]

    with pytest.raises(TypeError):
        await manager.broadcast("ABC123", {"event": "match_reported", "bad": {1, 2}})

    assert manager.active_connections["ABC123"] == [working, buggy]
