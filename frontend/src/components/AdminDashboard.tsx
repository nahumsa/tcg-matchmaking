import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { config } from '../config';
import ParticipantList from './ParticipantList';
import ActivityLog, { type ActivityEvent } from './ActivityLog';
import { useLanguage } from '../i18n';

interface Tournament {
  id: number;
  name: string;
  code: string;
  rounds: number;
  status: string;
}

interface Match {
  id: number;
  round_number: number;
  player1_id: number;
  player2_id: number | null;
  player1_score: number;
  player2_score: number;
  is_bye: number;
  is_completed: number;
  table_number: number | null;
}

interface Participant {
  id: number;
  name: string;
  points: number;
}

export default function AdminDashboard() {
  const [name, setName] = useState('');
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scoreInputs, setScoreInputs] = useState<Record<number, { p1: number; p2: number }>>({});
  const { t } = useLanguage();

  useEffect(() => {
    if (!tournament) {
      localStorage.removeItem('last_tournament_code');
    }
  }, [tournament]);

  useEffect(() => {
    if (!tournament) return;

    fetchMatches();
    fetchParticipants();

    const ws = new WebSocket(`${config.wsUrl}/ws/${tournament.code}`);
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (
        message.event === 'participant_joined'
        || message.event === 'participant_removed'
        || message.event === 'match_reported'
        || message.event === 'pairings_generated'
      ) {
        fetchMatches();
        fetchParticipants();
        fetchTournament();
      }

      if (message.event === 'participant_joined') {
        const newEvent: ActivityEvent = {
          id: Math.random().toString(36).substr(2, 9),
          type: message.event,
          message: t('adminJoinedTournament', { name: message.data.name }),
          timestamp: message.data.timestamp || new Date().toISOString(),
        };
        setEvents((prev) => [...prev, newEvent]);
      } else if (message.event === 'match_reported') {
        const newEvent: ActivityEvent = {
          id: Math.random().toString(36).substr(2, 9),
          type: message.event,
          message: t('adminMatchReported'),
          timestamp: new Date().toISOString(),
        };
        setEvents((prev) => [...prev, newEvent]);
      }
    };

    return () => ws.close();
  }, [tournament]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMatches = async () => {
    if (!tournament) return;
    try {
      const response = await fetch(`${config.apiUrl}/tournaments/${tournament.code}/matches`);
      if (response.ok) {
        const data = await response.json();
        setMatches(data);
      }
    } catch (err) {
      console.error('Failed to fetch matches', err);
    }
  };

  const fetchParticipants = async () => {
    if (!tournament) return;
    try {
      const response = await fetch(`${config.apiUrl}/tournaments/${tournament.code}/participants`);
      if (response.ok) {
        const data = await response.json();
        setParticipants(data);
      }
    } catch (err) {
      console.error('Failed to fetch participants', err);
    }
  };

  const fetchTournament = async () => {
    if (!tournament) return;
    try {
      const response = await fetch(`${config.apiUrl}/tournaments/${tournament.code}`);
      if (response.ok) {
        const data = await response.json();
        setTournament(data);
      }
    } catch (err) {
      console.error('Failed to fetch tournament', err);
    }
  };

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError(t('adminProvideTournamentName'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${config.apiUrl}/tournaments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!response.ok) {
        throw new Error(t('adminCreateFailed'));
      }

      const data = await response.json();
      setTournament(data);
      localStorage.setItem('last_tournament_code', data.code);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('commonUnexpectedError'));
    } finally {
      setLoading(false);
    }
  };

  const generatePairings = async () => {
    if (!tournament) return;
    setLoading(true);
    try {
      const response = await fetch(`${config.apiUrl}/tournaments/${tournament.code}/pairings`, {
        method: 'POST',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || t('adminPairingsFailed'));
      }
      await fetchMatches();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('commonUnexpectedError'));
    } finally {
      setLoading(false);
    }
  };

  const reportResult = async (matchId: number) => {
    if (!tournament) return;
    const existingMatch = matches.find((m) => m.id === matchId);
    const selectedScore = scoreInputs[matchId] ?? {
      p1: existingMatch?.player1_score ?? 0,
      p2: existingMatch?.player2_score ?? 0,
    };
    try {
      const response = await fetch(`${config.apiUrl}/tournaments/${tournament.code}/matches/${matchId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player1_score: selectedScore.p1,
          player2_score: selectedScore.p2,
          is_admin: true
        }),
      });
      if (!response.ok) throw new Error(t('adminReportFailed'));
      await fetchMatches();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('commonUnexpectedError'));
    }
  };

  const handleScoreChange = (matchId: number, player: 'p1' | 'p2', value: string) => {
    const parsedValue = Math.max(0, Number.parseInt(value, 10) || 0);
    setScoreInputs((prev) => ({
      ...prev,
      [matchId]: {
        p1: player === 'p1' ? parsedValue : (prev[matchId]?.p1 ?? 0),
        p2: player === 'p2' ? parsedValue : (prev[matchId]?.p2 ?? 0),
      },
    }));
  };

  if (tournament) {
    const currentRound = matches.length > 0 ? Math.max(...matches.map((m) => m.round_number)) : 0;
    const roundMatches = matches.filter((m) => m.round_number === currentRound);
    const allCompleted = roundMatches.every((m) => m.is_completed);
    const isTournamentFinished = tournament.status === 'COMPLETED';

    const getPlayerName = (id: number | null) => {
      if (id === null) return '-';
      const player = participants.find((p) => p.id === id);
      return player ? player.name : `Player ${id}`;
    };

    const handleExport = async () => {
      try {
        const response = await fetch(`${config.apiUrl}/tournaments/${tournament.code}/standings`);
        if (response.ok) {
          const standings = await response.json();
          const summary = standings.map((s: { rank: number; name: string; points: number; wins: number; losses: number; draws: number }) =>
            `${s.rank}. ${s.name} (${s.points} pts, ${s.wins}-${s.losses}-${s.draws})`).join('\n');

          const blob = new Blob([summary], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `standings_${tournament.code}.txt`;
          a.click();
          URL.revokeObjectURL(url);
        }
      } catch (err) {
        console.error(t('adminExportFailed'), err);
      }
    };

    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <div className="flex flex-col md:flex-row flex-1 p-4 sm:p-8 space-y-8 md:space-y-0 md:space-x-8">
          <div className="flex-1 max-w-4xl">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h1 className="text-4xl font-black text-gray-800 uppercase tracking-tighter mb-2">{tournament.name}</h1>
                <div className="flex items-center space-x-4">
                  <span className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-bold tracking-widest uppercase">{tournament.code}</span>
                  <Link to={`/tournament/${tournament.code}`} target="_blank" className="text-blue-600 hover:underline text-sm font-medium">{t('adminPublicView')}</Link>
                </div>
              </div>
              <button
                onClick={generatePairings}
                disabled={loading || (currentRound > 0 && !allCompleted) || isTournamentFinished}
                className="py-3 px-6 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {currentRound === 0 ? t('adminStartRound') : t('adminNextRound')}
              </button>
            </div>

            {isTournamentFinished && (
              <div className="mb-8 p-6 bg-green-600 rounded-2xl text-white shadow-xl shadow-green-100 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">{t('adminCompleted')}</h2>
                  <p className="text-green-100 font-medium">{t('adminCompletedDescription')}</p>
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={handleExport}
                    className="px-6 py-2 bg-green-700 text-white font-bold rounded-lg hover:bg-green-800 transition"
                  >
                    {t('adminExportResults')}
                  </button>
                  <Link to={`/tournament/${tournament.code}`} target="_blank" className="px-6 py-2 bg-white text-green-700 font-bold rounded-lg hover:bg-green-50 transition">
                    {t('adminViewFinalStandings')}
                  </Link>
                </div>
              </div>
            )}

            {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl">{error}</div>}

            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-700">{t('adminCurrentRound')}: {currentRound}</h2>
              <div className="grid gap-4">
                {roundMatches.length === 0 ? (
                  <p className="text-gray-400 italic">{t('adminNoMatches')}</p>
                ) : (
                  roundMatches.map((match) => (
                    <div key={match.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col space-y-4">
                      <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('adminTable')} {match.table_number || '?'}</span>
                        {match.is_completed && <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Completed</span>}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 font-bold text-lg">{getPlayerName(match.player1_id)}</div>

                        {match.is_bye ? (
                          <div className="flex-1 text-center font-black text-blue-600 uppercase tracking-widest">{t('adminBye')}</div>
                        ) : (
                          <div className="flex-1 flex items-center justify-center space-x-2 px-4">
                            <input
                              type="number"
                              min={0}
                              className="w-16 p-2 border rounded text-center font-bold"
                              value={scoreInputs[match.id]?.p1 ?? 0}
                              onChange={(e) => handleScoreChange(match.id, 'p1', e.target.value)}
                              aria-label={`Score for ${getPlayerName(match.player1_id)}`}
                            />
                            <span className="text-gray-300">-</span>
                            <input
                              type="number"
                              min={0}
                              className="w-16 p-2 border rounded text-center font-bold"
                              value={scoreInputs[match.id]?.p2 ?? 0}
                              onChange={(e) => handleScoreChange(match.id, 'p2', e.target.value)}
                              aria-label={`Score for ${getPlayerName(match.player2_id)}`}
                            />
                            <button
                              onClick={() => reportResult(match.id)}
                              className={`ml-4 px-4 py-2 text-white text-sm font-bold rounded-lg transition ${
                                match.is_completed ? 'bg-gray-400 hover:bg-gray-500' : 'bg-gray-800 hover:bg-black'
                              }`}
                              disabled={isTournamentFinished}
                            >
                              {match.is_completed ? t('adminOverride') : t('adminReport')}
                            </button>
                          </div>
                        )}

                        <div className="flex-1 font-bold text-lg text-right">{match.is_bye ? '-' : getPlayerName(match.player2_id)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="w-full md:w-80 lg:w-96 space-y-8">
            <ParticipantList
              tournamentCode={tournament.code}
              participants={participants}
              onUpdate={fetchParticipants}
            />
            <ActivityLog events={events} />
          </div>
        </div>
      </div>
    );
  }

  const isFormValid = name.trim().length > 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <h1 className="text-3xl font-bold text-blue-600 mb-6 uppercase tracking-wider">{t('adminTitle')}</h1>
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-100">
        <h2 className="text-xl font-semibold mb-6 text-gray-800">{t('adminCreateTournament')}</h2>
        <form onSubmit={handleCreateTournament} className="space-y-5" noValidate>
          <div>
            <label htmlFor="tournament-name" className="block text-sm font-medium text-gray-700 mb-1">{t('adminTournamentName')}</label>
            <input id="tournament-name" type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder={t('adminTournamentNamePlaceholder')} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition outline-none" />
          </div>
          <button type="submit" disabled={loading || !isFormValid} className={`w-full py-3 px-4 bg-blue-600 text-white font-bold rounded-lg transition ${(loading || !isFormValid) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700 shadow-md'}`}>
            {loading ? t('adminCreating') : t('adminCreateNewTournament')}
          </button>
        </form>
        {error && <div className="mt-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>}
      </div>
    </div>
  );
}
