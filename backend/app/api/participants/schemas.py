from pydantic import BaseModel, ConfigDict, model_validator


class ParticipantBase(BaseModel):
    name: str


class ParticipantJoin(ParticipantBase):
    pokemon_1: str | None = None
    pokemon_2: str | None = None

    @model_validator(mode="after")
    def validate_unique_pokemon(self):
        if self.pokemon_1 and self.pokemon_1 == self.pokemon_2:
            raise ValueError("Please select up to two different Pokémon")
        return self


class ParticipantResponse(ParticipantBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tournament_id: int
    points: int
    is_active: bool
    dropped_round: int | None
    pokemon_1: str | None = None
    pokemon_2: str | None = None
    rank: int = 0
    wins: int = 0
    losses: int = 0
    draws: int = 0
    omw_percentage: float = 0.00


class ParticipantJoinResponse(ParticipantResponse):
    reconnect_code: str


class ParticipantReloginRequest(BaseModel):
    reconnect_code: str
