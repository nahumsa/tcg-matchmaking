from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from .core.database import Base
from .api.tournaments.models import Tournament
from .api.participants.models import Participant
from .api.matches.models import Match

# Update Tournament to include matches - already in api/tournaments/models.py
