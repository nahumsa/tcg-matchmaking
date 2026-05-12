from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List


class ConnectionManager:
    def __init__(self):
        # tournament_code -> list of websockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, code: str):
        await websocket.accept()
        if code not in self.active_connections:
            self.active_connections[code] = []
        self.active_connections[code].append(websocket)

    def disconnect(self, websocket: WebSocket, code: str):
        if (
            code in self.active_connections
            and websocket in self.active_connections[code]
        ):
            self.active_connections[code].remove(websocket)
            if not self.active_connections[code]:
                del self.active_connections[code]

    async def broadcast(self, code: str, message: dict):
        if code in self.active_connections:
            stale_connections: list[WebSocket] = []
            for connection in list(self.active_connections[code]):
                try:
                    await connection.send_json(message)
                except (WebSocketDisconnect, OSError):
                    stale_connections.append(connection)
                except RuntimeError as exc:
                    if "websocket" in str(exc).lower():
                        stale_connections.append(connection)
                    else:
                        raise

            for connection in stale_connections:
                self.disconnect(connection, code)


manager = ConnectionManager()
