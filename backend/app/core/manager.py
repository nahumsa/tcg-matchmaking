from fastapi import WebSocket
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
        if code in self.active_connections:
            self.active_connections[code].remove(websocket)
            if not self.active_connections[code]:
                del self.active_connections[code]

    async def broadcast(self, code: str, message: dict):
        if code in self.active_connections:
            for connection in self.active_connections[code]:
                await connection.send_json(message)

manager = ConnectionManager()
