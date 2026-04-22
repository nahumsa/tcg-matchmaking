import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { config } from '../config';
import { useLanguage } from '../i18n';
import PokemonSelector from './PokemonSelector';
import { usePokemonList } from '../hooks/usePokemonList';

const TOURNAMENT_CODE_LENGTH = 6;

export default function ParticipantJoin() {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [reloginCode, setReloginCode] = useState('');
  const [reloginReconnectCode, setReloginReconnectCode] = useState('');
  const [pokemon1, setPokemon1] = useState<string | null>(null);
  const [pokemon2, setPokemon2] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [reloginLoading, setReloginLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloginError, setReloginError] = useState<string | null>(null);
  const [joinedTournamentCode, setJoinedTournamentCode] = useState<string | null>(null);
  const [joinedReconnectCode, setJoinedReconnectCode] = useState<string | null>(null);
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { pokemonList, fetchingPokemon } = usePokemonList();

  const trimmedName = name.trim();
  const normalizedCode = code.trim().toUpperCase();
  const codeIsValid = /^[A-Z0-9]{6}$/.test(normalizedCode);
  const isFormValid = trimmedName.length > 1 && codeIsValid && !fetchingPokemon;

  const helperText = useMemo(() => {
    if (!code) return t('joinCodeMustBe', { length: TOURNAMENT_CODE_LENGTH });
    if (!codeIsValid) return t('joinCodeExactLength', { length: TOURNAMENT_CODE_LENGTH });
    return t('joinCodeLooksGood');
  }, [code, codeIsValid, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      setError(t('joinInvalidForm'));
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
        throw new Error(errorData.detail || t('joinFailed'));
      }

      const data = await response.json();
      localStorage.setItem(`participant_id_${normalizedCode}`, data.id.toString());
      localStorage.setItem('last_tournament_code', normalizedCode);
      setJoinedTournamentCode(normalizedCode);
      setJoinedReconnectCode(data.reconnect_code);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('commonUnexpectedError'));
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAfterJoin = () => {
    if (!joinedTournamentCode) return;
    navigate(`/tournament/${joinedTournamentCode}`);
  };

  const handleRelogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedReloginCode = reloginCode.trim().toUpperCase();
    const trimmedReconnectCode = reloginReconnectCode.trim();
    if (!/^[A-Z0-9]{6}$/.test(normalizedReloginCode) || !trimmedReconnectCode) {
      setReloginError(t('joinInvalidForm'));
      return;
    }

    setReloginLoading(true);
    setReloginError(null);
    try {
      const response = await fetch(
        `${config.apiUrl}/tournaments/${normalizedReloginCode}/participants/relogin`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reconnect_code: trimmedReconnectCode }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || t('joinFailed'));
      }

      const data = await response.json();
      localStorage.setItem(`participant_id_${normalizedReloginCode}`, data.id.toString());
      localStorage.setItem('last_tournament_code', normalizedReloginCode);
      navigate(`/tournament/${normalizedReloginCode}`);
    } catch (err) {
      setReloginError(err instanceof Error ? err.message : t('commonUnexpectedError'));
    } finally {
      setReloginLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <h1 className="text-3xl font-bold text-green-600 mb-6 uppercase tracking-wider">{t('joinTitle')}</h1>

      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-100">
        <h2 className="text-xl font-semibold mb-6 text-gray-800">{t('joinDetails')}</h2>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label htmlFor="player-name" className="block text-sm font-medium text-gray-700 mb-1">{t('joinName')}</label>
            <input
              id="player-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('joinNamePlaceholder')}
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition outline-none"
            />
          </div>

          <div>
            <label htmlFor="tournament-code" className="block text-sm font-medium text-gray-700 mb-1">{t('joinCode')}</label>
            <input
              id="tournament-code"
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder={t('joinCodePlaceholder')}
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition outline-none font-mono uppercase text-center text-lg tracking-widest"
              maxLength={TOURNAMENT_CODE_LENGTH}
            />
            <p className={`mt-1 text-xs ${codeIsValid ? 'text-green-600' : 'text-gray-500'}`}>{helperText}</p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">{t('joinDeckPokemon')}</p>
            <PokemonSelector
              theme="green"
              label={t('joinPokemon1')}
              selected={pokemon1}
              excluded={pokemon2}
              onSelect={setPokemon1}
              pokemonList={pokemonList}
            />
            <PokemonSelector
              theme="green"
              label={t('joinPokemon2')}
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
            {loading ? t('joinLoading') : t('joinButton')}
          </button>
        </form>

        {error && (
          <div className="mt-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm" role="alert">
            {error}
          </div>
        )}

        {joinedTournamentCode && joinedReconnectCode && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-sm space-y-3">
            <p className="font-semibold">Your reconnect code (save this):</p>
            <code className="block font-mono break-all bg-white rounded p-2 border border-blue-200">{joinedReconnectCode}</code>
            <button
              type="button"
              onClick={handleContinueAfterJoin}
              className="w-full py-2 px-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
            >
              Go to tournament
            </button>
          </div>
        )}
      </div>

      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-100 mt-6">
        <h2 className="text-xl font-semibold mb-6 text-gray-800">Reconnect to Tournament</h2>
        <form onSubmit={handleRelogin} className="space-y-5">
          <div>
            <label htmlFor="relogin-tournament-code" className="block text-sm font-medium text-gray-700 mb-1">
              Tournament Code
            </label>
            <input
              id="relogin-tournament-code"
              type="text"
              required
              value={reloginCode}
              onChange={(e) => setReloginCode(e.target.value.toUpperCase())}
              placeholder={t('joinCodePlaceholder')}
              className="w-full p-2.5 border border-gray-300 rounded-lg font-mono uppercase text-center text-lg tracking-widest"
              maxLength={TOURNAMENT_CODE_LENGTH}
            />
          </div>
          <div>
            <label htmlFor="reconnect-code" className="block text-sm font-medium text-gray-700 mb-1">
              Reconnect Code
            </label>
            <input
              id="reconnect-code"
              type="text"
              required
              value={reloginReconnectCode}
              onChange={(e) => setReloginReconnectCode(e.target.value)}
              placeholder="Paste your reconnect code"
              className="w-full p-2.5 border border-gray-300 rounded-lg font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={reloginLoading}
            className={`w-full py-3 px-4 bg-gray-800 text-white font-bold rounded-lg transition ${reloginLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black'}`}
          >
            {reloginLoading ? 'Reconnecting...' : 'Reconnect'}
          </button>
        </form>
        {reloginError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm" role="alert">
            {reloginError}
          </div>
        )}
      </div>
    </div>
  );
}
