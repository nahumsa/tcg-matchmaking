import { useEffect, useState } from 'react';

export interface Pokemon {
  name: string;
  url: string;
  id: number;
  sprite: string;
}

export function usePokemonList() {
  const [pokemonList, setPokemonList] = useState<Pokemon[]>([]);
  const [fetchingPokemon, setFetchingPokemon] = useState(true);

  useEffect(() => {
    const fetchPokemon = async () => {
      try {
        const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1025');
        const data = await response.json();
        const formatted = data.results.map((p: { name: string; url: string }) => {
          const id = Number.parseInt(p.url.split('/').filter(Boolean).pop() || '0', 10);
          return {
            ...p,
            id,
            sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
          };
        });
        setPokemonList(formatted);
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
