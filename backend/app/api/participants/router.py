from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from typing import List
from . import schemas, services
from backend.app.api.tournaments.services import get_tournament_by_code
from backend.app.core.config import settings
from backend.app.core.rate_limiter import InMemoryRateLimiter, SlidingWindowLimit

router = APIRouter(prefix="/tournaments", tags=["participants"])
relogin_rate_limiter = InMemoryRateLimiter(
    SlidingWindowLimit(
        max_attempts=1,
        window_seconds=settings.RELOGIN_RATE_LIMIT_WINDOW_SECONDS,
    )
)


def _join_response(
    participant: schemas.ParticipantResponse, reconnect_code: str
) -> schemas.ParticipantJoinResponse:
    return schemas.ParticipantJoinResponse.model_validate(
        {**participant.model_dump(), "reconnect_code": reconnect_code}
    )


def _relogin_limiter_key(code: str) -> str:
    return code.upper()


@router.post("/{code}/join", response_model=schemas.ParticipantJoinResponse)
async def join_tournament(
    code: str, participant: schemas.ParticipantJoin, db: Session = Depends(get_db)
):
    # Find tournament by code
    db_tournament = get_tournament_by_code(db, code)
    if not db_tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")

    if db_tournament.status == "COMPLETED":
        raise HTTPException(status_code=400, detail="Tournament is already completed")

    db_participant, reconnect_code = await services.join_tournament(
        db, db_tournament, code, participant
    )
    participant_response = schemas.ParticipantResponse.model_validate(db_participant)
    return _join_response(participant_response, reconnect_code)


@router.post(
    "/{code}/participants",
    response_model=schemas.ParticipantResponse,
    status_code=201,
)
async def admin_add_participant(
    code: str, participant: schemas.ParticipantJoin, db: Session = Depends(get_db)
):
    db_tournament = get_tournament_by_code(db, code)
    if not db_tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")

    if db_tournament.status == "COMPLETED":
        raise HTTPException(status_code=400, detail="Tournament is already completed")

    db_participant, _ = await services.join_tournament(
        db, db_tournament, code, participant
    )
    return db_participant


@router.get("/{code}/participants", response_model=List[schemas.ParticipantResponse])
async def list_participants(
    code: str,
    include_dropped: bool = False,
    db: Session = Depends(get_db),
):
    db_tournament = get_tournament_by_code(db, code)
    if not db_tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")

    return services.get_participants(
        db, db_tournament.id, include_dropped=include_dropped
    )


@router.post(
    "/{code}/participants/relogin",
    response_model=schemas.ParticipantResponse,
)
def relogin_participant(
    code: str,
    payload: schemas.ParticipantReloginRequest,
    db: Session = Depends(get_db),
):
    db_tournament = get_tournament_by_code(db, code)
    if not db_tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")

    tournament_participants = services.get_participants(db, db_tournament.id)
    relogin_attempt_limit = max(1, len(tournament_participants) * 2)
    limiter_key = _relogin_limiter_key(code)
    if relogin_rate_limiter.is_limited(limiter_key, relogin_attempt_limit):
        raise HTTPException(
            status_code=429, detail="Too many relogin attempts. Please try again later."
        )

    try:
        participant = services.relogin_with_reconnect_code(
            db=db,
            tournament=db_tournament,
            reconnect_code=payload.reconnect_code,
        )
    except HTTPException as exc:
        if exc.status_code == 401:
            relogin_rate_limiter.register_failure(limiter_key)
        raise

    return participant


@router.delete("/{code}/participants/{participant_id}", status_code=204)
async def admin_remove_participant(
    code: str, participant_id: int, db: Session = Depends(get_db)
):
    db_tournament = get_tournament_by_code(db, code)
    if not db_tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")

    await services.remove_participant(db, db_tournament, code, participant_id)
    return None


@router.post(
    "/{code}/participants/{participant_id}/undrop",
    response_model=schemas.ParticipantResponse,
)
async def admin_undrop_participant(
    code: str, participant_id: int, db: Session = Depends(get_db)
):
    db_tournament = get_tournament_by_code(db, code)
    if not db_tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")

    return await services.undrop_participant(db, db_tournament, code, participant_id)


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
