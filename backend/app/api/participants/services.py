from sqlalchemy.orm import Session
from . import models, schemas
from backend.app.core.manager import manager

async def join_tournament(db: Session, tournament_id: int, code: str, participant: schemas.ParticipantJoin) -> models.Participant:
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
