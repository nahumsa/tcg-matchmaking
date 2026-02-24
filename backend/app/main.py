from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict
from typing import Optional

from . import models, utils, database
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
    return db_participant
