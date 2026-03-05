import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { config } from '../config';

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
}

interface PotentialPairing {
  id: number;
  name: string;
  points: number;
}

export default function TournamentView() {
  const { code } = useParams<{ code: string }>();
  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [potentialPairings, setPotentialPairings] = useState<PotentialPairing[]>([]);
  const [activeTab, setActiveTab] = useState<'pairings' | 'standings'>('pairings');
  const [loading, setLoading] = useState(true);

  const participantIdStr = localStorage.getItem(`participant_id_${code}`);
  const participantId = participantIdStr ? parseInt(participantIdStr) : null;

  useEffect(() => {
    fetchData();

    const ws = new WebSocket(`${config.wsUrl}/ws/${code}`);

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.event === 'pairings_generated' || message.event === 'match_reported' || message.event === 'participant_joined') {
        fetchData();
      }
    };

    return () => ws.close();
  }, [code]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    try {
      const [matchesRes, standingsRes] = await Promise.all([
        fetch(`${config.apiUrl}/tournaments/${code}/matches`),
        fetch(`${config.apiUrl}/tournaments/${code}/standings`)
      ]);

      if (matchesRes.ok) {
        const data = await matchesRes.json();
        setMatches(data);
      }

      if (standingsRes.ok) {
        const data = await standingsRes.json();
        setStandings(data);
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

  if (loading) return <div className="p-8 text-center font-bold text-gray-500 uppercase tracking-widest animate-pulse">Loading tournament...</div>;

  const rounds = [...new Set(matches.map(m => m.round_number))].sort((a, b) => b - a);
  const myStanding = standings.find(s => s.id === participantId);

  const getPlayerName = (id: number | null) => {
    if (id === null) return '-';
    const player = standings.find(s => s.id === id);
    return player ? player.name : `Player ${id}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tighter">
          Tournament <span className="text-blue-600">#{code}</span>
        </h1>

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
                {potentialPairings.length > 0 ? potentialPairings.map(p => p.name).join(', ') : 'None'}
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
            {rounds.map(round => (
              <div key={round} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center">
                  <span className="bg-gray-800 text-white px-3 py-1 rounded-lg text-sm mr-3">Round {round}</span>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {matches.filter(m => m.round_number === round).map(match => (
                    <div key={match.id} className={`p-5 rounded-2xl border transition-all ${match.is_completed ? 'bg-white border-gray-100 opacity-60 grayscale' : 'bg-white border-blue-100 shadow-sm hover:shadow-md'}`}>
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Table {match.table_number || '?'}</span>
                        {match.is_completed && <span className="text-[10px] font-bold text-green-500 uppercase tracking-[0.2em]">Completed</span>}
                      </div>
                      {match.is_bye ? (
                        <div className="text-center py-2">
                          <span className="font-bold text-gray-800 text-lg">{getPlayerName(match.player1_id)}</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex-1 text-right pr-4 truncate font-bold text-gray-800">{getPlayerName(match.player1_id)}</div>
                          <div className="flex items-center space-x-2 bg-gray-50 border border-gray-100 px-4 py-2 rounded-xl font-mono font-black text-xl">
                            <span>{match.player1_score}</span>
                            <span className="text-gray-300">-</span>
                            <span>{match.player2_score}</span>
                          </div>
                          <div className="flex-1 text-left pl-4 truncate font-bold text-gray-800">{getPlayerName(match.player2_id)}</div>
                        </div>
                      )}
                    </div>
                  ))}
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
                <th className="px-6 py-4">Points</th>
                <th className="px-6 py-4">Record</th>
                <th className="px-6 py-4 text-right">OMW%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {standings.map((s) => (
                <tr key={s.id} className={`hover:bg-blue-50/30 transition-colors ${s.id === participantId ? 'bg-blue-50/50' : ''}`}>
                  <td className="px-6 py-4 font-black text-gray-400">#{s.rank}</td>
                  <td className="px-6 py-4 font-bold text-gray-800">{s.name}</td>
                  <td className="px-6 py-4 font-black text-blue-600">{s.points}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-medium">{s.wins}-{s.losses}-{s.draws}</td>
                  <td className="px-6 py-4 text-right font-mono text-xs font-bold text-gray-400">{(s.omw_percentage * 100).toFixed(1)}%</td>
                </tr>
              ))}
              {standings.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">No participants yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
