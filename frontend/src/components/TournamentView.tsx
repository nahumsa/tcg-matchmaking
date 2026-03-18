import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { config } from '../config';
import PokemonSprite from './PokemonSprite';
import { useLanguage } from '../i18n';
import ReportMatchModal from './ReportMatchModal';

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

interface Standing {
  id: number;
  name: string;
  rank: number;
  points: number;
  wins: number;
  losses: number;
  draws: number;
  omw_percentage: number;
  pokemon_1?: string | null;
  pokemon_2?: string | null;
}

interface PotentialPairing {
  id: number;
  name: string;
  points: number;
}

type SocketStatus = 'connecting' | 'connected' | 'reconnecting' | 'offline';

export default function TournamentView() {
  const { code } = useParams<{ code: string }>();
  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [potentialPairings, setPotentialPairings] = useState<PotentialPairing[]>([]);
  const [activeTab, setActiveTab] = useState<'pairings' | 'standings'>('pairings');
  const [loading, setLoading] = useState(true);
  const [socketStatus, setSocketStatus] = useState<SocketStatus>('connecting');
  const [tournamentStatus, setTournamentStatus] = useState<string>('ACTIVE');
  const [reportingMatch, setReportingMatch] = useState<Match | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<[number, number] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useLanguage();

  const participantIdStr = localStorage.getItem(`participant_id_${code}`);
  const participantId = participantIdStr ? Number.parseInt(participantIdStr, 10) : null;

  const presets: [number, number][] = [
    [2, 0],
    [2, 1],
    [1, 0],
    [1, 2],
    [0, 1],
    [0, 2],
    [1, 1]
    ];

    const tournamentCompleted = tournamentStatus === 'COMPLETED';

    useEffect(() => {

    if (!code) return;

    fetchData();

    let ws: WebSocket | null = null;
    let reconnectTimer: number | null = null;

    const connect = () => {
      setSocketStatus((prev) => (prev === 'connected' ? prev : 'connecting'));
      ws = new WebSocket(`${config.wsUrl}/ws/${code}`);

      ws.onopen = () => {
        setSocketStatus('connected');
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.event === 'pairings_generated' || message.event === 'match_reported' || message.event === 'participant_joined' || message.event === 'tournament_completed') {
          fetchData();
        }
      };

      ws.onclose = () => {
        setSocketStatus('reconnecting');
        reconnectTimer = window.setTimeout(() => connect(), 1500);
      };

      ws.onerror = () => {
        setSocketStatus('offline');
      };
    };

    connect();

    return () => {
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [code]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    try {
      const [matchesRes, standingsRes, tournamentRes] = await Promise.all([
        fetch(`${config.apiUrl}/tournaments/${code}/matches`),
        fetch(`${config.apiUrl}/tournaments/${code}/standings`),
        fetch(`${config.apiUrl}/tournaments/${code}`),
      ]);

      if (matchesRes.ok) {
        const data = await matchesRes.json();
        setMatches(data);
      }

      if (standingsRes.ok) {
        const data = await standingsRes.json();
        setStandings(data);
      }

      if (tournamentRes.ok) {
        const data = await tournamentRes.json();
        setTournamentStatus(data.status);
      }

      if (participantId) {
        const potentialRes = await fetch(`${config.apiUrl}/tournaments/${code}/participants/${participantId}/potential-pairings`);
        if (potentialRes.ok) {
          const data = await potentialRes.json();
          setPotentialPairings(data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReportSubmit = async () => {
    if (!reportingMatch || !selectedPreset) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${config.apiUrl}/tournaments/${code}/matches/${reportingMatch.id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player1_score: selectedPreset[0],
          player2_score: selectedPreset[1],
          reported_by_id: participantId
        })
      });

      if (res.ok) {
        setReportingMatch(null);
        setSelectedPreset(null);
        fetchData();
      } else {
        const errData = await res.json();
        alert(errData.detail || t('tournamentReportFailed'));
      }
    } catch (err) {
      console.error('Failed to report score', err);
      alert(t('commonUnexpectedError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center font-bold text-gray-500 uppercase tracking-widest animate-pulse">{t('tournamentLoading')}</div>;

  const rounds = [...new Set(matches.map((m) => m.round_number))].sort((a, b) => b - a);
  const myStanding = standings.find((s) => s.id === participantId);

  const getWinPercentage = (wins = 0, losses = 0, draws = 0) => {
    const total = wins + losses + draws;
    if (total === 0) return 0;
    return ((wins + draws * 0.5) / total) * 100;
  };

  const renderPokemonVisibility = (standing: Standing, compact = false) => {
    if (tournamentCompleted) {
      return (
        <div className="flex -space-x-2">
          <PokemonSprite pokemonId={standing.pokemon_1} size={compact ? 'md' : 'sm'} />
          <PokemonSprite pokemonId={standing.pokemon_2} size={compact ? 'md' : 'sm'} />
        </div>
      );
    }

    return <span className="text-xs text-gray-400 italic">{t('tournamentHidden')}</span>;
  };

  const renderPlayer = (id: number | null) => {
    if (id === null) return <span className="text-gray-400">-</span>;
    const player = standings.find((s) => s.id === id);
    if (!player) return <span>{t('commonPlayerWithId', { id })}</span>;

    return (
      <div className="flex items-center space-x-2">
        <span className="font-bold">{player.name}</span>
      </div>
    );
  };

  const getPlayerName = (id: number | null) => {
    if (id === null) return '-';
    const player = standings.find((s) => s.id === id);
    return player ? player.name : t('commonPlayerWithId', { id });
  };

  const socketStatusClass = socketStatus === 'connected'
    ? 'bg-green-100 text-green-700'
    : socketStatus === 'reconnecting'
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-gray-100 text-gray-700';

  const socketStatusText = socketStatus === 'connected'
    ? t('tournamentConnected')
    : socketStatus === 'reconnecting'
      ? t('tournamentReconnecting')
      : t('tournamentConnecting');

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-8">
      <ReportMatchModal
        isOpen={Boolean(reportingMatch)}
        playerLabel={t('tournamentReportYou')}
        opponentLabel={reportingMatch
          ? getPlayerName(reportingMatch.player1_id === participantId ? reportingMatch.player2_id : reportingMatch.player1_id)
          : t('commonPlayerWithId', { id: '?' })}
        presets={presets}
        selectedPreset={selectedPreset}
        isSubmitting={isSubmitting}
        onSelectPreset={setSelectedPreset}
        onClose={() => {
          setReportingMatch(null);
          setSelectedPreset(null);
        }}
        onSubmit={handleReportSubmit}
      />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tighter">
          {t('tournamentTournament')} <span className="text-blue-600">#{code}</span>
        </h1>

        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${socketStatusClass}`}>
            {socketStatusText}
          </span>

          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('pairings')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'pairings' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {t('tournamentPairings')}
            </button>
            <button
              onClick={() => setActiveTab('standings')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'standings' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {t('tournamentStandings')}
            </button>
          </div>
        </div>
      </div>

      {participantId && myStanding && (
        <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-xl shadow-blue-200">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-1">{t('tournamentMyStatus')}</div>
              <h2 className="text-2xl font-black uppercase tracking-tight">{myStanding.name}</h2>
            </div>
            <div className="text-right">
              <div className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-1">{t('tournamentCurrentRank')}</div>
              <div className="text-3xl font-black">#{myStanding.rank}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-4 border-t border-blue-500">
            <div>
              <div className="text-blue-200 text-[10px] font-bold uppercase tracking-widest">{t('tournamentPoints')}</div>
              <div className="text-lg font-bold">{myStanding.points}</div>
            </div>
            <div>
              <div className="text-blue-200 text-[10px] font-bold uppercase tracking-widest">{t('tournamentRecord')}</div>
              <div className="text-lg font-bold">{myStanding.wins}-{myStanding.losses}-{myStanding.draws}</div>
            </div>
            <div>
              <div className="text-blue-200 text-[10px] font-bold uppercase tracking-widest">{t('tournamentWinPercent')}</div>
              <div className="text-lg font-bold">{getWinPercentage(myStanding.wins, myStanding.losses, myStanding.draws).toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-blue-200 text-[10px] font-bold uppercase tracking-widest">{t('tournamentOMW')}</div>
              <div className="text-lg font-bold">{(myStanding.omw_percentage * 100).toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-blue-200 text-[10px] font-bold uppercase tracking-widest">{t('tournamentPossibleOpponents')}</div>
              <div className="text-xs font-medium mt-1 truncate">
                {potentialPairings.length > 0 ? potentialPairings.map((p) => p.name).join(', ') : t('tournamentNone')}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'pairings' ? (
        rounds.length === 0 ? (
          <div className="p-12 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-medium italic">{t('tournamentNoMatchesYet')}</p>
          </div>
        ) : (
          <div className="space-y-10">
            {rounds.map((round) => (
              <div key={round} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center">
                  <span className="bg-gray-800 text-white px-3 py-1 rounded-lg text-sm mr-3">{t('tournamentRound')} {round}</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {matches.filter((m) => m.round_number === round).map((match) => {
                    const isMyMatch = match.player1_id === participantId || match.player2_id === participantId;
                    const canReport = isMyMatch && !tournamentCompleted;

                    return (
                      <div key={match.id} className={`p-5 rounded-2xl border transition-all ${match.is_completed ? 'bg-white border-gray-100 opacity-60 grayscale' : 'bg-white border-blue-100 shadow-sm hover:shadow-md'}`}>
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">{t('tournamentTable')} {match.table_number || '?'}</span>
                          {match.is_completed && <span className="text-[10px] font-bold text-green-500 uppercase tracking-[0.2em]">{t('tournamentCompletedStatus')}</span>}
                        </div>
                        {match.is_bye ? (
                          <div className="text-center py-2 flex justify-center">
                            <span className="font-bold text-gray-800 text-lg">{renderPlayer(match.player1_id)}</span>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 flex justify-end pr-4 truncate font-bold text-gray-800 text-right">{renderPlayer(match.player1_id)}</div>
                              <div className="flex items-center space-x-2 bg-gray-50 border border-gray-100 px-4 py-2 rounded-xl font-mono font-black text-xl">
                                <span>{match.player1_score}</span>
                                <span className="text-gray-300">-</span>
                                <span>{match.player2_score}</span>
                              </div>
                              <div className="flex-1 flex justify-start pl-4 truncate font-bold text-gray-800 text-left">{renderPlayer(match.player2_id)}</div>
                            </div>

                            {canReport && (
                              <button
                                onClick={() => {
                                  setReportingMatch(match);
                                  setSelectedPreset([match.player1_score, match.player2_score]);
                                }}
                                className="w-full py-2 rounded-xl bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all active:scale-95"
                              >
                                {match.is_completed ? t('tournamentEditScore') : t('tournamentReportScore')}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-4 animate-in fade-in duration-500">
          <div className="grid gap-4 sm:hidden">
            {standings.map((s) => {
              const isCurrentParticipant = s.id === participantId;
              const winPercentage = getWinPercentage(s.wins, s.losses, s.draws).toFixed(1);

              return (
                <article
                  key={s.id}
                  className={`rounded-3xl border p-5 shadow-sm transition-all ${
                    isCurrentParticipant
                      ? 'border-blue-300 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-500 text-white shadow-xl shadow-blue-200 ring-2 ring-blue-200'
                      : 'border-gray-100 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isCurrentParticipant ? 'text-blue-100' : 'text-gray-400'}`}>
                        {t('tournamentRank')}
                      </div>
                      <div className={`mt-1 text-3xl font-black ${isCurrentParticipant ? 'text-white' : 'text-gray-800'}`}>#{s.rank}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isCurrentParticipant ? 'text-blue-100' : 'text-gray-400'}`}>
                        {t('tournamentPoints')}
                      </div>
                      <div className={`mt-1 text-2xl font-black ${isCurrentParticipant ? 'text-white' : 'text-blue-600'}`}>{s.points}</div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className={`truncate text-xl font-black ${isCurrentParticipant ? 'text-white' : 'text-gray-800'}`}>{s.name}</h3>
                      {isCurrentParticipant && (
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">{t('tournamentMyStatus')}</p>
                      )}
                    </div>
                    <div className="shrink-0">
                      {renderPokemonVisibility(s, true)}
                    </div>
                  </div>

                  <dl className={`mt-5 grid grid-cols-3 gap-3 rounded-2xl border p-4 ${isCurrentParticipant ? 'border-white/15 bg-white/10' : 'border-gray-100 bg-gray-50/80'}`}>
                    <div>
                      <dt className={`text-[10px] font-bold uppercase tracking-widest ${isCurrentParticipant ? 'text-blue-100' : 'text-gray-400'}`}>
                        {t('tournamentRecord')}
                      </dt>
                      <dd className={`mt-1 text-sm font-bold ${isCurrentParticipant ? 'text-white' : 'text-gray-700'}`}>{s.wins}-{s.losses}-{s.draws}</dd>
                    </div>
                    <div>
                      <dt className={`text-[10px] font-bold uppercase tracking-widest ${isCurrentParticipant ? 'text-blue-100' : 'text-gray-400'}`}>
                        {t('tournamentWinPercent')}
                      </dt>
                      <dd className={`mt-1 text-sm font-bold ${isCurrentParticipant ? 'text-white' : 'text-gray-700'}`}>{winPercentage}%</dd>
                    </div>
                    <div>
                      <dt className={`text-[10px] font-bold uppercase tracking-widest ${isCurrentParticipant ? 'text-blue-100' : 'text-gray-400'}`}>
                        {t('tournamentOMW')}
                      </dt>
                      <dd className={`mt-1 text-sm font-bold ${isCurrentParticipant ? 'text-white' : 'text-gray-700'}`}>{(s.omw_percentage * 100).toFixed(1)}%</dd>
                    </div>
                  </dl>
                </article>
              );
            })}
            {standings.length === 0 && (
              <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center text-gray-400 italic">
                {t('tournamentNoParticipants')}
              </div>
            )}
          </div>

          <div className="hidden sm:block">
            <div className="mb-2 flex items-center justify-end px-1 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
              <span>{t('commonScrollToSeeMore')}</span>
            </div>
            <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-6 bg-gradient-to-r from-white via-white/90 to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-8 bg-gradient-to-l from-white via-white/90 to-transparent" />
              <div className="overflow-x-auto">
                <table className="min-w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-[10px] font-bold uppercase tracking-widest border-b border-gray-100">
                      <th className="sticky left-0 z-10 bg-gray-50 px-6 py-4">{t('tournamentRank')}</th>
                      <th className="px-6 py-4">{t('tournamentPlayer')}</th>
                      <th className="px-6 py-4">{t('tournamentPokemon')}</th>
                      <th className="px-6 py-4">{t('tournamentPoints')}</th>
                      <th className="px-6 py-4">{t('tournamentRecord')}</th>
                      <th className="px-6 py-4 text-right">{t('tournamentWinPercent')}</th>
                      <th className="px-6 py-4 text-right">{t('tournamentOMW')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {standings.map((s) => (
                      <tr key={s.id} className={`hover:bg-blue-50/30 transition-colors ${s.id === participantId ? 'bg-blue-50/50' : ''}`}>
                        <td className={`sticky left-0 px-6 py-4 font-black text-gray-400 ${s.id === participantId ? 'bg-blue-50/50' : 'bg-white'}`}>#{s.rank}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <span className="font-bold text-gray-800">{s.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {renderPokemonVisibility(s)}
                        </td>
                        <td className="px-6 py-4 font-black text-blue-600">{s.points}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 font-medium">{s.wins}-{s.losses}-{s.draws}</td>
                        <td className="px-6 py-4 text-right font-mono text-xs font-bold text-gray-400">{getWinPercentage(s.wins, s.losses, s.draws).toFixed(1)}%</td>
                        <td className="px-6 py-4 text-right font-mono text-xs font-bold text-gray-400">{(s.omw_percentage * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                    {standings.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-400 italic">{t('tournamentNoParticipants')}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
