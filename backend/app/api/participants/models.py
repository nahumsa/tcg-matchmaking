from sqlalchemy import Boolean, Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class Participant(Base):
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id"), nullable=False)
    name = Column(String, index=True, nullable=False)
    reconnect_code_hash = Column(String, unique=True, index=True, nullable=True)
    reconnect_required = Column(Boolean, default=False, nullable=False)
    points = Column(Integer, default=0)
    is_active = Column(Boolean, default=True, nullable=False)
    dropped_round = Column(Integer, nullable=True)
    pokemon_1 = Column(String, nullable=True)
    pokemon_2 = Column(String, nullable=True)

    tournament = relationship("Tournament", back_populates="participants")
    matches_as_p1 = relationship(
        "Match", foreign_keys="Match.player1_id", back_populates="player1"
    )
    matches_as_p2 = relationship(
        "Match", foreign_keys="Match.player2_id", back_populates="player2"
    )
