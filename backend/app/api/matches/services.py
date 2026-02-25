from sqlalchemy.orm import Session
from typing import List
from . import models, schemas, pairing
from backend.app.core.manager import manager
from backend.app.api.tournaments.models import Tournament
from backend.app.api.participants.models import Participant


async def generate_pairings(db: Session, tournament: Tournament) -> List[models.Match]:
    # Get all participants
    participants = tournament.participants

    # Get past matches
    past_matches = (
        db.query(models.Match).filter(models.Match.tournament_id == tournament.id).all()
    )

    # Determine next round number
    if not past_matches:
        round_number = 1
    else:
        max_round = max(m.round_number for m in past_matches)
        round_number = max_round + 1

    # Generate pairings
    new_pairings = pairing.get_pairings(participants, past_matches)

    # Save new matches
    db_matches = []
    for p1, p2 in new_pairings:
        match = models.Match(
            tournament_id=tournament.id,
            round_number=round_number,
            player1_id=p1.id,
            player2_id=p2.id if p2 else None,
            is_bye=1 if p2 is None else 0,
            is_completed=1 if p2 is None else 0,
        )
        if p2 is None:
            p1.points += 3
        db.add(match)
        db_matches.append(match)

    db.commit()

    # Broadcast update
    await manager.broadcast(
        tournament.code, {"event": "pairings_generated", "round": round_number}
    )

    for m in db_matches:
        db.refresh(m)
    return db_matches


async def report_match(
    db: Session, match_id: int, update: schemas.MatchUpdate
) -> models.Match:
    db_match = db.query(models.Match).filter(models.Match.id == match_id).first()
    if not db_match:
        return None

    # Update scores
    db_match.player1_score = update.player1_score
    db_match.player2_score = update.player2_score
    db_match.is_completed = 1

    # Update points
    p1 = db.query(Participant).filter(Participant.id == db_match.player1_id).first()
    p2 = db.query(Participant).filter(Participant.id == db_match.player2_id).first()

    if update.player1_score > update.player2_score:
        p1.points += 3
    elif update.player2_score > update.player1_score:
        p2.points += 3
    else:
        p1.points += 1
        p2.points += 1

    db.commit()

    # Find tournament code for broadcasting
    tournament = (
        db.query(Tournament).filter(Tournament.id == db_match.tournament_id).first()
    )

    # Check if tournament should be completed
    if db_match.round_number == tournament.rounds:
        # Check if all matches in this round are completed
        all_round_matches = (
            db.query(models.Match)
            .filter(
                models.Match.tournament_id == tournament.id,
                models.Match.round_number == db_match.round_number,
            )
            .all()
        )
        if all(m.is_completed for m in all_round_matches):
            tournament.status = "COMPLETED"
            db.commit()

    await manager.broadcast(
        tournament.code, {"event": "match_reported", "match_id": match_id}
    )

    db.refresh(db_match)
    return db_match


def get_tournament_matches(db: Session, tournament_id: int) -> List[models.Match]:
    return db.query(models.Match).filter(models.Match.tournament_id == tournament_id)
