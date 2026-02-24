from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, List

from . import models, utils, pairing
from .core.database import get_db
from .core.manager import manager
from .api.tournaments.router import router as tournaments_router
from .api.participants.router import router as participants_router

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
    await manager.broadcast(
        code, {"event": "pairings_generated", "round": round_number}
    )

    for m in db_matches:
        db.refresh(m)
    return db_matches


@app.post("/matches/{match_id}/report", response_model=MatchResponse)
async def report_match(
    match_id: int, update: MatchUpdate, db: Session = Depends(get_db)
):
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
    tournament = (
        db.query(models.Tournament)
        .filter(models.Tournament.id == db_match.tournament_id)
        .first()
    )
    await manager.broadcast(
        tournament.code, {"event": "match_reported", "match_id": match_id}
    )

    db.refresh(db_match)
    return db_match
