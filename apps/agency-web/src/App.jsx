import React,{Suspense,lazy} from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import NavbarComponent from './components/Navbar';
import UnifiedLoginRedirect from './components/UnifiedLoginRedirect';
import AuthHandoff from './components/AuthHandoff';
const Register=lazy(()=>import('./pages/Register'));
const DashboardSuperAdmin=lazy(()=>import('./pages/DashboardSuperAdmin'));
const DashboardAdmin=lazy(()=>import('./pages/DashboardAdmin'));
const DashboardTechnician=lazy(()=>import('./pages/DashboardTechnician'));
const UploadExcel=lazy(()=>import('./pages/UploadExcel'));
const FieldVerification=lazy(()=>import('./pages/FieldVerification'));
import UserLocationTracker from './components/UserLocationTracker';
import ResilienceStatus from './components/ResilienceStatus';
import {installAgencyAxiosResilience} from './resilientAxios';
import './final-design-system.css';
installAgencyAxiosResilience();

const ProtectedRoute = ({ children }) => {
  const active = localStorage.getItem('opsynq_agency_session')==='1'||Boolean(localStorage.getItem('token'));
  return active ? <><UserLocationTracker />{children}</> : <Navigate to="/" />;
};

const Router = import.meta.env.PROD ? HashRouter : BrowserRouter;

const App = () => {
  return (
    <Router>
      <div className="d-flex flex-column min-vh-100"><ResilienceStatus />
        <NavbarComponent />
        <div className="app-content flex-grow-1">
          <Suspense fallback={<div className="agency-route-loader"><span/><b>Loading workspace…</b><small>Preparing the latest operational view.</small></div>}>
          <Routes>
            <Route path="/" element={<UnifiedLoginRedirect />} />
            <Route path="/auth/handoff" element={<AuthHandoff />} />
            <Route path="/register" element={<ProtectedRoute><Register /></ProtectedRoute>} />
            <Route path="/dashboard/superadmin" element={<ProtectedRoute><DashboardSuperAdmin /></ProtectedRoute>} />
            <Route path="/dashboard/admin" element={<ProtectedRoute><DashboardAdmin /></ProtectedRoute>} />
            <Route path="/dashboard/technician" element={<ProtectedRoute><DashboardTechnician /></ProtectedRoute>} />
            <Route path="/upload" element={<ProtectedRoute><UploadExcel /></ProtectedRoute>} />
            <Route path="/field-verification" element={<ProtectedRoute><FieldVerification /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to={(localStorage.getItem('opsynq_agency_session')==='1'||localStorage.getItem('token'))?(localStorage.getItem('userRole')==='superadmin'?'/dashboard/superadmin':localStorage.getItem('userRole')==='admin'?'/dashboard/admin':'/dashboard/technician'):'/'} replace />} />
          </Routes>
          </Suspense>
        </div>
      </div>
    </Router>
  );
};

export default App;
