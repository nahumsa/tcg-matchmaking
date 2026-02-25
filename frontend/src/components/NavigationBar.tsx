import React from 'react';
import { useRole, UserRole } from '../context/RoleContext';

const NavigationBar: React.FC = () => {
  const { role, setRole } = useRole();

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRole(e.target.value as UserRole);
  };

  return (
    <nav className="bg-indigo-600 text-white shadow-md p-4 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-bold">TCG Matchmaking</h1>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex flex-col items-end mr-2">
                    <span className="text-xs opacity-75 uppercase tracking-wider font-semibold">Current Role</span>
                    <span className="text-sm font-bold">Role: {role || 'NOT SET'}</span>
                  </div>
                  
                  <div className="relative">
                    <select
                      value={role || ''}
                      onChange={handleRoleChange}
                      className="bg-indigo-700 text-white text-sm rounded-lg block w-full p-2.5 border border-indigo-500 focus:ring-indigo-400 focus:border-indigo-400 cursor-pointer"
                      aria-label="Select Role"
                    >
                      <option value="" disabled>Choose Role...</option>
                      <option value="PLAYER">Player</option>
                      <option value="ADMIN">Administrator</option>
                    </select>
                  </div>
          
      </div>
    </nav>
  );
};

export default NavigationBar;
