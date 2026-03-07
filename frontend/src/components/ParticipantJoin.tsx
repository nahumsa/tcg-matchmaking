import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { config } from '../config';

const TOURNAMENT_CODE_LENGTH = 6;

const POKEMON_OPTIONS = [
  { name: 'Bulbasaur', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png' },
  { name: 'Charmander', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png' },
  { name: 'Squirtle', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png' },
  { name: 'Pikachu', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png' },
  { name: 'Eevee', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/133.png' },
  { name: 'Snorlax', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/143.png' },
  { name: 'Mewtwo', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/150.png' },
  { name: 'Gengar', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/94.png' },
  { name: 'Dragonite', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/149.png' },
  { name: 'Lucario', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/448.png' },
] as const;

type PokemonName = (typeof POKEMON_OPTIONS)[number]['name'];

interface PokemonDropdownProps {
  label: string;
  selected: PokemonName | null;
  excluded?: PokemonName | null;
  onSelect: (pokemon: PokemonName | null) => void;
}

function PokemonDropdown({ label, selected, excluded = null, onSelect }: PokemonDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const availableOptions = POKEMON_OPTIONS.filter((option) => option.name !== excluded || option.name === selected);
  const selectedOption = POKEMON_OPTIONS.find((option) => option.name === selected) ?? null;

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-left focus:ring-2 focus:ring-green-500 transition outline-none flex items-center justify-between"
      >
        {selectedOption ? (
          <span className="flex items-center gap-2">
            <img src={selectedOption.sprite} alt={selectedOption.name} className="w-8 h-8" />
            <span className="font-medium">{selectedOption.name}</span>
          </span>
        ) : (
          <span className="text-gray-400">Choose a Pokémon</span>
        )}
        <span className="text-gray-400">▾</span>
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-auto">
          <button
            type="button"
            className="w-full px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50"
            onClick={() => {
              onSelect(null);
              setIsOpen(false);
            }}
          >
            None
          </button>
          {availableOptions.map((option) => (
            <button
              key={option.name}
              type="button"
              className="w-full px-3 py-2 text-left hover:bg-green-50 flex items-center gap-2"
              onClick={() => {
                onSelect(option.name);
                setIsOpen(false);
              }}
            >
              <img src={option.sprite} alt={option.name} className="w-8 h-8" />
              <span>{option.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ParticipantJoin() {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [pokemon1, setPokemon1] = useState<PokemonName | null>(null);
  const [pokemon2, setPokemon2] = useState<PokemonName | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const trimmedName = name.trim();
  const normalizedCode = code.trim().toUpperCase();
  const codeIsValid = /^[A-Z0-9]{6}$/.test(normalizedCode);
  const isFormValid = trimmedName.length > 1 && codeIsValid;

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
            <PokemonDropdown
              label="Pokémon 1"
              selected={pokemon1}
              excluded={pokemon2}
              onSelect={setPokemon1}
            />
            <PokemonDropdown
              label="Pokémon 2 (optional)"
              selected={pokemon2}
              excluded={pokemon1}
              onSelect={setPokemon2}
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
