import React, { useState } from 'react';

interface Tournament {
  id: number;
  name: str;
  code: str;
  rounds: number;
}

export default function AdminDashboard() {
  const [name, setName] = useState('');
  const [rounds, setRounds] = useState(3);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setTournament(null);

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
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <h1 className="text-3xl font-bold text-blue-600 mb-6 uppercase tracking-wider">Admin Dashboard</h1>
      
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-100">
        <h2 className="text-xl font-semibold mb-6 text-gray-800">Create Tournament</h2>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="tournament-name" className="block text-sm font-medium text-gray-700 mb-1">Tournament Name</label>
            <input 
              id="tournament-name"
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Swiss Open #1" 
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition outline-none"
            />
          </div>
          
          <div>
            <label htmlFor="rounds-count" className="block text-sm font-medium text-gray-700 mb-1">Number of Rounds</label>
            <input 
              id="rounds-count"
              type="number" 
              min="1"
              max="10"
              value={rounds}
              onChange={(e) => setRounds(parseInt(e.target.value))}
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition outline-none"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 bg-blue-600 text-white font-bold rounded-lg transition ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700 shadow-md hover:shadow-lg active:scale-[0.98]'}`}
          >
            {loading ? 'Creating...' : 'Create New Tournament'}
          </button>
        </form>

        {error && (
          <div className="mt-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        {tournament && (
          <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-xl animate-in fade-in slide-in-from-top-4 duration-300">
            <h3 className="text-sm font-semibold text-blue-800 uppercase mb-2">Tournament Created!</h3>
            <p className="text-gray-600 text-sm mb-4">Share this code with participants:</p>
            <div className="flex items-center justify-center p-4 bg-white border border-blue-300 rounded-lg">
              <span className="text-4xl font-mono font-black text-blue-700 tracking-widest uppercase">
                {tournament.code}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
