import React,{Suspense} from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import NavbarComponent from './components/Navbar';
import UnifiedLoginRedirect from './components/UnifiedLoginRedirect';
import AuthHandoff from './components/AuthHandoff';
import {lazyWithRetry} from './lazyLoad';
const Register=lazyWithRetry(()=>import('./pages/Register'),'Register');
const DashboardSuperAdmin=lazyWithRetry(()=>import('./pages/DashboardSuperAdmin'),'DashboardSuperAdmin');
const DashboardAdmin=lazyWithRetry(()=>import('./pages/DashboardAdmin'),'DashboardAdmin');
const DashboardTechnician=lazyWithRetry(()=>import('./pages/DashboardTechnician'),'DashboardTechnician');
const UploadExcel=lazyWithRetry(()=>import('./pages/UploadExcel'),'UploadExcel');
const FieldVerification=lazyWithRetry(()=>import('./pages/FieldVerification'),'FieldVerification');
import UserLocationTracker from './components/UserLocationTracker';
import ResilienceStatus from './components/ResilienceStatus';
import {installAgencyAxiosResilience} from './resilientAxios';
import './final-design-system.css';
import './agency-enterprise-v2.css';
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
