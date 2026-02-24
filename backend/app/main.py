from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, List

from . import models, utils, database, pairing
from .database import get_db

app = FastAPI(title="Swiss Matchmaking System")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development, allow all. Update for production.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# WebSocket connection manager
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


@app.websocket("/ws/{code}")
async def websocket_endpoint(websocket: WebSocket, code: str):
    await manager.connect(websocket, code)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, code)


# Pydantic models for request and response
class TournamentCreate(BaseModel):
    name: str
    rounds: Optional[int] = 3


class TournamentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    code: str
    rounds: int


class ParticipantJoin(BaseModel):
    name: str


class ParticipantResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    tournament_id: int
    points: int


class MatchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tournament_id: int
    round_number: int
    player1_id: Optional[int]
    player2_id: Optional[int]
    player1_score: int
    player2_score: int
    is_bye: int
    is_completed: int


class MatchUpdate(BaseModel):
    player1_score: int
    player2_score: int


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/tournaments", response_model=TournamentResponse)
def create_tournament(tournament: TournamentCreate, db: Session = Depends(get_db)):
    # Generate unique code
    code = utils.generate_room_code(db)

    # Create and save tournament
    db_tournament = models.Tournament(
        name=tournament.name, code=code, rounds=tournament.rounds
    )
    db.add(db_tournament)
    db.commit()
    db.refresh(db_tournament)
    return db_tournament


@app.post("/tournaments/{code}/join", response_model=ParticipantResponse)
def join_tournament(
    code: str, participant: ParticipantJoin, db: Session = Depends(get_db)
):
    # Find tournament by code
    db_tournament = (
        db.query(models.Tournament).filter(models.Tournament.code == code).first()
    )
    if not db_tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")

    # Create and save participant
    db_participant = models.Participant(
        name=participant.name, tournament_id=db_tournament.id
    )
    db.add(db_participant)
    db.commit()
    db.refresh(db_participant)

    # Broadcast update
    await manager.broadcast(code, {"event": "participant_joined", "data": {"name": db_participant.name}})

    return db_participant


@app.post("/tournaments/{code}/pairings", response_model=list[MatchResponse])
async def generate_pairings(code: str, db: Session = Depends(get_db)):
    # Find tournament by code
    db_tournament = (
        db.query(models.Tournament).filter(models.Tournament.code == code).first()
    )
    if not db_tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")

    # Get all participants
    participants = db_tournament.participants
    if not participants:
        raise HTTPException(status_code=400, detail="No participants in tournament")

    # Get past matches to determine round number and avoid repeats
    past_matches = (
        db.query(models.Match)
        .filter(models.Match.tournament_id == db_tournament.id)
        .all()
    )

    # Determine next round number
    if not past_matches:
        round_number = 1
    else:
        # Check if all matches in the current round are completed
        max_round = max(m.round_number for m in past_matches)
        incomplete = [
            m
            for m in past_matches
            if m.round_number == max_round and not m.is_completed and not m.is_bye
        ]
        if incomplete:
            raise HTTPException(
                status_code=400, detail="Complete all current round matches first"
            )
        round_number = max_round + 1

    if round_number > db_tournament.rounds:
        raise HTTPException(status_code=400, detail="Tournament already completed")

    # Generate pairings
    new_pairings = pairing.get_pairings(participants, past_matches)

    # Save new matches
    db_matches = []
    for p1, p2 in new_pairings:
        match = models.Match(
            tournament_id=db_tournament.id,
            round_number=round_number,
            player1_id=p1.id,
            player2_id=p2.id if p2 else None,
            is_bye=1 if p2 is None else 0,
            is_completed=1 if p2 is None else 0,  # Bye is automatically completed
        )
        if p2 is None:
            # Bye player gets 3 points automatically (or whatever rule)
            p1.points += 3
        db.add(match)
        db_matches.append(match)

    db.commit()

    # Broadcast update
    await manager.broadcast(code, {"event": "pairings_generated", "round": round_number})

    for m in db_matches:
        db.refresh(m)
    return db_matches


@app.get("/tournaments/{code}/matches", response_model=list[MatchResponse])
def get_matches(code: str, db: Session = Depends(get_db)):
    db_tournament = (
        db.query(models.Tournament).filter(models.Tournament.code == code).first()
    )
    if not db_tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")

    return (
        db.query(models.Match)
        .filter(models.Match.tournament_id == db_tournament.id)
        .all()
    )


@app.post("/matches/{match_id}/report", response_model=MatchResponse)
async def report_match(match_id: int, update: MatchUpdate, db: Session = Depends(get_db)):
    db_match = db.query(models.Match).filter(models.Match.id == match_id).first()
    if not db_match:
        raise HTTPException(status_code=404, detail="Match not found")

    if db_match.is_completed:
        raise HTTPException(status_code=400, detail="Match already reported")

    # Update scores
    db_match.player1_score = update.player1_score
    db_match.player2_score = update.player2_score
    db_match.is_completed = 1

    # Update points (Swiss typical: Win 3, Draw 1, Loss 0)
    p1 = (
        db.query(models.Participant)
        .filter(models.Participant.id == db_match.player1_id)
        .first()
    )
    p2 = (
        db.query(models.Participant)
        .filter(models.Participant.id == db_match.player2_id)
        .first()
    )

    if update.player1_score > update.player2_score:
        p1.points += 3
    elif update.player2_score > update.player1_score:
        p2.points += 3
    else:
        p1.points += 1
        p2.points += 1

    db.commit()

    # Find tournament code for broadcasting
    tournament = db.query(models.Tournament).filter(models.Tournament.id == db_match.tournament_id).first()
    await manager.broadcast(tournament.code, {"event": "match_reported", "match_id": match_id})

    db.refresh(db_match)
    return db_match
