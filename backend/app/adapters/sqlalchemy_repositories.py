from __future__ import annotations

from typing import List, Optional

from sqlalchemy.orm import Session

from backend.app.api.matches.models import Match
from backend.app.api.participants.models import Participant
from backend.app.api.tournaments.models import Tournament


class SqlAlchemyTournamentRepository:
    def __init__(self, db: Session):
        self.db = db

    def is_code_available(self, code: str) -> bool:
        return self.db.query(Tournament).filter(Tournament.code == code).first() is None

    def add_tournament(self, name: str, code: str, rounds: int) -> Tournament:
        tournament = Tournament(name=name, code=code, rounds=rounds)
        self.db.add(tournament)
        self.db.commit()
        self.db.refresh(tournament)
        return tournament

    def get_by_code(self, code: str) -> Optional[Tournament]:
        return self.db.query(Tournament).filter(Tournament.code == code).first()

    def get_by_id(self, tournament_id: int) -> Optional[Tournament]:
        return self.db.query(Tournament).filter(Tournament.id == tournament_id).first()

    def save(self, tournament: Tournament) -> None:
        self.db.add(tournament)
        self.db.commit()
        self.db.refresh(tournament)


class SqlAlchemyParticipantRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_tournament(self, tournament_id: int) -> List[Participant]:
        return (
            self.db.query(Participant)
            .filter(
                Participant.tournament_id == tournament_id,
                Participant.is_active.is_(True),
            )
            .all()
        )

    def get_by_id(self, participant_id: int) -> Optional[Participant]:
        return (
            self.db.query(Participant).filter(Participant.id == participant_id).first()
        )

    def get_by_name(self, tournament_id: int, name: str) -> Optional[Participant]:
        return (
            self.db.query(Participant)
            .filter(
                Participant.tournament_id == tournament_id, Participant.name == name
            )
            .first()
        )

    def exists_with_name(self, tournament_id: int, name: str) -> bool:
        return (
            self.db.query(Participant)
            .filter(
                Participant.tournament_id == tournament_id,
                Participant.name == name,
                Participant.is_active.is_(True),
            )
            .first()
            is not None
        )

    def add(
        self,
        tournament_id: int,
        name: str,
        pokemon_1: str | None = None,
        pokemon_2: str | None = None,
    ) -> Participant:
        participant = Participant(
            name=name,
            tournament_id=tournament_id,
            pokemon_1=pokemon_1,
            pokemon_2=pokemon_2,
        )
        self.db.add(participant)
        self.db.commit()
        self.db.refresh(participant)
        return participant

    def delete(self, participant: Participant) -> None:
        participant.is_active = False
        self.db.commit()

    def save(self, participant: Participant) -> None:
        self.db.add(participant)
        self.db.commit()
        self.db.refresh(participant)


class SqlAlchemyMatchRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_tournament(self, tournament_id: int) -> List[Match]:
        return self.db.query(Match).filter(Match.tournament_id == tournament_id).all()

    def get_by_id(self, match_id: int) -> Optional[Match]:
        return self.db.query(Match).filter(Match.id == match_id).first()

    def add_many(self, matches: List[Match]) -> List[Match]:
        for match in matches:
            self.db.add(match)
        self.db.commit()
        for match in matches:
            self.db.refresh(match)
        return matches

    def save(self, match: Match) -> None:
        self.db.add(match)
        self.db.commit()
        self.db.refresh(match)
