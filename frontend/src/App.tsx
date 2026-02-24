import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './components/AdminDashboard';
import ParticipantJoin from './components/ParticipantJoin';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/join" element={<ParticipantJoin />} />
        <Route path="/" element={<Navigate to="/join" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
