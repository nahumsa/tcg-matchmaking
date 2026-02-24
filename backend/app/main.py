from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .core.manager import manager
from .api.tournaments.router import router as tournaments_router
from .api.participants.router import router as participants_router
from .api.matches.router import router as matches_router

app = FastAPI(title="Swiss Matchmaking System")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development, allow all. Update for production.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tournaments_router)
app.include_router(participants_router)
app.include_router(matches_router)


@app.websocket("/ws/{code}")
async def websocket_endpoint(websocket: WebSocket, code: str):
    await manager.connect(websocket, code)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, code)


@app.get("/health")
def health_check():
    return {"status": "ok"}
