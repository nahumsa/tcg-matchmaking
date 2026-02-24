from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base


class Tournament(Base):
    __tablename__ = "tournaments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    code = Column(String, unique=True, index=True, nullable=False)
    rounds = Column(Integer, default=3)

    participants = relationship("Participant", back_populates="tournament")


class Participant(Base):
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id"), nullable=False)
    name = Column(String, index=True, nullable=False)
    points = Column(Integer, default=0)

    tournament = relationship("Tournament", back_populates="participants")
    matches_as_p1 = relationship("Match", foreign_keys="Match.player1_id", back_populates="player1")
    matches_as_p2 = relationship("Match", foreign_keys="Match.player2_id", back_populates="player2")

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

# Update Tournament to include matches
Tournament.matches = relationship("Match", back_populates="tournament")
