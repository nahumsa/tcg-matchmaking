import { useEffect, useState } from 'react';

export interface Pokemon {
  name: string;
  url: string;
  id: number;
  sprite: string;
  displayName: string;
}

const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2/pokemon';
const BASE_POKEMON_LIMIT = 1025;
const MAX_POKEMON_LIMIT = 2000;

const titleCase = (value: string) =>
  value
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const formatPokemonName = (name: string) => {
  if (name.includes('-mega')) {
    const parts = name.split('-');
    const megaIndex = parts.indexOf('mega');
    const base = parts.slice(0, megaIndex).join(' ');
    const suffix = parts.slice(megaIndex + 1).join(' ');
    const combined = ['Mega', base, suffix].filter(Boolean).join(' ');
    return titleCase(combined);
  }

  return titleCase(name.replace(/-/g, ' '));
};

export function usePokemonList() {
  const [pokemonList, setPokemonList] = useState<Pokemon[]>([]);
  const [fetchingPokemon, setFetchingPokemon] = useState(true);

  useEffect(() => {
    const fetchPokemon = async () => {
      try {
        const [baseResponse, megaResponse] = await Promise.all([
          fetch(`${POKEAPI_BASE_URL}?limit=${BASE_POKEMON_LIMIT}`),
          fetch(`${POKEAPI_BASE_URL}?limit=${MAX_POKEMON_LIMIT}`),
        ]);
        const [baseData, megaData] = await Promise.all([
          baseResponse.json(),
          megaResponse.json(),
        ]);

        const parsePokemon = (p: { name: string; url: string }): Pokemon => {
          const id = Number.parseInt(p.url.split('/').filter(Boolean).pop() || '0', 10);
          return {
            ...p,
            id,
            sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
            displayName: formatPokemonName(p.name),
          };
        };

        const baseResults: Array<{ name: string; url: string }> = Array.isArray(baseData?.results)
          ? baseData.results
          : [];
        const megaResults: Array<{ name: string; url: string }> = Array.isArray(megaData?.results)
          ? megaData.results
          : [];

        const baseList = baseResults.map(parsePokemon);
        const megaList = megaResults
          .filter((p: { name: string }) => p.name.includes('-mega'))
          .map(parsePokemon);

        const merged = new Map<number, Pokemon>();
        baseList.forEach((pokemon) => merged.set(pokemon.id, pokemon));
        megaList.forEach((pokemon) => {
          if (!merged.has(pokemon.id)) {
            merged.set(pokemon.id, pokemon);
          }
        });

        setPokemonList(Array.from(merged.values()));
      } catch (err) {
        console.error('Failed to fetch pokemon list', err);
      } finally {
        setFetchingPokemon(false);
      }
    };
    fetchPokemon();
  }, []);

  return { pokemonList, fetchingPokemon };
}
