import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminDashboard from './components/AdminDashboard';
import ParticipantJoin from './components/ParticipantJoin';
import TournamentView from './components/TournamentView';
import LandingPage from './components/LandingPage';
import NavigationBar from './components/NavigationBar';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <NavigationBar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/join" element={<ParticipantJoin />} />
          <Route path="/:code" element={<TournamentView />} />
        </Routes>
      </div>
    </Router>
  );
}
export default App;
