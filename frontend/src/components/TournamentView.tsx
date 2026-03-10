import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { config } from '../config';
import PokemonSprite from './PokemonSprite';

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

  const participantIdStr = localStorage.getItem(`participant_id_${code}`);
  const participantId = participantIdStr ? Number.parseInt(participantIdStr, 10) : null;

  const presets: [number, number][] = [
    [2, 0],
    [2, 1],
    [1, 2],
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
        if (message.event === 'pairings_generated' || message.event === 'match_reported' || message.event === 'participant_joined') {
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
        alert(errData.detail || 'Failed to report score');
      }
    } catch (err) {
      console.error('Failed to report score', err);
      alert('Network error while reporting score');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center font-bold text-gray-500 uppercase tracking-widest animate-pulse">Loading tournament...</div>;

  const rounds = [...new Set(matches.map((m) => m.round_number))].sort((a, b) => b - a);
  const myStanding = standings.find((s) => s.id === participantId);

  const renderPlayer = (id: number | null) => {
    if (id === null) return <span className="text-gray-400">-</span>;
    const player = standings.find((s) => s.id === id);
    if (!player) return <span>Player {id}</span>;

    return (
      <div className="flex items-center space-x-2">
        <span className="font-bold">{player.name}</span>
      </div>
    );
  };

  const getPlayerName = (id: number | null) => {
    if (id === null) return '-';
    const player = standings.find((s) => s.id === id);
    return player ? player.name : `Player ${id}`;
  };

  const socketStatusClass = socketStatus === 'connected'
    ? 'bg-green-100 text-green-700'
    : socketStatus === 'reconnecting'
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-gray-100 text-gray-700';
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-8">
      {/* Reporting Modal */}
      {reportingMatch && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in duration-300">
            <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight mb-2">Report Score</h3>
            <p className="text-gray-500 text-sm mb-6 font-medium">
              Select the final score for your match against <span className="text-blue-600 font-bold">{getPlayerName(reportingMatch.player1_id === participantId ? reportingMatch.player2_id : reportingMatch.player1_id)}</span>.
            </p>

            <div className="grid gap-3 mb-8">
              {presets.map(([s1, s2]) => (
                <button
                  key={`${s1}-${s2}`}
                  onClick={() => setSelectedPreset([s1, s2])}
                  className={`py-4 rounded-2xl border-2 font-black text-xl transition-all ${selectedPreset?.[0] === s1 && selectedPreset?.[1] === s2
                    ? 'bg-blue-600 border-blue-600 text-white scale-105 shadow-lg shadow-blue-200'
                    : 'bg-white border-gray-100 text-gray-800 hover:border-blue-200'
                    }`}
                >
                  {s1} - {s2}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setReportingMatch(null); setSelectedPreset(null); }}
                className="flex-1 py-4 rounded-2xl font-bold text-gray-400 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                disabled={!selectedPreset || isSubmitting}
                onClick={handleReportSubmit}
                className="flex-1 py-4 rounded-2xl font-black text-white bg-blue-600 shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
              >
                {isSubmitting ? '...' : 'Submit Result'}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tighter">
          Tournament <span className="text-blue-600">#{code}</span>
        </h1>

        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${socketStatusClass}`}>
            {socketStatus === 'connected' ? 'Connected' : socketStatus === 'reconnecting' ? 'Reconnecting...' : 'Connecting...'}
          </span>

          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('pairings')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'pairings' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Pairings
            </button>
            <button
              onClick={() => setActiveTab('standings')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'standings' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Standings
            </button>
          </div>
        </div>
      </div>

      {participantId && myStanding && (
        <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-xl shadow-blue-200">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-1">My Status</div>
              <h2 className="text-2xl font-black uppercase tracking-tight">{myStanding.name}</h2>
            </div>
            <div className="text-right">
              <div className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-1">Current Rank</div>
              <div className="text-3xl font-black">#{myStanding.rank}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-blue-500">
            <div>
              <div className="text-blue-200 text-[10px] font-bold uppercase tracking-widest">Points</div>
              <div className="text-lg font-bold">{myStanding.points}</div>
            </div>
            <div>
              <div className="text-blue-200 text-[10px] font-bold uppercase tracking-widest">Record (W-L-D)</div>
              <div className="text-lg font-bold">{myStanding.wins}-{myStanding.losses}-{myStanding.draws}</div>
            </div>
            <div>
              <div className="text-blue-200 text-[10px] font-bold uppercase tracking-widest">OMW%</div>
              <div className="text-lg font-bold">{(myStanding.omw_percentage * 100).toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-blue-200 text-[10px] font-bold uppercase tracking-widest">Possible Opponents</div>
              <div className="text-xs font-medium mt-1 truncate">
                {potentialPairings.length > 0 ? potentialPairings.map((p) => p.name).join(', ') : 'None'}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'pairings' ? (
        rounds.length === 0 ? (
          <div className="p-12 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-medium italic">No matches yet. Waiting for the organizer to start the round.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {rounds.map((round) => (
              <div key={round} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center">
                  <span className="bg-gray-800 text-white px-3 py-1 rounded-lg text-sm mr-3">Round {round}</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {matches.filter((m) => m.round_number === round).map((match) => {
                    const isMyMatch = match.player1_id === participantId || match.player2_id === participantId;
                    const canReport = isMyMatch && !tournamentCompleted;

                    return (
                      <div key={match.id} className={`p-5 rounded-2xl border transition-all ${match.is_completed ? 'bg-white border-gray-100 opacity-60 grayscale' : 'bg-white border-blue-100 shadow-sm hover:shadow-md'}`}>
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Table {match.table_number || '?'}</span>
                          {match.is_completed && <span className="text-[10px] font-bold text-green-500 uppercase tracking-[0.2em]">Completed</span>}
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
                                {match.is_completed ? 'Edit Score' : 'Report Score'}
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
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-[10px] font-bold uppercase tracking-widest border-b border-gray-100">
                <th className="px-6 py-4">Rank</th>
                <th className="px-6 py-4">Player</th>
                <th className="px-6 py-4">Pokemon</th>
                <th className="px-6 py-4">Points</th>
                <th className="px-6 py-4">Record</th>
                <th className="px-6 py-4 text-right">OMW%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {standings.map((s) => (
                <tr key={s.id} className={`hover:bg-blue-50/30 transition-colors ${s.id === participantId ? 'bg-blue-50/50' : ''}`}>
                  <td className="px-6 py-4 font-black text-gray-400">#{s.rank}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-gray-800">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {tournamentCompleted ? (
                      <div className="flex -space-x-2">
                        <PokemonSprite pokemonId={s.pokemon_1} size="sm" />
                        <PokemonSprite pokemonId={s.pokemon_2} size="sm" />
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Hidden</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-black text-blue-600">{s.points}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-medium">{s.wins}-{s.losses}-{s.draws}</td>
                  <td className="px-6 py-4 text-right font-mono text-xs font-bold text-gray-400">{(s.omw_percentage * 100).toFixed(1)}%</td>
                </tr>
              ))}
              {standings.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">No participants yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
