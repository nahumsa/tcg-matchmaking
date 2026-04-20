from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.app.core.database import get_db
from . import schemas, services, standings
from backend.app.api.participants.schemas import ParticipantResponse

router = APIRouter(prefix="/tournaments", tags=["tournaments"])


@router.post("", response_model=schemas.TournamentResponse)
def create_tournament(
    tournament: schemas.TournamentCreate, db: Session = Depends(get_db)
):
    return services.create_tournament(db, tournament)


@router.get("/{code}", response_model=schemas.TournamentResponse)
def get_tournament(code: str, db: Session = Depends(get_db)):
    db_tournament = services.get_tournament_by_code(db, code)
    if not db_tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    return db_tournament


@router.get("/{code}/standings", response_model=List[ParticipantResponse])
def get_standings(code: str, db: Session = Depends(get_db)):
    db_tournament = services.get_tournament_by_code(db, code)
    if not db_tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")

    return standings.calculate_standings(db, db_tournament.id)


@router.post("/{code}/complete", response_model=schemas.TournamentResponse)
async def complete_tournament(code: str, db: Session = Depends(get_db)):
    db_tournament = await services.complete_tournament(db, code)
    if not db_tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    return db_tournament
