from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from .core.database import Base
from .api.tournaments.models import Tournament
from .api.participants.models import Participant

class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id"), nullable=False)
    round_number = Column(Integer, nullable=False)
    player1_id = Column(Integer, ForeignKey("participants.id"), nullable=True)
    player2_id = Column(Integer, ForeignKey("participants.id"), nullable=True)
    player1_score = Column(Integer, default=0)
    player2_score = Column(Integer, default=0)
    is_bye = Column(Integer, default=0)
    is_completed = Column(Integer, default=0)

    tournament = relationship("Tournament", back_populates="matches")
    player1 = relationship("Participant", foreign_keys=[player1_id], back_populates="matches_as_p1")
    player2 = relationship("Participant", foreign_keys=[player2_id], back_populates="matches_as_p2")

# Update Tournament to include matches - already in api/tournaments/models.py
