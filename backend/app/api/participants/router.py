from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from typing import List
from . import schemas, services
from backend.app.api.tournaments.services import get_tournament_by_code

router = APIRouter(prefix="/tournaments", tags=["participants"])


@router.post("/{code}/join", response_model=schemas.ParticipantResponse)
async def join_tournament(
    code: str, participant: schemas.ParticipantJoin, db: Session = Depends(get_db)
):
    # Find tournament by code
    db_tournament = get_tournament_by_code(db, code)
    if not db_tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")

    if db_tournament.status == "COMPLETED":
        raise HTTPException(status_code=400, detail="Tournament is already completed")

    return await services.join_tournament(db, db_tournament.id, code, participant)


@router.post(
    "/{code}/participants", response_model=schemas.ParticipantResponse, status_code=201
)
async def admin_add_participant(
    code: str, participant: schemas.ParticipantJoin, db: Session = Depends(get_db)
):
    db_tournament = get_tournament_by_code(db, code)
    if not db_tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")

    if db_tournament.status == "COMPLETED":
        raise HTTPException(status_code=400, detail="Tournament is already completed")

    return await services.join_tournament(db, db_tournament.id, code, participant)


@router.get("/{code}/participants", response_model=List[schemas.ParticipantResponse])
async def list_participants(code: str, db: Session = Depends(get_db)):
    db_tournament = get_tournament_by_code(db, code)
    if not db_tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")

    return services.get_participants(db, db_tournament.id)


@router.delete("/{code}/participants/{participant_id}", status_code=204)
async def admin_remove_participant(
    code: str, participant_id: int, db: Session = Depends(get_db)
):
    db_tournament = get_tournament_by_code(db, code)
    if not db_tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")

    await services.remove_participant(db, db_tournament.id, code, participant_id)
    return None


@router.get(
    "/{code}/participants/{participant_id}/potential-pairings",
    response_model=List[schemas.ParticipantResponse],
)
async def get_potential_pairings(
    code: str, participant_id: int, db: Session = Depends(get_db)
):
    db_tournament = get_tournament_by_code(db, code)
    if not db_tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")

    return services.get_potential_pairings(db, db_tournament.id, participant_id)
