import React, { useEffect, useState } from 'react';
import * as Sentry from '@sentry/react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
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
import UpgradePage from './pages/UpgradePage';
import PaymentResult from './pages/PaymentResult';
import MainLayout from './components/layout/MainLayout';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfUse from './pages/TermsOfUse';
import ContactPage from './pages/ContactPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import SetupCompany from './pages/SetupCompany';
import ManagerRequests from './pages/ManagerRequests';
import IlhasHubPage from './pages/IlhasHubPage';
import IlhaSpokePage from './pages/IlhaSpokePage';

// Redirects authenticated users straight to dashboard, skipping the landing page
function RootRedirect() {
  const [checking, setChecking] = useState(true);
  const [destination, setDestination] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setDestination('landing'); setChecking(false); return; }
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', session.user.id).single();
      const role = profile?.role;
      setDestination(role === 'manager' || role === 'admin' ? '/manager-dashboard' : '/worker-dashboard');
      setChecking(false);
    });
  }, []);

  if (checking) return null; // brief flash-free wait
  if (destination === 'landing') return <LandingPage />;
  return <Navigate to={destination} replace />;
}

function App() {
  return (
    <Sentry.ErrorBoundary fallback={<p style={{ padding: '2rem' }}>Something went wrong. Please refresh the page.</p>}>
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/invite/:token" element={<InvitePage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfUse />} />
        <Route path="/contacto" element={<ContactPage />} />
        <Route path="/payment/result" element={<PaymentResult />} />
        <Route path="/setup-company" element={<SetupCompany />} />
        <Route path="/ilhas" element={<IlhasHubPage />} />
        <Route path="/ilhas/:ilha" element={<IlhaSpokePage />} />

        {/* Protected Routes */}
        <Route element={<MainLayout />}>
          <Route path="/worker-dashboard" element={<WorkerDashboard />} />
          <Route path="/manager-dashboard" element={<ManagerDashboard />} />
          <Route path="/worker-leaves" element={<WorkerLeaves />} />
          <Route path="/team" element={<EmployeeDirectory />} />
          <Route path="/manager-calendar" element={<ManagerCalendar />} />
          <Route path="/manager-requests" element={<ManagerRequests />} />
          <Route path="/compliance" element={<Compliance />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/upgrade" element={<UpgradePage />} />

          {/* Default redirect */}
          <Route path="/dashboard" element={<Navigate to="/worker-dashboard" replace />} />
        </Route>

        {/* Global Redirects */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
    </Sentry.ErrorBoundary>
  );
}

export default App;
