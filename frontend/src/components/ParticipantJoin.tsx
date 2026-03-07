import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { config } from '../config';
import { useLanguage } from '../i18n';

const TOURNAMENT_CODE_LENGTH = 6;

export default function ParticipantJoin() {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const trimmedName = name.trim();
  const normalizedCode = code.trim().toUpperCase();
  const codeIsValid = /^[A-Z0-9]{6}$/.test(normalizedCode);
  const isFormValid = trimmedName.length > 1 && codeIsValid;

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
        body: JSON.stringify({ name: trimmedName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || t('joinFailed'));
      }

      const data = await response.json();
      localStorage.setItem(`participant_id_${normalizedCode}`, data.id.toString());
      localStorage.setItem('last_tournament_code', normalizedCode);

      navigate(`/tournament/${normalizedCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('commonUnexpectedError'));
    } finally {
      setLoading(false);
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
      </div>
    </div>
  );
}
