from pydantic import BaseModel, ConfigDict
from typing import Optional

class TournamentBase(BaseModel):
    name: str
    rounds: Optional[int] = 3

class TournamentCreate(TournamentBase):
    pass

class TournamentResponse(TournamentBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    code: str
    status: str
