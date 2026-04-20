from __future__ import annotations

from typing import List

from fastapi import HTTPException

from backend.app.api.participants.models import Participant
from backend.app.api.tournaments.models import Tournament
from backend.app.api.tournaments.use_cases import assert_tournament_can_accept_changes
from backend.app.application.ports import MatchRepositoryPort, ParticipantRepositoryPort


def join_tournament(
    participants: ParticipantRepositoryPort,
    matches: MatchRepositoryPort,
    tournament: Tournament,
    participant_name: str,
    pokemon_1: str | None = None,
    pokemon_2: str | None = None,
) -> Participant:
    assert_tournament_can_accept_changes(tournament)
    if participants.exists_with_name(tournament.id, participant_name):
        raise HTTPException(
            status_code=400,
            detail="Participant with this name already exists in this tournament",
        )

    dropped_participant = participants.get_by_name(tournament.id, participant_name)
    if dropped_participant and not dropped_participant.is_active:
        current_round = _get_current_round(matches, tournament.id)
        dropped_round = dropped_participant.dropped_round or 0
        if current_round <= dropped_round:
            raise HTTPException(
                status_code=400,
                detail="Dropped participants can only be reassigned in a later round",
            )
        dropped_participant.is_active = True
        dropped_participant.dropped_round = None
        dropped_participant.pokemon_1 = pokemon_1
        dropped_participant.pokemon_2 = pokemon_2
        participants.save(dropped_participant)
        return dropped_participant

    return participants.add(
        tournament.id,
        participant_name,
        pokemon_1=pokemon_1,
        pokemon_2=pokemon_2,
    )


def remove_participant(
    participants: ParticipantRepositoryPort,
    matches: MatchRepositoryPort,
    tournament: Tournament,
    participant_id: int,
) -> None:
    assert_tournament_can_accept_changes(tournament)
    participant = participants.get_by_id(participant_id)
    if not participant or participant.tournament_id != tournament.id:
        raise HTTPException(status_code=404, detail="Participant not found")
    if not participant.is_active:
        return

    current_round = _get_current_round(matches, tournament.id)
    if current_round == 0 or not _is_round_complete(
        matches, tournament.id, current_round
    ):
        raise HTTPException(
            status_code=400,
            detail="Participants can only be dropped after a round ends",
        )
    participant.dropped_round = current_round
    participants.delete(participant)


def _get_current_round(matches: MatchRepositoryPort, tournament_id: int) -> int:
    tournament_matches = matches.get_by_tournament(tournament_id)
    if not tournament_matches:
        return 0
    return max(m.round_number for m in tournament_matches)


def _is_round_complete(
    matches: MatchRepositoryPort, tournament_id: int, round_number: int
) -> bool:
    tournament_matches = matches.get_by_tournament(tournament_id)
    return all(
        match.is_completed
        for match in tournament_matches
        if match.round_number == round_number
    )


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
