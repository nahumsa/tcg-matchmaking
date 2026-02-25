from sqlalchemy.orm import Session
from fastapi import HTTPException
from typing import List
from . import models, schemas
from backend.app.core.manager import manager

async def join_tournament(db: Session, tournament_id: int, code: str, participant: schemas.ParticipantJoin) -> models.Participant:
    # Check if participant with the same name already exists in this tournament
    existing_participant = db.query(models.Participant).filter(
        models.Participant.tournament_id == tournament_id,
        models.Participant.name == participant.name
    ).first()
    
    if existing_participant:
        raise HTTPException(
            status_code=400, 
            detail="Participant with this name already exists in this tournament"
        )

    db_participant = models.Participant(
        name=participant.name,
        tournament_id=tournament_id
    )
    db.add(db_participant)
    db.commit()
    db.refresh(db_participant)

    # Broadcast update
    await manager.broadcast(
        code, {"event": "participant_joined", "data": {"name": db_participant.name}}
    )

    return db_participant

async def remove_participant(db: Session, tournament_id: int, code: str, participant_id: int):
    db_participant = db.query(models.Participant).filter(
        models.Participant.id == participant_id,
        models.Participant.tournament_id == tournament_id
    ).first()
    
    if not db_participant:
        raise HTTPException(status_code=404, detail="Participant not found")
    
    db.delete(db_participant)
    db.commit()

    # Broadcast update
    await manager.broadcast(
        code, {"event": "participant_removed", "data": {"id": participant_id}}
    )

def get_potential_pairings(db: Session, tournament_id: int, participant_id: int) -> List[models.Participant]:
    # Get all participants in the tournament
    all_participants = db.query(models.Participant).filter(
        models.Participant.tournament_id == tournament_id
    ).all()
    
    current_player = next((p for p in all_participants if p.id == participant_id), None)
    if not current_player:
        raise HTTPException(status_code=404, detail="Participant not found")
    
    # Get past matches of the current player
    from backend.app.api.matches.models import Match
    past_matches = db.query(Match).filter(
        ((Match.player1_id == participant_id) | (Match.player2_id == participant_id)),
        Match.tournament_id == tournament_id,
        Match.is_completed == 1
    ).all()
    
    played_opponent_ids = set()
    for m in past_matches:
        if m.player1_id == participant_id:
            if m.player2_id:
                played_opponent_ids.add(m.player2_id)
        else:
            played_opponent_ids.add(m.player1_id)
            
    # Potential opponents: not the same player, not played before, similar points
    potential = [
        p for p in all_participants 
        if p.id != participant_id 
        and p.id not in played_opponent_ids
        and abs(p.points - current_player.points) <= 3 # Allow small point difference
    ]
    
    return potential
