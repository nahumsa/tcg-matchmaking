import React, { useState } from 'react';
import { config } from '../config';
import { useLanguage } from '../i18n';
import PokemonSelector from './PokemonSelector';
import { usePokemonList } from '../hooks/usePokemonList';

interface Participant {
  id: number;
  name: string;
  points: number;
  is_active?: boolean;
  dropped_round?: number | null;
  pokemon_1?: string | null;
  pokemon_2?: string | null;
}

interface ParticipantListProps {
  tournamentCode: string;
  participants: Participant[];
  currentRound: number;
  onUpdate: () => void;
}

export default function ParticipantList({ tournamentCode, participants, currentRound, onUpdate }: ParticipantListProps) {
  // ... rest of state
  const [newName, setNewName] = useState('');
  const [pokemon1, setPokemon1] = useState<string | null>(null);
  const [pokemon2, setPokemon2] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();
  const { pokemonList, fetchingPokemon } = usePokemonList();

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${config.apiUrl}/tournaments/${tournamentCode}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          pokemon_1: pokemon1,
          pokemon_2: pokemon2,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || t('participantsAddFailed'));
      }

      setNewName('');
      setPokemon1(null);
      setPokemon2(null);
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('commonUnexpectedError'));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveParticipant = async (id: number) => {
    if (!confirm(t('participantsRemoveConfirm'))) return;

    try {
      const response = await fetch(`${config.apiUrl}/tournaments/${tournamentCode}/participants/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error(t('participantsRemoveFailed'));
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('commonUnexpectedError'));
    }
  };

  const handleUndropParticipant = async (id: number) => {
    try {
      const response = await fetch(`${config.apiUrl}/tournaments/${tournamentCode}/participants/${id}/undrop`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || t('participantsUndropFailed'));
      }
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('commonUnexpectedError'));
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
      <div className="p-6 border-b border-gray-50 bg-gray-50/50">
        <h2 className="text-xl font-bold text-gray-800 uppercase tracking-tight">{t('participantsTitle')}</h2>
      </div>

      <div className="p-6 space-y-4">
        <form onSubmit={handleAddParticipant} className="flex space-x-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t('participantsNamePlaceholder')}
            className="flex-1 p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !newName.trim() || fetchingPokemon}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {t('participantsAdd')}
          </button>
        </form>

        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">{t('joinDeckPokemon')}</p>
          <PokemonSelector
            theme="blue"
            label={t('joinPokemon1')}
            selected={pokemon1}
            excluded={pokemon2}
            onSelect={setPokemon1}
            pokemonList={pokemonList}
          />
          <PokemonSelector
            theme="blue"
            label={t('joinPokemon2')}
            selected={pokemon2}
            excluded={pokemon1}
            onSelect={setPokemon2}
            pokemonList={pokemonList}
          />
        </div>

        {error && <div className="text-xs text-red-500 font-medium" role="alert">{error}</div>}
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="divide-y divide-gray-50">
          {participants.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 italic">{t('participantsNoOne')}</p>
          ) : (
            participants.map((p) => (
              <div key={p.id} className="py-3 flex items-center justify-between group">
                <div className="flex items-center space-x-3">
                  <div>
                    <div className="font-bold text-gray-800">{p.name}</div>
                    <div className="text-xs text-gray-500">{p.points} {t('participantsPoints')}</div>
                  </div>
                </div>
                {p.is_active === false ? (
                  <button
                    onClick={() => handleUndropParticipant(p.id)}
                    disabled={p.dropped_round !== currentRound}
                    className="px-2 py-1 text-xs font-semibold rounded-md border border-green-200 text-green-600 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={`Undrop ${p.name}`}
                  >
                    {t('participantsUndrop')}
                  </button>
                ) : (
                  <button
                    onClick={() => handleRemoveParticipant(p.id)}
                    className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition opacity-100 md:opacity-80 md:group-hover:opacity-100"
                    aria-label={`Remove ${p.name}`}
                  >
                    &times;
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
