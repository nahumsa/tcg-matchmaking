from __future__ import annotations

from typing import List

from fastapi import HTTPException

from backend.app.api.matches import pairing
from backend.app.api.matches.models import Match
from backend.app.api.matches.schemas import MatchUpdate
from backend.app.api.tournaments.models import Tournament
from backend.app.api.tournaments.use_cases import assert_tournament_can_accept_changes
from backend.app.application.ports import (
    MatchRepositoryPort,
    ParticipantRepositoryPort,
    TournamentRepositoryPort,
)


def assert_can_generate_pairings(
    tournament: Tournament, tournament_matches: List[Match]
) -> int:
    assert_tournament_can_accept_changes(tournament)
    if not tournament.participants:
        raise HTTPException(status_code=400, detail="No participants in tournament")

    if not tournament_matches:
        return 1

    max_round = max(m.round_number for m in tournament_matches)
    incomplete = [
        m
        for m in tournament_matches
        if m.round_number == max_round and not m.is_completed and not m.is_bye
    ]
    if incomplete:
        raise HTTPException(
            status_code=400, detail="Complete all current round matches first"
        )

    if max_round >= tournament.rounds:
        raise HTTPException(status_code=400, detail="Tournament already completed")

    return max_round + 1


def generate_pairings(
    matches: MatchRepositoryPort,
    participants: ParticipantRepositoryPort,
    tournament: Tournament,
) -> List[Match]:
    all_matches = matches.get_by_tournament(tournament.id)
    active_participants = participants.get_by_tournament(tournament.id)
    if not active_participants:
        active_participants = [
            participant
            for participant in tournament.participants
            if getattr(participant, "is_active", True) is not False
        ]
    if not active_participants:
        raise HTTPException(status_code=400, detail="No participants in tournament")
    round_number = assert_can_generate_pairings(tournament, all_matches)

    new_pairings = pairing.get_pairings(active_participants, all_matches)

    def combined_points(pairing_item):
        p1, p2 = pairing_item
        return p1.points + (p2.points if p2 else 0)

    sorted_pairings = sorted(new_pairings, key=combined_points, reverse=True)

    new_matches = []
    for table_number, (p1, p2) in enumerate(sorted_pairings, 1):
        is_bye = 1 if p2 is None else 0
        match = Match(
            tournament_id=tournament.id,
            round_number=round_number,
            player1_id=p1.id,
            player2_id=p2.id if p2 else None,
            is_bye=is_bye,
            is_completed=is_bye,
            table_number=table_number,
        )
        if p2 is None:
            p1.points += 3
            participants.save(p1)
        new_matches.append(match)

    return matches.add_many(new_matches)


def report_match(
    matches: MatchRepositoryPort,
    participants: ParticipantRepositoryPort,
    tournaments: TournamentRepositoryPort,
    match_id: int,
    update: MatchUpdate,
) -> Match:
    match = matches.get_by_id(match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    tournament = tournaments.get_by_id(match.tournament_id)
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    assert_tournament_can_accept_changes(tournament)

    match.player1_score = update.player1_score
    match.player2_score = update.player2_score
    match.is_completed = 1

    player1 = participants.get_by_id(match.player1_id)
    player2 = participants.get_by_id(match.player2_id) if match.player2_id else None

    if not player1:
        raise HTTPException(status_code=404, detail="Player 1 not found")

    if update.player1_score > update.player2_score:
        player1.points += 3
    elif player2 and update.player2_score > update.player1_score:
        player2.points += 3
    elif player2:
        player1.points += 1
        player2.points += 1

    participants.save(player1)
    if player2:
        participants.save(player2)
    matches.save(match)

    round_matches = [
        m
        for m in matches.get_by_tournament(tournament.id)
        if m.round_number == match.round_number
    ]
    if match.round_number == tournament.rounds and all(
        m.is_completed for m in round_matches
    ):
        tournament.status = "COMPLETED"
        tournaments.save(tournament)

    return match
