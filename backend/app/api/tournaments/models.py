from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class Tournament(Base):
    __tablename__ = "tournaments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    code = Column(String, unique=True, index=True, nullable=False)
    rounds = Column(Integer, default=3)
    status = Column(String, default="ACTIVE", nullable=False)

    # Use strings for relationships to avoid circular imports during domain migration
    participants = relationship("Participant", back_populates="tournament")
    matches = relationship("Match", back_populates="tournament")
