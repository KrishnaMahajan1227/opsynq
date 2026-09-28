import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import NavbarComponent from './components/Navbar';
import UnifiedLoginRedirect from './components/UnifiedLoginRedirect';
import AuthHandoff from './components/AuthHandoff';
import Register from './pages/Register';
import DashboardSuperAdmin from './pages/DashboardSuperAdmin';
import DashboardAdmin from './pages/DashboardAdmin';
import DashboardTechnician from './pages/DashboardTechnician';
import UploadExcel from './pages/UploadExcel';
import FieldVerification from './pages/FieldVerification';
import UserLocationTracker from './components/UserLocationTracker';
import ResilienceStatus from './components/ResilienceStatus';
import {installAgencyAxiosResilience} from './resilientAxios';
installAgencyAxiosResilience();

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? <><UserLocationTracker />{children}</> : <Navigate to="/" />;
};

const App = () => {
  return (
    <Router>
      <div className="d-flex flex-column min-vh-100"><ResilienceStatus />
        <NavbarComponent />
        <div className="app-content flex-grow-1">
          <Routes>
            <Route path="/" element={<UnifiedLoginRedirect />} />
            <Route path="/auth/handoff" element={<AuthHandoff />} />
            <Route path="/register" element={<ProtectedRoute><Register /></ProtectedRoute>} />
            <Route path="/dashboard/superadmin" element={<ProtectedRoute><DashboardSuperAdmin /></ProtectedRoute>} />
            <Route path="/dashboard/admin" element={<ProtectedRoute><DashboardAdmin /></ProtectedRoute>} />
            <Route path="/dashboard/technician" element={<ProtectedRoute><DashboardTechnician /></ProtectedRoute>} />
            <Route path="/upload" element={<ProtectedRoute><UploadExcel /></ProtectedRoute>} />
            <Route path="/field-verification" element={<ProtectedRoute><FieldVerification /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to={localStorage.getItem('token')?(localStorage.getItem('userRole')==='superadmin'?'/dashboard/superadmin':localStorage.getItem('userRole')==='admin'?'/dashboard/admin':'/dashboard/technician'):'/'} replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
