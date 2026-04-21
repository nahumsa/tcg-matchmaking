import React, { useState } from 'react';
import { config } from '../config';
import { useLanguage } from '../i18n';
import PokemonSelector from './PokemonSelector';
import { usePokemonList } from '../hooks/usePokemonList';

interface Participant {
  id: number;
  name: string;
  points: number;
  pokemon_1?: string | null;
  pokemon_2?: string | null;
}

interface ParticipantListProps {
  tournamentCode: string;
  participants: Participant[];
  currentRound: number;
  onUpdate: () => void;
}

interface DroppedParticipant extends Participant {
  droppedInRound: number;
}

export default function ParticipantList({ tournamentCode, participants, currentRound, onUpdate }: ParticipantListProps) {
  const [newName, setNewName] = useState('');
  const [pokemon1, setPokemon1] = useState<string | null>(null);
  const [pokemon2, setPokemon2] = useState<string | null>(null);
  const [droppedParticipants, setDroppedParticipants] = useState<DroppedParticipant[]>([]);
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

    const participantToDrop = participants.find((participant) => participant.id === id);
    try {
      const response = await fetch(`${config.apiUrl}/tournaments/${tournamentCode}/participants/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error(t('participantsRemoveFailed'));
      if (participantToDrop) {
        setDroppedParticipants((prev) => [
          { ...participantToDrop, droppedInRound: currentRound },
          ...prev.filter((participant) => participant.id !== participantToDrop.id),
        ]);
      }
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('commonUnexpectedError'));
    }
  };

  const handleUndropParticipant = async (participant: Participant) => {
    setError(null);
    try {
      const response = await fetch(`${config.apiUrl}/tournaments/${tournamentCode}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: participant.name,
          pokemon_1: participant.pokemon_1 ?? null,
          pokemon_2: participant.pokemon_2 ?? null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || t('participantsUndropFailed'));
      }

      setDroppedParticipants((prev) => prev.filter((droppedParticipant) => droppedParticipant.id !== participant.id));
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

        {droppedParticipants.length > 0 && (
          <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
              {t('participantsRecentlyDropped')}
            </p>
            <div className="space-y-1">
              {droppedParticipants.map((participant) => (
                <div key={participant.id} className="flex items-center justify-between gap-2 text-sm">
                  <div className="flex flex-col">
                    <span className="font-medium text-amber-900">{participant.name}</span>
                    {currentRound !== participant.droppedInRound && (
                      <span className="text-xs text-amber-700">{t('participantsUndropSameRound')}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUndropParticipant(participant)}
                    disabled={currentRound !== participant.droppedInRound}
                    className="rounded bg-amber-700 px-2 py-1 text-xs font-bold text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:bg-amber-300"
                  >
                    {t('participantsUndrop')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
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
                <button
                  onClick={() => handleRemoveParticipant(p.id)}
                  className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition opacity-100 md:opacity-80 md:group-hover:opacity-100"
                  aria-label={`Remove ${p.name}`}
                >
                  &times;
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
