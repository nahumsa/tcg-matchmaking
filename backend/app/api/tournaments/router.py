from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.app.core.database import get_db
from . import schemas, services, standings
from backend.app.api.matches.schemas import MatchResponse
from backend.app.api.matches import models
from backend.app.api.participants.schemas import ParticipantResponse

router = APIRouter(prefix="/tournaments", tags=["tournaments"])


@router.post("", response_model=schemas.TournamentResponse)
def create_tournament(
    tournament: schemas.TournamentCreate, db: Session = Depends(get_db)
):
    return services.create_tournament(db, tournament)


# The join endpoint will go to participants router,
# but for now, I'll keep the ones that are explicitly under /tournaments in main.py
# or move them here if they are mostly tournament-focused.

# The plan says "Move tournament endpoints to backend/app/api/tournaments/router.py".
# I'll move everything that starts with /tournaments for now,
# and then refactor them into sub-routers in Phase 2.


@router.get("/{code}/matches", response_model=List[MatchResponse])
def get_matches(code: str, db: Session = Depends(get_db)):
    db_tournament = services.get_tournament_by_code(db, code)
    if not db_tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")

    return (
        db.query(models.Match)
        .filter(models.Match.tournament_id == db_tournament.id)
        .all()
    )


@router.get("/{code}/standings", response_model=List[ParticipantResponse])
def get_standings(code: str, db: Session = Depends(get_db)):
    db_tournament = services.get_tournament_by_code(db, code)
    if not db_tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")

    return standings.calculate_standings(db, db_tournament.id)
