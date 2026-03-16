import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { config } from '../config';
import ParticipantList from './ParticipantList';
import ActivityLog, { type ActivityEvent } from './ActivityLog';
import { useLanguage } from '../i18n';
import PokemonSprite from './PokemonSprite';
import ReportMatchModal from './ReportMatchModal';

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
  pokemon_1?: string | null;
  pokemon_2?: string | null;
  rank?: number;
  wins?: number;
  losses?: number;
  draws?: number;
  omw_percentage?: number;
}

export default function AdminDashboard() {
  const [name, setName] = useState('');
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [standings, setStandings] = useState<Participant[]>([]);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();
  const [pokemonMap, setPokemonMap] = useState<Record<string, string>>({});
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [startStep, setStartStep] = useState<1 | 2>(1);
  const [confirmInput, setConfirmInput] = useState('');
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [reportingMatch, setReportingMatch] = useState<Match | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<[number, number] | null>(null);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const presets: [number, number][] = [
    [2, 0],
    [2, 1],
    [1, 0],
    [1, 2],
    [0, 1],
    [0, 2],
    [1, 1]
  ];

  useEffect(() => {
    const fetchPokemon = async () => {
      try {
        const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1025');
        const data = await response.json();
        const map: Record<string, string> = {};
        data.results.forEach((p: { name: string; url: string }) => {
          const id = p.url.split('/').filter(Boolean).pop() || '0';
          map[id] = p.name.charAt(0).toUpperCase() + p.name.slice(1);
        });
        setPokemonMap(map);
      } catch (err) {
        console.error('Failed to fetch pokemon list', err);
      }
    };
    fetchPokemon();
  }, []);

  useEffect(() => {
    if (!tournament) {
      localStorage.removeItem('last_tournament_code');
    }
  }, [tournament]);

  useEffect(() => {
    if (!tournament) return;

    fetchMatches();
    fetchParticipants();
    fetchStandings();

    const ws = new WebSocket(`${config.wsUrl}/ws/${tournament.code}`);
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (
        message.event === 'participant_joined'
        || message.event === 'participant_removed'
        || message.event === 'match_reported'
        || message.event === 'pairings_generated'
        || message.event === 'tournament_completed'
      ) {
        fetchMatches();
        fetchParticipants();
        fetchStandings();
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
  }, [tournament, t]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const fetchStandings = async () => {
    if (!tournament) return;
    try {
      const response = await fetch(`${config.apiUrl}/tournaments/${tournament.code}/standings`);
      if (response.ok) {
        const data = await response.json();
        setStandings(data);
      }
    } catch (err) {
      console.error('Failed to fetch standings', err);
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

  const getCurrentRound = () => (matches.length > 0 ? Math.max(...matches.map((m) => m.round_number)) : 0);

  const openStartModal = () => {
    setStartStep(1);
    setConfirmInput('');
    setConfirmError(null);
    setIsStartModalOpen(true);
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

  const closeStartModal = () => {
    setIsStartModalOpen(false);
    setConfirmInput('');
    setConfirmError(null);
  };

  const handleStartConfirmContinue = () => {
    setStartStep(2);
    setConfirmError(null);
  };

  const handleStartConfirm = () => {
    if (!tournament) return;
    if (confirmInput.trim().toUpperCase() !== tournament.code.toUpperCase()) {
      setConfirmError(t('adminStartCodeMismatch'));
      return;
    }
    closeStartModal();
    generatePairings();
  };

  const handleStartClick = () => {
    if (!tournament) return;
    const currentRound = getCurrentRound();
    if (currentRound === 0) {
      openStartModal();
      return;
    }
    generatePairings();
  };

  const completeTournament = async () => {
    if (!tournament) return;
    setLoading(true);
    try {
      const response = await fetch(`${config.apiUrl}/tournaments/${tournament.code}/complete`, {
        method: 'POST',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || t('adminExportFailed'));
      }
      await fetchTournament();
      await fetchStandings();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('commonUnexpectedError'));
    } finally {
      setLoading(false);
    }
  };

  const reportResult = async () => {
    if (!tournament || !reportingMatch || !selectedPreset) return;
    setIsSubmittingReport(true);
    try {
      const response = await fetch(`${config.apiUrl}/tournaments/${tournament.code}/matches/${reportingMatch.id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player1_score: selectedPreset[0],
          player2_score: selectedPreset[1],
          is_admin: true
        }),
      });
      if (!response.ok) throw new Error(t('adminReportFailed'));
      await fetchMatches();
      await fetchStandings();
      setReportingMatch(null);
      setSelectedPreset(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('commonUnexpectedError'));
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleReportOpen = (match: Match) => {
    setReportingMatch(match);
    setSelectedPreset([match.player1_score, match.player2_score]);
  };

  const getWinPercentage = (wins = 0, losses = 0, draws = 0) => {
    const total = wins + losses + draws;
    if (total === 0) return 0;
    return ((wins + draws * 0.5) / total) * 100;
  };

  if (tournament) {
    const currentRound = matches.length > 0 ? Math.max(...matches.map((m) => m.round_number)) : 0;
    const roundMatches = matches.filter((m) => m.round_number === currentRound);
    const allCompleted = roundMatches.every((m) => m.is_completed);
    const isTournamentFinished = tournament.status === 'COMPLETED';
    const isConfirmValid = confirmInput.trim().toUpperCase() === tournament.code.toUpperCase();

    const getPlayerName = (id: number | null) => {
      if (id === null) return '-';
      const player = participants.find((p) => p.id === id);
      return player ? player.name : t('commonPlayerWithId', { id });
    };

    const renderPlayer = (id: number | null) => {
      if (id === null) return <span className="text-gray-400">-</span>;
      const player = participants.find((p) => p.id === id);
      if (!player) return <span>{t('commonPlayerWithId', { id })}</span>;

      return (
        <div className="flex items-center space-x-2">
          <div className="flex -space-x-2 opacity-80">
            <PokemonSprite pokemonId={player.pokemon_1} size="sm" />
            <PokemonSprite pokemonId={player.pokemon_2} size="sm" />
          </div>
          <span className="font-bold">{player.name}</span>
        </div>
      );
    };

    const handleExport = async () => {
      try {
        const response = await fetch(`${config.apiUrl}/tournaments/${tournament.code}/standings`);
        if (response.ok) {
          const standingsData = await response.json();
          const summary = standingsData.map((s: Participant) => {
            const p1Name = (s.pokemon_1 ? pokemonMap[s.pokemon_1] : null) || s.pokemon_1 || t('commonNone');
            const p2Name = (s.pokemon_2 ? pokemonMap[s.pokemon_2] : null) || s.pokemon_2 || t('commonNone');
            const winPercent = getWinPercentage(s.wins ?? 0, s.losses ?? 0, s.draws ?? 0).toFixed(1);
            return `${s.rank}. ${s.name} (${s.points} pts, ${s.wins}-${s.losses}-${s.draws}, ${winPercent}%) (${p1Name}, ${p2Name})`;
          }).join('\n');

          const blob = new Blob([summary], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `standings_${tournament.code}.txt`;
          a.click();
          URL.revokeObjectURL(url);
        }
      } catch (err) {
        console.error('Failed to export standings', err);
      }
    };

    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        {isStartModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4" role="dialog" aria-modal="true">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest font-bold text-gray-400">{t('adminStartConfirmStep', { step: startStep })}</p>
                  <h3 className="text-2xl font-black text-gray-800 mt-1">{t('adminStartConfirmTitle')}</h3>
                </div>
                <button onClick={closeStartModal} className="text-gray-400 hover:text-gray-600" aria-label={t('adminStartCancel')}>
                  X
                </button>
              </div>

              {startStep === 1 ? (
                <div className="space-y-3">
                  <p className="text-gray-700 leading-relaxed">{t('adminStartConfirmBody')}</p>
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm text-gray-600 space-y-1">
                    <p>- {t('adminStartConfirmLockRoster')}</p>
                    <p>- {t('adminStartConfirmGenerate')}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-700" htmlFor="confirmCode">
                    {t('adminStartEnterCode', { code: tournament.code })}
                  </label>
                  <input
                    id="confirmCode"
                    type="text"
                    value={confirmInput}
                    onChange={(e) => {
                      setConfirmInput(e.target.value);
                      setConfirmError(null);
                    }}
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-lg font-mono tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t('adminStartCodePlaceholder', { code: tournament.code })}
                    autoFocus
                  />
                  {confirmError && <p className="text-sm text-red-600">{confirmError}</p>}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  onClick={closeStartModal}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  {t('adminStartCancel')}
                </button>
                {startStep === 1 ? (
                  <button
                    onClick={handleStartConfirmContinue}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700"
                  >
                    {t('adminStartContinue')}
                  </button>
                ) : (
                  <button
                    onClick={handleStartConfirm}
                    disabled={!isConfirmValid || loading}
                    className={`px-4 py-2 rounded-lg font-bold text-white transition ${!isConfirmValid || loading
                        ? 'bg-blue-300 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                  >
                    {t('adminStartConfirmButton')}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        <div className="flex flex-col md:flex-row flex-1 p-4 sm:p-8 space-y-8 md:space-y-0 md:space-x-8">
          <div className="flex-1 max-w-4xl">
            <ReportMatchModal
              isOpen={Boolean(reportingMatch)}
              playerLabel={reportingMatch ? getPlayerName(reportingMatch.player1_id) : t('commonPlayerWithId', { id: '?' })}
              opponentLabel={reportingMatch ? getPlayerName(reportingMatch.player2_id) : t('commonPlayerWithId', { id: '?' })}
              presets={presets}
              selectedPreset={selectedPreset}
              isSubmitting={isSubmittingReport}
              onSelectPreset={setSelectedPreset}
              onClose={() => {
                setReportingMatch(null);
                setSelectedPreset(null);
              }}
              onSubmit={reportResult}
            />
            <div className="flex justify-between items-end mb-8">
              <div>
                <h1 className="text-4xl font-black text-gray-800 uppercase tracking-tighter mb-2">{tournament.name}</h1>
                <div className="flex items-center space-x-4">
                  <span className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-bold tracking-widest uppercase">{tournament.code}</span>
                  <span className="bg-green-600 text-white px-3 py-1 rounded text-sm font-bold tracking-widest uppercase">{participants.length} {t('adminPlayers')}</span>
                  <Link to={`/tournament/${tournament.code}`} target="_blank" className="text-blue-600 hover:underline text-sm font-medium">{t('adminPublicView')}</Link>
                </div>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => (currentRound >= tournament.rounds ? completeTournament() : handleStartClick())}
                  disabled={loading || (currentRound > 0 && !allCompleted) || isTournamentFinished}
                  className={`py-3 px-6 text-white font-bold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${currentRound >= tournament.rounds ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                >
                  {currentRound === 0 ? t('adminStartRound') : currentRound >= tournament.rounds ? t('adminEndTournament') : t('adminNextRound')}
                </button>
                {currentRound > 0 && currentRound < tournament.rounds && allCompleted && !isTournamentFinished && (
                  <button
                    onClick={completeTournament}
                    disabled={loading}
                    className="py-3 px-6 bg-gray-600 text-white font-bold rounded-xl hover:bg-gray-700 transition shadow-lg"
                  >
                    {t('adminEndEarly')}
                  </button>
                )}
              </div>
            </div>

            {isTournamentFinished && (
              <div className="space-y-6">
                <div className="p-6 bg-green-600 rounded-2xl text-white shadow-xl shadow-green-100 flex items-center justify-between">
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

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-800">{t('adminFinalStandings')}</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-50 text-gray-500 text-[10px] font-bold uppercase tracking-widest border-b border-gray-100">
                          <th className="px-6 py-4 text-center">{t('adminRank')}</th>
                          <th className="px-6 py-4">{t('adminPlayer')}</th>
                          <th className="px-6 py-4">{t('adminPokemon')}</th>
                          <th className="px-6 py-4">{t('adminPoints')}</th>
                          <th className="px-6 py-4">{t('adminRecord')}</th>
                          <th className="px-6 py-4 text-right">{t('adminWinPercent')}</th>
                          <th className="px-6 py-4 text-right">{t('adminOMW')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {standings.map((s) => (
                          <tr key={s.id} className="hover:bg-blue-50/30 transition-colors">
                            <td className="px-6 py-4 font-black text-gray-400 text-center">#{s.rank}</td>
                            <td className="px-6 py-4">
                              <span className="font-bold text-gray-800">{s.name}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <div className="flex -space-x-2">
                                  <PokemonSprite pokemonId={s.pokemon_1} size="sm" />
                                  <PokemonSprite pokemonId={s.pokemon_2} size="sm" />
                                </div>
                                <span className="text-xs text-gray-500 capitalize">
                                  {pokemonMap[s.pokemon_1 || ''] || ''} / {pokemonMap[s.pokemon_2 || ''] || ''}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-black text-blue-600">{s.points}</td>
                            <td className="px-6 py-4 text-sm text-gray-500 font-medium">{s.wins}-{s.losses}-{s.draws}</td>
                            <td className="px-6 py-4 text-right font-mono text-xs font-bold text-gray-400">
                              {getWinPercentage(s.wins ?? 0, s.losses ?? 0, s.draws ?? 0).toFixed(1)}%
                            </td>
                            <td className="px-6 py-4 text-right font-mono text-xs font-bold text-gray-400">
                              {((s.omw_percentage || 0) * 100).toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl">{error}</div>}

            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-700">
                {currentRound === 0 ? t('adminTournamentNotStarted') : t('adminRoundOf', { current: currentRound, total: tournament.rounds })}
              </h2>
              <div className="grid gap-4">
                {roundMatches.length === 0 ? (
                  <p className="text-gray-400 italic">{t('adminNoMatches')}</p>
                ) : (
                  roundMatches.map((match) => (
                    <div key={match.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col space-y-4">
                      <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('adminTable')} {match.table_number || '?'}</span>
                        {match.is_completed && <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">{t('adminCompletedStatus')}</span>}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 font-bold text-lg">{renderPlayer(match.player1_id)}</div>

                        {match.is_bye ? (
                          <div className="flex-1 text-center font-black text-blue-600 uppercase tracking-widest">{t('adminBye')}</div>
                        ) : (
                          <div className="flex-1 flex items-center justify-center px-4">
                            <button
                              onClick={() => handleReportOpen(match)}
                              className={`px-4 py-2 text-white text-sm font-bold rounded-lg transition ${match.is_completed ? 'bg-gray-400 hover:bg-gray-500' : 'bg-gray-800 hover:bg-black'
                                }`}
                              disabled={isTournamentFinished}
                            >
                              {match.is_completed ? t('adminOverride') : t('adminReport')}
                            </button>
                          </div>
                        )}

                        <div className="flex-1 font-bold text-lg text-right flex justify-end">{match.is_bye ? '-' : renderPlayer(match.player2_id)}</div>
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
