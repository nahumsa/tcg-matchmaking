import React from 'react';
import { Link } from 'react-router-dom';

const NavigationBar: React.FC = () => {
  const lastCode = localStorage.getItem('last_tournament_code');

  return (
    <nav className="bg-indigo-600 text-white shadow-md p-4 flex flex-wrap justify-between items-center gap-3">
      <div className="flex items-center space-x-4 sm:space-x-6">
        <Link to="/" className="text-xl font-bold hover:text-indigo-100 transition">TCG Matchmaking</Link>

        <div className="flex items-center space-x-3 sm:space-x-4 border-l border-indigo-500 pl-4 sm:pl-6">
          <Link to="/admin" className="text-sm font-medium hover:text-indigo-100 transition">Dashboard</Link>
          <Link to="/join" className="text-sm font-medium hover:text-indigo-100 transition">Join</Link>
          {lastCode && (
            <Link to={`/${lastCode}`} target="_blank" className="text-sm font-medium hover:text-indigo-100 transition">Standings</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;
