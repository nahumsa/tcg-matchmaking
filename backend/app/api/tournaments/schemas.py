from pydantic import BaseModel, ConfigDict


class TournamentCreate(BaseModel):
    name: str


class TournamentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    rounds: int
    code: str
    status: str
