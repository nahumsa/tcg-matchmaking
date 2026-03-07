import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { config } from '../config';

const TOURNAMENT_CODE_LENGTH = 6;

interface Pokemon {
  name: string;
  url: string;
  id: number;
  sprite: string;
}

interface PokemonSelectorProps {
  label: string;
  selected: string | null; // This will be the ID as string
  excluded?: string | null;
  onSelect: (pokemonId: string | null) => void;
  pokemonList: Pokemon[];
}

function PokemonSelector({ label, selected, excluded = null, onSelect, pokemonList }: PokemonSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedPokemon = useMemo(() =>
    pokemonList.find(p => p.id.toString() === selected)
  , [selected, pokemonList]);

  const filteredOptions = useMemo(() => {
    const term = search.toLowerCase();
    return pokemonList
      .filter(p =>
        (p.id.toString() !== excluded || p.id.toString() === selected) &&
        p.name.toLowerCase().includes(term)
      )
      .slice(0, 50);
  }, [pokemonList, search, excluded, selected]);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-left focus:ring-2 focus:ring-green-500 transition outline-none flex items-center justify-between"
        >
          {selectedPokemon ? (
            <span className="flex items-center gap-2">
              <img src={selectedPokemon.sprite} alt={selectedPokemon.name} className="w-8 h-8" />
              <span className="font-medium capitalize">{selectedPokemon.name}</span>
            </span>
          ) : (
            <span className="text-gray-400">Choose a Pokémon</span>
          )}
          <span className="text-gray-400">▾</span>
        </button>

        {isOpen && (
          <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 flex flex-col overflow-hidden">
            <div className="p-2 border-b">
              <input
                type="text"
                autoFocus
                placeholder="Search Pokémon..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full p-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-green-500 outline-none"
              />
            </div>
            <div className="overflow-y-auto">
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50"
                onClick={() => {
                  onSelect(null);
                  setSearch('');
                  setIsOpen(false);
                }}
              >
                None
              </button>
              {filteredOptions.map((option) => (
                <button
                  key={option.name}
                  type="button"
                  className="w-full px-3 py-2 text-left hover:bg-green-50 flex items-center gap-2"
                  onClick={() => {
                    onSelect(option.id.toString());
                    setSearch('');
                    setIsOpen(false);
                  }}
                >
                  <img
                    src={option.sprite}
                    alt={option.name}
                    className="w-8 h-8"
                    loading="lazy"
                  />
                  <span className="capitalize">{option.name}</span>
                </button>
              ))}
              {filteredOptions.length === 0 && (
                <div className="px-3 py-4 text-center text-sm text-gray-400">
                  No Pokémon found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ParticipantJoin() {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [pokemon1, setPokemon1] = useState<string | null>(null);
  const [pokemon2, setPokemon2] = useState<string | null>(null);
  const [pokemonList, setPokemonList] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingPokemon, setFetchingPokemon] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPokemon = async () => {
      try {
        // Fetch a large enough list of pokemon (Gen 1-9 is ~1025)
        const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1025');
        const data = await response.json();
        const formatted = data.results.map((p: { name: string; url: string }) => {
          const id = parseInt(p.url.split('/').filter(Boolean).pop() || '0');
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

  const trimmedName = name.trim();
  const normalizedCode = code.trim().toUpperCase();
  const codeIsValid = /^[A-Z0-9]{6}$/.test(normalizedCode);
  const isFormValid = trimmedName.length > 1 && codeIsValid && !fetchingPokemon;

  const helperText = useMemo(() => {
    if (!code) return `Tournament code must be ${TOURNAMENT_CODE_LENGTH} letters or numbers.`;
    if (!codeIsValid) return `Enter exactly ${TOURNAMENT_CODE_LENGTH} letters or numbers.`;
    return 'Code looks good.';
  }, [code, codeIsValid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      setError('Please provide a valid name and tournament code.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${config.apiUrl}/tournaments/${normalizedCode}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: trimmedName,
          pokemon_1: pokemon1,
          pokemon_2: pokemon2,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to join tournament');
      }

      const data = await response.json();
      localStorage.setItem(`participant_id_${normalizedCode}`, data.id.toString());
      localStorage.setItem('last_tournament_code', normalizedCode);

      navigate(`/tournament/${normalizedCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <h1 className="text-3xl font-bold text-green-600 mb-6 uppercase tracking-wider">Join Tournament</h1>

      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-100">
        <h2 className="text-xl font-semibold mb-6 text-gray-800">Enter Details</h2>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label htmlFor="player-name" className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
            <input
              id="player-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ash Ketchum"
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition outline-none"
            />
          </div>

          <div>
            <label htmlFor="tournament-code" className="block text-sm font-medium text-gray-700 mb-1">Tournament Code</label>
            <input
              id="tournament-code"
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. ABCDEF"
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition outline-none font-mono uppercase text-center text-lg tracking-widest"
              maxLength={TOURNAMENT_CODE_LENGTH}
            />
            <p className={`mt-1 text-xs ${codeIsValid ? 'text-green-600' : 'text-gray-500'}`}>{helperText}</p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Deck Pokémon (up to 2)</p>
            <PokemonSelector
              label="Pokémon 1"
              selected={pokemon1}
              excluded={pokemon2}
              onSelect={setPokemon1}
              pokemonList={pokemonList}
            />
            <PokemonSelector
              label="Pokémon 2 (optional)"
              selected={pokemon2}
              excluded={pokemon1}
              onSelect={setPokemon2}
              pokemonList={pokemonList}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !isFormValid}
            className={`w-full py-3 px-4 bg-green-600 text-white font-bold rounded-lg transition ${(loading || !isFormValid) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700 shadow-md hover:shadow-lg active:scale-[0.98]'}`}
          >
            {loading ? 'Joining...' : 'Join Tournament'}
          </button>
        </form>

        {error && (
          <div className="mt-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm" role="alert">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
