from typing import Literal

from pydantic import BaseModel, ConfigDict, model_validator


PokemonName = Literal[
    "Bulbasaur",
    "Charmander",
    "Squirtle",
    "Pikachu",
    "Eevee",
    "Snorlax",
    "Mewtwo",
    "Gengar",
    "Dragonite",
    "Lucario",
]


class ParticipantBase(BaseModel):
    name: str


class ParticipantJoin(ParticipantBase):
    pokemon_1: PokemonName | None = None
    pokemon_2: PokemonName | None = None

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
    pokemon_1: PokemonName | None = None
    pokemon_2: PokemonName | None = None
    rank: int = 0
    wins: int = 0
    losses: int = 0
    draws: int = 0
    omw_percentage: float = 0.0
