import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import AdminDashboard from './components/AdminDashboard';
import ParticipantJoin from './components/ParticipantJoin';
import TournamentView from './components/TournamentView';
import LandingPage from './components/LandingPage';
import NavigationBar from './components/NavigationBar';
import { LanguageProvider } from './i18n';

function RedirectToTournament() {
  const { code } = useParams();
  return <Navigate to={`/tournament/${code}`} replace />;
}

function App() {
  return (
    <LanguageProvider>
    <Router>
      <div className="min-h-screen bg-gray-50">
        <NavigationBar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/join" element={<ParticipantJoin />} />
          <Route path="/tournament/:code" element={<TournamentView />} />
          {/* Legacy redirect for old links */}
          <Route path="/:code" element={<RedirectToTournament />} />
        </Routes>
      </div>
    </Router>
    </LanguageProvider>
  );
}
export default App;
