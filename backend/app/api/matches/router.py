from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.app.core.database import get_db
from . import schemas, services
from backend.app.api.tournaments.services import get_tournament_by_code

router = APIRouter(tags=["matches"])


@router.post("/tournaments/{code}/pairings", response_model=List[schemas.MatchResponse])
async def generate_pairings(code: str, db: Session = Depends(get_db)):
    db_tournament = get_tournament_by_code(db, code)
    if not db_tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")

    return await services.generate_pairings(db, db_tournament)


@router.get("/tournaments/{code}/matches", response_model=List[schemas.MatchResponse])
def get_matches(code: str, db: Session = Depends(get_db)):
    db_tournament = get_tournament_by_code(db, code)
    if not db_tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    return services.get_tournament_matches(db, db_tournament.id)


@router.post(
    "/tournaments/{code}/matches/{match_id}/report",
    response_model=schemas.MatchResponse,
)
async def report_match_v2(
    code: str, match_id: int, update: schemas.MatchUpdate, db: Session = Depends(get_db)
):
    try:
        return await services.report_match_in_tournament(db, code, match_id, update)
    except services.TournamentNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Tournament not found") from exc
    except services.MatchNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Match not found") from exc


@router.post("/matches/{match_id}/report", response_model=schemas.MatchResponse)
async def report_match(
    match_id: int, update: schemas.MatchUpdate, db: Session = Depends(get_db)
):
    try:
        return await services.report_match_legacy(db, match_id, update)
    except services.MatchNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Match not found") from exc
