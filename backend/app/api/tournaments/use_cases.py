from __future__ import annotations

import random
import string

from fastapi import HTTPException

from backend.app.api.tournaments.models import Tournament
from backend.app.application.ports import TournamentRepositoryPort


def create_tournament(
    tournaments: TournamentRepositoryPort, name: str, rounds: int, code_length: int = 6
) -> Tournament:
    code = _generate_room_code(tournaments, code_length)
    return tournaments.add_tournament(name=name, code=code, rounds=rounds)


def _generate_room_code(tournaments: TournamentRepositoryPort, length: int = 6) -> str:
    while True:
        code = "".join(random.choices(string.ascii_uppercase, k=length))
        if tournaments.is_code_available(code):
            return code


def assert_tournament_can_accept_changes(tournament: Tournament) -> None:
    if tournament.status == "COMPLETED":
        raise HTTPException(status_code=400, detail="Tournament is already completed")
