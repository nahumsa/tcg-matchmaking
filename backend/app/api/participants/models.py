from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class Participant(Base):
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id"), nullable=False)
    name = Column(String, index=True, nullable=False)
    points = Column(Integer, default=0)
    pokemon_1 = Column(String, nullable=True)
    pokemon_2 = Column(String, nullable=True)

    tournament = relationship("Tournament", back_populates="participants")
    matches_as_p1 = relationship(
        "Match", foreign_keys="Match.player1_id", back_populates="player1"
    )
    matches_as_p2 = relationship(
        "Match", foreign_keys="Match.player2_id", back_populates="player2"
    )
