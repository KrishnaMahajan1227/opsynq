import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';

const normalizeRole = (role) => role?.toLowerCase()?.replace(/[-_\s]/g, '');
const targetFor = (role) => {
  const normalized = normalizeRole(role);
  if (normalized === 'fieldtechnician') return '/dashboard/technician';
  if (normalized === 'superadmin') return '/dashboard/superadmin';
  return '/dashboard/admin';
};

export default function AuthHandoff() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const code = params.get('code');
    if (!code) { setError('Secure sign-in handoff is missing.'); return undefined; }
    axios.post(`${API_URL}/api/unified-auth/agency-handoff/exchange`, { code })
      .then(({ data }) => {
        if (!active) return;
        localStorage.setItem('token', data.token);
        localStorage.setItem('userRole', data.user.role);
        localStorage.setItem('username', data.user.username || data.user.mobile);
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('userMobile', data.user.mobile);
        if (normalizeRole(data.user.role) === 'fieldtechnician') localStorage.setItem('technicianMobile', data.user.mobile);
        navigate(targetFor(data.user.role), { replace: true });
      })
      .catch((err) => { if (active) setError(err.response?.data?.message || 'Secure sign-in could not be completed.'); });
    return () => { active = false; };
  }, [params, navigate]);

  if (error) {
    const configured = import.meta.env.VITE_PLATFORM_APP_URL;
    const platformBase = configured || `${window.location.protocol}//${window.location.hostname || 'localhost'}:5173`;
    return <div className="agency-auth-transition is-error"><strong>Sign-in session expired</strong><span>{error}</span><button onClick={() => window.location.replace(`${platformBase}/?login=1`)}>Return to secure sign-in</button></div>;
  }
  return <div className="agency-auth-transition"><div className="agency-auth-spinner"/><strong>Opening Agency Operations…</strong><span>Verifying your secure workspace session.</span></div>;
}
