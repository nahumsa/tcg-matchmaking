from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional, Protocol

from backend.app.api.matches.models import Match
from backend.app.api.participants.models import Participant
from backend.app.api.tournaments.models import Tournament


@dataclass
class PairingCandidate:
    player1: Participant
    player2: Optional[Participant]


class TournamentRepositoryPort(Protocol):
    def is_code_available(self, code: str) -> bool: ...

    def add_tournament(self, name: str, code: str, rounds: int) -> Tournament: ...

    def get_by_code(self, code: str) -> Optional[Tournament]: ...

    def get_by_id(self, tournament_id: int) -> Optional[Tournament]: ...

    def save(self, tournament: Tournament) -> None: ...


class ParticipantRepositoryPort(Protocol):
    def get_by_tournament(self, tournament_id: int) -> List[Participant]: ...

    def get_by_id(self, participant_id: int) -> Optional[Participant]: ...

    def get_by_name(self, tournament_id: int, name: str) -> Optional[Participant]: ...

    def exists_with_name(self, tournament_id: int, name: str) -> bool: ...

    def add(
        self,
        tournament_id: int,
        name: str,
        pokemon_1: str | None = None,
        pokemon_2: str | None = None,
    ) -> Participant: ...

    def delete(self, participant: Participant) -> None: ...

    def save(self, participant: Participant) -> None: ...


class MatchRepositoryPort(Protocol):
    def get_by_tournament(self, tournament_id: int) -> List[Match]: ...

    def get_by_id(self, match_id: int) -> Optional[Match]: ...

    def add_many(self, matches: List[Match]) -> List[Match]: ...

    def save(self, match: Match) -> None: ...
