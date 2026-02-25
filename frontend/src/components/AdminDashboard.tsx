import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ParticipantList from './ParticipantList';
import ActivityLog, { ActivityEvent } from './ActivityLog';

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
}

export default function AdminDashboard() {
  const [name, setName] = useState('');
  const [rounds, setRounds] = useState(3);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tournament) {
      fetchMatches();
      const ws = new WebSocket(`ws://localhost:8000/ws/${tournament.code}`);
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        
        // Update matches for UI state
        if (message.event === 'participant_joined' || message.event === 'match_reported' || message.event === 'pairings_generated') {
          fetchMatches();
          fetchTournament(); // Refresh tournament to get new status
        }

        // Add to activity log
        if (message.event === 'participant_joined') {
          const newEvent: ActivityEvent = {
            id: Math.random().toString(36).substr(2, 9),
            type: message.event,
            message: `${message.data.name} joined the tournament.`,
            timestamp: message.data.timestamp || new Date().toISOString()
          };
          setEvents(prev => [...prev, newEvent]);
        } else if (message.event === 'match_reported') {
          const newEvent: ActivityEvent = {
            id: Math.random().toString(36).substr(2, 9),
            type: message.event,
            message: `Match results reported.`,
            timestamp: new Date().toISOString()
          };
          setEvents(prev => [...prev, newEvent]);
        }
      };
      return () => ws.close();
    }
  }, [tournament]);

  const fetchMatches = async () => {
    if (!tournament) return;
    try {
      const response = await fetch(`http://localhost:8000/tournaments/${tournament.code}/matches`);
      if (response.ok) {
        const data = await response.json();
        setMatches(data);
      }
    } catch (err) {
      console.error('Failed to fetch matches', err);
    }
  };

  const fetchTournament = async () => {
    if (!tournament) return;
    try {
      const response = await fetch(`http://localhost:8000/tournaments/${tournament.code}`);
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
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/tournaments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, rounds }),
      });

      if (!response.ok) {
        throw new Error('Failed to create tournament');
      }

      const data = await response.json();
      setTournament(data);
      localStorage.setItem('last_tournament_code', data.code);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const generatePairings = async () => {
    if (!tournament) return;
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/tournaments/${tournament.code}/pairings`, {
        method: 'POST',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to generate pairings');
      }
      await fetchMatches();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reportResult = async (matchId: number, p1Score: number, p2Score: number) => {
    try {
      const response = await fetch(`http://localhost:8000/matches/${matchId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player1_score: p1Score, player2_score: p2Score }),
      });
      if (!response.ok) throw new Error('Failed to report result');
      await fetchMatches();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (tournament) {
    const currentRound = matches.length > 0 ? Math.max(...matches.map(m => m.round_number)) : 0;
    const roundMatches = matches.filter(m => m.round_number === currentRound);
    const allCompleted = roundMatches.every(m => m.is_completed);
    const isTournamentFinished = tournament.status === 'COMPLETED';

    const handleExport = async () => {
      try {
        const response = await fetch(`http://localhost:8000/tournaments/${tournament.code}/standings`);
        if (response.ok) {
          const standings = await response.json();
          const summary = standings.map((s: any) => 
            `${s.rank}. ${s.name} (${s.points} pts, ${s.wins}-${s.losses}-${s.draws})`
          ).join('\n');
          
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
        <div className="flex flex-col md:flex-row flex-1 p-4 sm:p-8 space-y-8 md:space-y-0 md:space-x-8">
          <div className="flex-1 max-w-4xl">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h1 className="text-4xl font-black text-gray-800 uppercase tracking-tighter mb-2">{tournament.name}</h1>
                <div className="flex items-center space-x-4">
                  <span className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-bold tracking-widest uppercase">{tournament.code}</span>
                  <Link to={`/${tournament.code}`} target="_blank" className="text-blue-600 hover:underline text-sm font-medium">Public View ↗</Link>
                </div>
              </div>
              <button
                onClick={generatePairings}
                disabled={loading || (currentRound > 0 && !allCompleted) || isTournamentFinished}
                className="py-3 px-6 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {currentRound === 0 ? 'Start Round 1' : 'Next Round'}
              </button>
            </div>

            {isTournamentFinished && (
              <div className="mb-8 p-6 bg-green-600 rounded-2xl text-white shadow-xl shadow-green-100 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">Tournament Completed</h2>
                  <p className="text-green-100 font-medium">All rounds have been played and results are finalized.</p>
                </div>
                <div className="flex space-x-4">
                  <button 
                    onClick={handleExport}
                    className="px-6 py-2 bg-green-700 text-white font-bold rounded-lg hover:bg-green-800 transition"
                  >
                    Export Results
                  </button>
                  <Link to={`/${tournament.code}`} className="px-6 py-2 bg-white text-green-700 font-bold rounded-lg hover:bg-green-50 transition">
                    View Final Standings
                  </Link>
                </div>
              </div>
            )}

            {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl">{error}</div>}

            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-700">Current Round: {currentRound}</h2>
              <div className="grid gap-4">
                {roundMatches.length === 0 ? (
                  <p className="text-gray-400 italic">No matches generated yet. Start the round to begin.</p>
                ) : (
                  roundMatches.map(match => (
                    <div key={match.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                      <div className="flex-1 font-bold text-lg">Player {match.player1_id}</div>

                      {match.is_bye ? (
                        <div className="px-8 font-black text-blue-600 uppercase tracking-widest">BYE</div>
                      ) : (match.is_completed || isTournamentFinished) ? (
                        <div className="flex items-center space-x-4 px-8">
                          <span className="text-2xl font-black">{match.player1_score}</span>
                          <span className="text-gray-300">-</span>
                          <span className="text-2xl font-black">{match.player2_score}</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 px-4">
                          <input type="number" id={`p1-${match.id}`} className="w-16 p-2 border rounded text-center font-bold" defaultValue={0} />
                          <span className="text-gray-300">-</span>
                          <input type="number" id={`p2-${match.id}`} className="w-16 p-2 border rounded text-center font-bold" defaultValue={0} />
                          <button
                            onClick={() => {
                              const s1 = (document.getElementById(`p1-${match.id}`) as HTMLInputElement).value;
                              const s2 = (document.getElementById(`p2-${match.id}`) as HTMLInputElement).value;
                              reportResult(match.id, parseInt(s1), parseInt(s2));
                            }}
                            className="ml-4 px-4 py-2 bg-gray-800 text-white text-sm font-bold rounded-lg hover:bg-black transition"
                          >
                            Report
                          </button>
                        </div>
                      )}

                      <div className="flex-1 font-bold text-lg text-right">{match.is_bye ? '-' : `Player ${match.player2_id}`}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          
          <div className="w-full md:w-80 lg:w-96 space-y-8">
            <ParticipantList tournamentCode={tournament.code} />
            <ActivityLog events={events} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <h1 className="text-3xl font-bold text-blue-600 mb-6 uppercase tracking-wider">Admin Dashboard</h1>
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-100">
        <h2 className="text-xl font-semibold mb-6 text-gray-800">Create Tournament</h2>
        <form onSubmit={handleCreateTournament} className="space-y-5">
          <div>
            <label htmlFor="tournament-name" className="block text-sm font-medium text-gray-700 mb-1">Tournament Name</label>
            <input id="tournament-name" type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Swiss Open #1" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition outline-none" />
          </div>
          <div>
            <label htmlFor="rounds-count" className="block text-sm font-medium text-gray-700 mb-1">Number of Rounds</label>
            <input id="rounds-count" type="number" min="1" max="10" value={rounds} onChange={(e) => setRounds(parseInt(e.target.value))} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition outline-none" />
          </div>
          <button type="submit" disabled={loading} className={`w-full py-3 px-4 bg-blue-600 text-white font-bold rounded-lg transition ${loading ? 'opacity-50' : 'hover:bg-blue-700 shadow-md'}`}>
            {loading ? 'Creating...' : 'Create New Tournament'}
          </button>
        </form>
        {error && <div className="mt-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>}
      </div>
    </div>
  );
}
