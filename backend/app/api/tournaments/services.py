from sqlalchemy.orm import Session

from backend.app.adapters.sqlalchemy_repositories import SqlAlchemyTournamentRepository
from backend.app.application import use_cases

from . import schemas


def generate_room_code(db: Session, length: int = 6) -> str:
    """Compatibility wrapper used by tests and legacy callers."""
    tournaments = SqlAlchemyTournamentRepository(db)
    return use_cases._generate_room_code(tournaments=tournaments, length=length)


def create_tournament(db: Session, tournament: schemas.TournamentCreate):
    tournaments = SqlAlchemyTournamentRepository(db)
    return use_cases.create_tournament(
        tournaments=tournaments,
        name=tournament.name,
        rounds=tournament.rounds,
    )


def get_tournament_by_code(db: Session, code: str):
    tournaments = SqlAlchemyTournamentRepository(db)
    return tournaments.get_by_code(code)
