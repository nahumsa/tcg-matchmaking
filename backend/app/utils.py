import random
import string
from sqlalchemy.orm import Session
from . import models


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
