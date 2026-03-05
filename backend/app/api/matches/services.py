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

    # Sort pairings by combined points descending
    # (p1, p2) where p2 can be None for BYE
    def get_combined_points(pair):
        p1, p2 = pair
        points = p1.points
        if p2:
            points += p2.points
        return points

    sorted_pairings = sorted(new_pairings, key=get_combined_points, reverse=True)

    # Save new matches
    db_matches = []
    for i, (p1, p2) in enumerate(sorted_pairings, 1):
        match = models.Match(
            tournament_id=tournament.id,
            round_number=round_number,
            player1_id=p1.id,
            player2_id=p2.id if p2 else None,
            is_bye=1 if p2 is None else 0,
            is_completed=1 if p2 is None else 0,
            table_number=i,
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

    db.commit()

    # Recalculate all participant points for this tournament to handle edits
    tournament = (
        db.query(Tournament).filter(Tournament.id == db_match.tournament_id).first()
    )
    
    # Reset all points
    db.query(Participant).filter(Participant.tournament_id == tournament.id).update({Participant.points: 0})
    db.commit()
    
    # Re-fetch participants and matches
    participants = (
        db.query(Participant).filter(Participant.tournament_id == tournament.id).all()
    )
    matches = (
        db.query(models.Match)
        .filter(models.Match.tournament_id == tournament.id, models.Match.is_completed == 1)
        .all()
    )
        
    # Recalculate from all matches
    for m in matches:
        if m.is_bye:
            p1 = next((p for p in participants if p.id == m.player1_id), None)
            if p1:
                p1.points += 3
            continue
            
        p1 = next((p for p in participants if p.id == m.player1_id), None)
        p2 = next((p for p in participants if p.id == m.player2_id), None)
        
        if not p1 or not p2:
            continue
            
        if m.player1_score > m.player2_score:
            p1.points += 3
        elif m.player2_score > m.player1_score:
            p2.points += 3
        else:
            p1.points += 1
            p2.points += 1
            
    db.commit()

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
        tournament.code,
        {
            "event": "match_reported",
            "match_id": match_id,
            "round": db_match.round_number,
            "player1_score": db_match.player1_score,
            "player2_score": db_match.player2_score,
            "is_completed": db_match.is_completed,
            "tournament_status": tournament.status
        }
    )

    db.refresh(db_match)
    return db_match


def get_tournament_matches(db: Session, tournament_id: int) -> List[models.Match]:
    return db.query(models.Match).filter(models.Match.tournament_id == tournament_id)
