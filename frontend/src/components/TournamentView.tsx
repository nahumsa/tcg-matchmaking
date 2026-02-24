import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

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

export default function TournamentView() {
  const { code } = useParams<{ code: string }>();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches();

    const ws = new WebSocket(`ws://localhost:8000/ws/${code}`);

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('WS Message:', message);
      if (message.event === 'pairings_generated' || message.event === 'match_reported') {
        fetchMatches();
      }
    };

    return () => ws.close();
  }, [code]);

  const fetchMatches = async () => {
    try {
      const response = await fetch(`http://localhost:8000/tournaments/${code}/matches`);
      if (response.ok) {
        const data = await response.json();
        setMatches(data);
      }
    } catch (err) {
      console.error('Failed to fetch matches', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading tournament...</div>;

  const rounds = [...new Set(matches.map(m => m.round_number))].sort((a, b) => b - a);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8">
      <h1 className="text-3xl font-black text-gray-800 mb-8 uppercase tracking-tighter">
        Tournament <span className="text-blue-600">#{code}</span>
      </h1>

      {rounds.length === 0 ? (
        <div className="p-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <p className="text-gray-400 font-medium">No matches yet. Waiting for the organizer to start the round.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {rounds.map(round => (
            <div key={round} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center">
                <span className="bg-gray-800 text-white px-3 py-1 rounded-md text-sm mr-3">Round {round}</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {matches.filter(m => m.round_number === round).map(match => (
                  <div key={match.id} className={`p-4 rounded-xl border ${match.is_completed ? 'bg-white border-gray-200 opacity-75' : 'bg-white border-blue-200 shadow-sm'}`}>
                    {match.is_bye ? (
                      <div className="text-center py-2">
                        <span className="text-xs font-bold text-blue-500 uppercase tracking-widest block mb-1">Bye</span>
                        <span className="font-semibold text-gray-800">Player {match.player1_id}</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1 text-right pr-4">
                          <span className="font-semibold text-gray-800">Player {match.player1_id}</span>
                        </div>
                        <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-lg font-mono font-bold text-lg">
                          <span>{match.player1_score}</span>
                          <span className="text-gray-400">-</span>
                          <span>{match.player2_score}</span>
                        </div>
                        <div className="flex-1 text-left pl-4">
                          <span className="font-semibold text-gray-800">Player {match.player2_id}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
