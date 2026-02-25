import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './components/AdminDashboard';
import ParticipantJoin from './components/ParticipantJoin';
import TournamentView from './components/TournamentView';
import { RoleProvider } from './context/RoleContext';
import NavigationBar from './components/NavigationBar';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <RoleProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <NavigationBar />
          <Routes>
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute allowedRole="ADMIN" redirectTo="/join">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/join" 
              element={
                <ProtectedRoute allowedRole="PLAYER" redirectTo="/admin">
                  <ParticipantJoin />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/:code" 
              element={
                <ProtectedRoute allowedRole="PLAYER" redirectTo="/admin">
                  <TournamentView />
                </ProtectedRoute>
              } 
            />
            <Route path="/" element={<Navigate to="/join" replace />} />
          </Routes>
        </div>
      </Router>
    </RoleProvider>
  );
}

export default App;
