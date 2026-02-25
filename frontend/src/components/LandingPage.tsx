import React from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useRole } from '../context/RoleContext';

const LandingPage: React.FC = () => {
  const { role, setRole } = useRole();
  const navigate = useNavigate();

  // Smart Redirect: If a role is already set, don't show the landing page
  if (role === 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }
  if (role === 'PLAYER') {
    return <Navigate to="/join" replace />;
  }

  const handleChoice = (choice: 'ADMIN' | 'PLAYER') => {
    setRole(choice);
    if (choice === 'ADMIN') {
      navigate('/admin');
    } else {
      navigate('/join');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-4 bg-gray-50">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-indigo-700 mb-4 tracking-tight">
          Welcome to TCG Matchmaking
        </h1>
        <p className="text-lg text-gray-600 max-w-md mx-auto">
          Please select your role to continue. You can always change this later in the navigation bar.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-2xl">
        <button
          onClick={() => handleChoice('ADMIN')}
          className="group flex flex-col items-center p-10 bg-white rounded-2xl shadow-lg border-2 border-transparent hover:border-indigo-500 transition-all hover:scale-105"
        >
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-indigo-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-600 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Administrator</h2>
          <p className="text-gray-500 text-center">Create tournaments, manage participants, and pair rounds.</p>
        </button>

        <button
          onClick={() => handleChoice('PLAYER')}
          className="group flex flex-col items-center p-10 bg-white rounded-2xl shadow-lg border-2 border-transparent hover:border-green-500 transition-all hover:scale-105"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-green-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Player</h2>
          <p className="text-gray-500 text-center">Join tournaments via code, view pairings, and report scores.</p>
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
