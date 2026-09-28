import React, { useEffect } from 'react';

export default function UnifiedLoginRedirect() {
  useEffect(() => {
    const configured = import.meta.env.VITE_PLATFORM_APP_URL;
    const platformBase = configured || (import.meta.env.PROD?window.location.origin:`${window.location.protocol}//${window.location.hostname || 'localhost'}:5173`);
    window.location.replace(`${platformBase}/?login=1`);
  }, []);
  return <div className="agency-auth-transition"><div className="agency-auth-spinner"/><strong>Opening secure Opsynq sign-in…</strong><span>Platform, Company and Agency access use one login.</span></div>;
}
