from __future__ import annotations

from typing import List

from fastapi import HTTPException

from backend.app.api.participants.models import Participant
from backend.app.api.tournaments.models import Tournament
from backend.app.api.tournaments.use_cases import assert_tournament_can_accept_changes
from backend.app.application.ports import MatchRepositoryPort, ParticipantRepositoryPort


def join_tournament(
    participants: ParticipantRepositoryPort,
    tournament: Tournament,
    participant_name: str,
) -> Participant:
    assert_tournament_can_accept_changes(tournament)
    if participants.exists_with_name(tournament.id, participant_name):
        raise HTTPException(
            status_code=400,
            detail="Participant with this name already exists in this tournament",
        )
    return participants.add(tournament.id, participant_name)


def remove_participant(
    participants: ParticipantRepositoryPort,
    tournament: Tournament,
    participant_id: int,
) -> None:
    assert_tournament_can_accept_changes(tournament)
    participant = participants.get_by_id(participant_id)
    if not participant or participant.tournament_id != tournament.id:
        raise HTTPException(status_code=404, detail="Participant not found")
    participants.delete(participant)


def get_potential_pairings(
    participants: ParticipantRepositoryPort,
    matches: MatchRepositoryPort,
    tournament_id: int,
    participant_id: int,
) -> List[Participant]:
    all_participants = participants.get_by_tournament(tournament_id)
    current_player = next((p for p in all_participants if p.id == participant_id), None)
    if not current_player:
        raise HTTPException(status_code=404, detail="Participant not found")

    past_matches = [
        m
        for m in matches.get_by_tournament(tournament_id)
        if m.is_completed
        and (m.player1_id == participant_id or m.player2_id == participant_id)
    ]

    played_opponent_ids = set()
    for match in past_matches:
        if match.player1_id == participant_id and match.player2_id:
            played_opponent_ids.add(match.player2_id)
        elif match.player2_id == participant_id and match.player1_id:
            played_opponent_ids.add(match.player1_id)

    return [
        p
        for p in all_participants
        if p.id != participant_id
        and p.id not in played_opponent_ids
        and abs(p.points - current_player.points) <= 3
    ]
