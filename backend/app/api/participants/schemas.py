from pydantic import BaseModel, ConfigDict


class ParticipantBase(BaseModel):
    name: str


class ParticipantJoin(ParticipantBase):
    pass


class ParticipantResponse(ParticipantBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tournament_id: int
    points: int
    rank: int = 0
    wins: int = 0
    losses: int = 0
    draws: int = 0
    omw_percentage: float = 0.0
