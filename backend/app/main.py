from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict
from typing import Optional

from . import models, utils, database
from .database import get_db

app = FastAPI(title="Swiss Matchmaking System")

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

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/tournaments", response_model=TournamentResponse)
def create_tournament(tournament: TournamentCreate, db: Session = Depends(get_db)):
    # Generate unique code
    code = utils.generate_room_code(db)
    
    # Create and save tournament
    db_tournament = models.Tournament(
        name=tournament.name,
        code=code,
        rounds=tournament.rounds
    )
    db.add(db_tournament)
    db.commit()
    db.refresh(db_tournament)
    return db_tournament
