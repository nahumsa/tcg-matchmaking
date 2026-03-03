from pydantic import BaseModel, ConfigDict
from typing import Optional

class MatchBase(BaseModel):
    player1_score: int = 0
    player2_score: int = 0

class MatchUpdate(MatchBase):
    pass

class MatchResponse(MatchBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    tournament_id: int
    round_number: int
    player1_id: Optional[int]
    player2_id: Optional[int]
    is_bye: int
    is_completed: int
    table_number: Optional[int] = None
