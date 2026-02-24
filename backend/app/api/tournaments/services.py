import random
import string
from sqlalchemy.orm import Session
from . import models, schemas


def generate_room_code(db: Session, length: int = 6) -> str:
    """Generate a unique random room code of uppercase letters."""
    while True:
        code = "".join(random.choices(string.ascii_uppercase, k=length))
        # Check if the code already exists in the database
        db_tournament = (
            db.query(models.Tournament).filter(models.Tournament.code == code).first()
        )
        if not db_tournament:
            return code


def create_tournament(
    db: Session, tournament: schemas.TournamentCreate
) -> models.Tournament:
    code = generate_room_code(db)
    db_tournament = models.Tournament(
        name=tournament.name, code=code, rounds=tournament.rounds
    )
    db.add(db_tournament)
    db.commit()
    db.refresh(db_tournament)
    return db_tournament


def get_tournament_by_code(db: Session, code: str) -> models.Tournament:
    return db.query(models.Tournament).filter(models.Tournament.code == code).first()
