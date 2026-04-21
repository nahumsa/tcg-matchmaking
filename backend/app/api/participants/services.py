from datetime import datetime, timezone
from typing import List

from sqlalchemy.orm import Session

from backend.app.adapters.sqlalchemy_repositories import (
    SqlAlchemyParticipantRepository,
    SqlAlchemyMatchRepository,
)
from backend.app.core.manager import manager

from backend.app.api.tournaments.models import Tournament
from . import models, schemas, use_cases


async def join_tournament(
    db: Session, tournament: Tournament, code: str, participant: schemas.ParticipantJoin
) -> models.Participant:
    participant_repo = SqlAlchemyParticipantRepository(db)
    match_repo = SqlAlchemyMatchRepository(db)
    db_participant = use_cases.join_tournament(
        participants=participant_repo,
        matches=match_repo,
        tournament=tournament,
        participant_name=participant.name,
        pokemon_1=participant.pokemon_1,
        pokemon_2=participant.pokemon_2,
    )

    await manager.broadcast(
        code,
        {
            "event": "participant_joined",
            "data": {
                "name": db_participant.name,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        },
    )
    return db_participant


async def remove_participant(
    db: Session, tournament: Tournament, code: str, participant_id: int
):
    participant_repo = SqlAlchemyParticipantRepository(db)
    match_repo = SqlAlchemyMatchRepository(db)
    use_cases.remove_participant(
        participants=participant_repo,
        matches=match_repo,
        tournament=tournament,
        participant_id=participant_id,
    )

    await manager.broadcast(
        code, {"event": "participant_removed", "data": {"id": participant_id}}
    )


async def undrop_participant(
    db: Session, tournament: Tournament, code: str, participant_id: int
) -> models.Participant:
    participant_repo = SqlAlchemyParticipantRepository(db)
    match_repo = SqlAlchemyMatchRepository(db)
    participant = use_cases.undrop_participant(
        participants=participant_repo,
        matches=match_repo,
        tournament=tournament,
        participant_id=participant_id,
    )
    await manager.broadcast(
        code,
        {
            "event": "participant_undropped",
            "data": {
                "id": participant.id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        },
    )
    return participant


def get_participants(
    db: Session, tournament_id: int, include_dropped: bool = False
) -> List[models.Participant]:
    participant_repo = SqlAlchemyParticipantRepository(db)
    return participant_repo.get_by_tournament(
        tournament_id, include_inactive=include_dropped
    )


def get_potential_pairings(
    db: Session, tournament_id: int, participant_id: int
) -> List[models.Participant]:
    participant_repo = SqlAlchemyParticipantRepository(db)
    match_repo = SqlAlchemyMatchRepository(db)
    return use_cases.get_potential_pairings(
        participants=participant_repo,
        matches=match_repo,
        tournament_id=tournament_id,
        participant_id=participant_id,
    )
