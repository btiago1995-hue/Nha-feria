import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import WorkerDashboard from './pages/WorkerDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import EmployeeDirectory from './pages/EmployeeDirectory';
import LeaveRequestForm from './pages/LeaveRequestForm';
import ManagerCalendar from './pages/ManagerCalendar';
import Compliance from './pages/Compliance';
import MainLayout from './components/layout/MainLayout';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route element={<MainLayout />}>
          <Route path="/worker-dashboard" element={<WorkerDashboard />} />
          <Route path="/manager-dashboard" element={<ManagerDashboard />} />
          <Route path="/worker-leaves" element={<LeaveRequestForm />} />
          <Route path="/team" element={<EmployeeDirectory />} />
          <Route path="/manager-calendar" element={<ManagerCalendar />} />
          <Route path="/compliance" element={<Compliance />} />
          
          {/* Default redirect after login/root within layout */}
          <Route path="/dashboard" element={<Navigate to="/worker-dashboard" replace />} />
          <Route path="/profile" element={<Navigate to="/worker-dashboard" replace />} />
          <Route path="/settings" element={<Navigate to="/worker-dashboard" replace />} />
          
          {/* Future routes:
          <Route path="/manager-calendar" element={<ManagerCalendar />} />
          <Route path="/compliance" element={<Compliance />} />
          <Route path="/settings" element={<Settings />} />
          */}
        </Route>

        {/* Global Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
