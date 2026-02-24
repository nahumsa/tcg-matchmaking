from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.app.core.database import get_db
from . import schemas, services
from backend.app.api.tournaments.services import get_tournament_by_code
from backend.app import models

router = APIRouter(tags=["matches"])

@router.post("/tournaments/{code}/pairings", response_model=List[schemas.MatchResponse])
async def generate_pairings(code: str, db: Session = Depends(get_db)):
    db_tournament = get_tournament_by_code(db, code)
    if not db_tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")

    if not db_tournament.participants:
        raise HTTPException(status_code=400, detail="No participants in tournament")

    # Check for incomplete matches in current round
    past_matches = services.get_tournament_matches(db, db_tournament.id)
    if past_matches:
        max_round = max(m.round_number for m in past_matches)
        incomplete = [m for m in past_matches if m.round_number == max_round and not m.is_completed and not m.is_bye]
        if incomplete:
            raise HTTPException(status_code=400, detail="Complete all current round matches first")
        
        if max_round >= db_tournament.rounds:
            raise HTTPException(status_code=400, detail="Tournament already completed")

    return await services.generate_pairings(db, db_tournament)

@router.get("/tournaments/{code}/matches", response_model=List[schemas.MatchResponse])
def get_matches(code: str, db: Session = Depends(get_db)):
    db_tournament = get_tournament_by_code(db, code)
    if not db_tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    return services.get_tournament_matches(db, db_tournament.id)

@router.post("/matches/{match_id}/report", response_model=schemas.MatchResponse)
async def report_match(match_id: int, update: schemas.MatchUpdate, db: Session = Depends(get_db)):
    db_match = await services.report_match(db, match_id, update)
    if not db_match:
        raise HTTPException(status_code=404, detail="Match not found")
    return db_match
