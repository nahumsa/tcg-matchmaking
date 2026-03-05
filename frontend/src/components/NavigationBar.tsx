import React from 'react';
import { Link } from 'react-router-dom';

const NavigationBar: React.FC = () => {
  const lastCode = localStorage.getItem('last_tournament_code');

  return (
    <nav className="bg-indigo-600 text-white shadow-md p-4 flex justify-between items-center">
      <div className="flex items-center space-x-6">
        <Link to="/" className="text-xl font-bold hover:text-indigo-100 transition">TCG Matchmaking</Link>

        <div className="hidden sm:flex items-center space-x-4 border-l border-indigo-500 pl-6">
          <Link to="/admin" className="text-sm font-medium hover:text-indigo-100 transition">Dashboard</Link>
          {lastCode && (
            <Link to={`/${lastCode}`} target="_blank" className="text-sm font-medium hover:text-indigo-100 transition">Standings</Link>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Navigation links could go here if needed in the future */}
      </div>
    </nav>
  );
};

export default NavigationBar;
