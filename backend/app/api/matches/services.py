from typing import List

from sqlalchemy.orm import Session

from backend.app.adapters.sqlalchemy_repositories import (
    SqlAlchemyMatchRepository,
    SqlAlchemyParticipantRepository,
    SqlAlchemyTournamentRepository,
)
from backend.app.core.manager import manager
from backend.app.api.tournaments.models import Tournament

from . import models, schemas, use_cases


async def generate_pairings(db: Session, tournament: Tournament) -> List[models.Match]:
    match_repo = SqlAlchemyMatchRepository(db)
    participant_repo = SqlAlchemyParticipantRepository(db)

    db_matches = use_cases.generate_pairings(
        matches=match_repo,
        participants=participant_repo,
        tournament=tournament,
    )

    round_number = db_matches[0].round_number if db_matches else 1
    await manager.broadcast(
        tournament.code, {"event": "pairings_generated", "round": round_number}
    )

    return db_matches


async def report_match(
    db: Session, match_id: int, update: schemas.MatchUpdate
) -> models.Match:
    match_repo = SqlAlchemyMatchRepository(db)
    participant_repo = SqlAlchemyParticipantRepository(db)
    tournament_repo = SqlAlchemyTournamentRepository(db)
    db_match = use_cases.report_match(
        matches=match_repo,
        participants=participant_repo,
        tournaments=tournament_repo,
        match_id=match_id,
        update=update,
    )

    tournament = tournament_repo.get_by_id(db_match.tournament_id)
    await manager.broadcast(
        tournament.code,
        {
            "event": "match_reported",
            "match_id": match_id,
            "round": db_match.round_number,
            "player1_score": db_match.player1_score,
            "player2_score": db_match.player2_score,
            "is_completed": db_match.is_completed,
            "tournament_status": tournament.status,
        },
    )

    return db_match


def get_tournament_matches(db: Session, tournament_id: int) -> List[models.Match]:
    match_repo = SqlAlchemyMatchRepository(db)
    return match_repo.get_by_tournament(tournament_id)
