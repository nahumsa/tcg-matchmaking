from __future__ import annotations

import secrets
from typing import List, Tuple

from fastapi import HTTPException

from backend.app.api.participants.models import Participant
from backend.app.api.tournaments.models import Tournament
from backend.app.api.tournaments.use_cases import assert_tournament_can_accept_changes
from backend.app.application.ports import MatchRepositoryPort, ParticipantRepositoryPort
from backend.app.core.config import settings
from backend.app.core.security import hash_reconnect_code


def join_tournament(
    participants: ParticipantRepositoryPort,
    matches: MatchRepositoryPort,
    tournament: Tournament,
    participant_name: str,
    pokemon_1: str | None = None,
    pokemon_2: str | None = None,
) -> Tuple[Participant, str]:
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
        reconnect_code = _generate_reconnect_code(participants)
        dropped_participant.reconnect_code_hash = _reconnect_code_hash(reconnect_code)
        dropped_participant.reconnect_required = False
        participants.save(dropped_participant)
        return dropped_participant, reconnect_code

    reconnect_code = _generate_reconnect_code(participants)
    reconnect_code_hash = _reconnect_code_hash(reconnect_code)
    participant = participants.add(
        tournament.id,
        participant_name,
        reconnect_code_hash,
        pokemon_1=pokemon_1,
        pokemon_2=pokemon_2,
    )
    return participant, reconnect_code


def _generate_reconnect_code(participants: ParticipantRepositoryPort) -> str:
    while True:
        reconnect_code = secrets.token_urlsafe(24)
        reconnect_code_hash = _reconnect_code_hash(reconnect_code)
        if not participants.get_by_reconnect_code_hash(reconnect_code_hash):
            return reconnect_code


def _reconnect_code_hash(reconnect_code: str) -> str:
    return hash_reconnect_code(reconnect_code, settings.RECONNECT_CODE_PEPPER)


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


def undrop_participant(
    participants: ParticipantRepositoryPort,
    matches: MatchRepositoryPort,
    tournament: Tournament,
    participant_id: int,
) -> Participant:
    assert_tournament_can_accept_changes(tournament)
    participant = participants.get_by_id(participant_id)
    if not participant or participant.tournament_id != tournament.id:
        raise HTTPException(status_code=404, detail="Participant not found")
    if participant.is_active:
        raise HTTPException(status_code=400, detail="Participant is already active")

    current_round = _get_current_round(matches, tournament.id)
    dropped_round = participant.dropped_round
    if dropped_round is None or current_round != dropped_round:
        raise HTTPException(
            status_code=400,
            detail="Participants can only be undropped in the round they were dropped",
        )

    participant.is_active = True
    participant.dropped_round = None
    participants.save(participant)
    return participant


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


def relogin_with_reconnect_code(
    participants: ParticipantRepositoryPort,
    tournament: Tournament,
    reconnect_code: str,
) -> Participant:
    reconnect_code_hash = _reconnect_code_hash(reconnect_code)
    participant = participants.get_by_reconnect_code_hash(reconnect_code_hash)
    if (
        not participant
        or participant.tournament_id != tournament.id
        or not participant.is_active
        or participant.reconnect_required
    ):
        raise HTTPException(status_code=401, detail="Invalid reconnect credentials")
    return participant
