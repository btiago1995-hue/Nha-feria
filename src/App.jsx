import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import InvitePage from './pages/InvitePage';
import WorkerDashboard from './pages/WorkerDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import EmployeeDirectory from './pages/EmployeeDirectory';
import WorkerLeaves from './pages/WorkerLeaves';
import ManagerCalendar from './pages/ManagerCalendar';
import Compliance from './pages/Compliance';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import MainLayout from './components/layout/MainLayout';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfUse from './pages/TermsOfUse';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/invite/:token" element={<InvitePage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfUse />} />

        {/* Protected Routes */}
        <Route element={<MainLayout />}>
          <Route path="/worker-dashboard" element={<WorkerDashboard />} />
          <Route path="/manager-dashboard" element={<ManagerDashboard />} />
          <Route path="/worker-leaves" element={<WorkerLeaves />} />
          <Route path="/team" element={<EmployeeDirectory />} />
          <Route path="/manager-calendar" element={<ManagerCalendar />} />
          <Route path="/compliance" element={<Compliance />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* Default redirect */}
          <Route path="/dashboard" element={<Navigate to="/worker-dashboard" replace />} />
        </Route>

        {/* Global Redirects */}
        <Route path="/" element={<LandingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
