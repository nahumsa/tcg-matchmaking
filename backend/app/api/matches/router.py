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

    if not db_tournament.participants:
        raise HTTPException(status_code=400, detail="No participants in tournament")

    if db_tournament.status == "COMPLETED":
        raise HTTPException(status_code=400, detail="Tournament is already completed")

    # Check for incomplete matches in current round
    past_matches = services.get_tournament_matches(db, db_tournament.id).all()
    if past_matches:
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

        if max_round >= db_tournament.rounds:
            raise HTTPException(status_code=400, detail="Tournament already completed")

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
    # Check if tournament exists
    db_tournament = get_tournament_by_code(db, code)
    if not db_tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")

    if db_tournament.status == "COMPLETED":
        raise HTTPException(status_code=400, detail="Tournament is already completed")

    # Check if match exists and belongs to this tournament
    from .models import Match

    db_match = (
        db.query(Match)
        .filter(Match.id == match_id, Match.tournament_id == db_tournament.id)
        .first()
    )
    if not db_match:
        raise HTTPException(
            status_code=404, detail="Match not found in this tournament"
        )

    # Permission check
    if not update.is_admin:
        if update.reported_by_id is None or update.reported_by_id not in [
            db_match.player1_id,
            db_match.player2_id,
        ]:
            raise HTTPException(
                status_code=403, detail="Not authorized to report this match"
            )

    db_match = await services.report_match(db, match_id, update)
    return db_match


@router.post("/matches/{match_id}/report", response_model=schemas.MatchResponse)
async def report_match(
    match_id: int, update: schemas.MatchUpdate, db: Session = Depends(get_db)
):
    # Check if match exists
    from .models import Match
    from backend.app.api.tournaments.models import Tournament

    db_match = db.query(Match).filter(Match.id == match_id).first()
    if not db_match:
        raise HTTPException(status_code=404, detail="Match not found")

    db_tournament = (
        db.query(Tournament).filter(Tournament.id == db_match.tournament_id).first()
    )
    if db_tournament.status == "COMPLETED":
        raise HTTPException(status_code=400, detail="Tournament is already completed")

    # This old endpoint assumes admin privileges or bypasses participant checks
    # For compatibility, we'll set is_admin=True in the service call if not specified
    if not update.is_admin and update.reported_by_id is None:
        update.is_admin = True

    db_match = await services.report_match(db, match_id, update)
    return db_match
