from sqlalchemy.orm import Session
from fastapi import HTTPException
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
