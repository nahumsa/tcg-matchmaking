from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
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

    return await services.join_tournament(db, db_tournament.id, code, participant)
