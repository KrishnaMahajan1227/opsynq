import React, { useEffect, useMemo, useState } from 'react';
import { Spinner } from 'react-bootstrap';
import io from 'socket.io-client';
import axios from 'axios';
import { API_URL } from '../config';

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_SERVER_URL || (import.meta.env.VITE_API_URL || 'http://localhost:3000');

const roleLabel = (role) => role === 'field_technician' ? 'Technician' : role === 'superadmin' ? 'Superadmin' : role === 'admin' ? 'Admin' : 'User';
const timeAgo = (value) => {
  if (!value) return 'No update';
  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Live now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return hrs < 24 ? `${hrs}h ago` : `${Math.floor(hrs / 24)}d ago`;
};

async function reverseGeocode(lat, lng) {
  if (!GOOGLE_API_KEY || !Number.isFinite(lat) || !Number.isFinite(lng)) return '';
  try {
    const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`);
    const data = await res.json();
    return data?.results?.[0]?.formatted_address || '';
  } catch { return ''; }
}

const TechLocationMonitor = () => {
  const [locations, setLocations] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const token = localStorage.getItem('token');
    axios.get(`${API_URL}/api/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => {
        if (!mounted) return;
        const initial = {};
        (Array.isArray(data) ? data : []).forEach((u) => {
          if (u.lastLocation?.latitude != null && u.lastLocation?.longitude != null) {
            initial[u._id] = {
              userId: u._id, username: u.username, mobile: u.mobile, role: u.role,
              latitude: u.lastLocation.latitude, longitude: u.lastLocation.longitude,
              accuracy: u.lastLocation.accuracy, address: u.lastLocation.address,
              timestamp: u.lastLocation.capturedAt || u.lastLocation.updatedAt,
            };
          }
        });
        setLocations(initial);
      })
      .finally(() => mounted && setLoading(false));

    const socket = io(SOCKET_SERVER_URL, { transports: ['websocket', 'polling'], auth: { token: localStorage.getItem('token') } });
    const onStatus = async (data) => {
      if (!data?.userId && !data?.technicianId) return;
      const key = data.userId || data.technicianId;
      const address = data.address || await reverseGeocode(Number(data.latitude), Number(data.longitude));
      setLocations((prev) => ({ ...prev, [key]: { ...data, address } }));
    };
    socket.on('userStatus', onStatus);
    socket.on('techStatus', onStatus);
    return () => { mounted = false; socket.disconnect(); };
  }, []);

  const rows = useMemo(() => Object.values(locations).sort((a,b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0)), [locations]);

  return (
    <section className="presence-panel">
      <div className="presence-panel__head">
        <div><strong>User location presence</strong><span>Latest available position for every signed-in ERP user</span></div>
        <span className="presence-count">{rows.length} located</span>
      </div>
      {loading ? <div className="presence-empty"><Spinner size="sm" /> Loading locations…</div> : rows.length === 0 ? (
        <div className="presence-empty">No location received yet. Location appears after the user grants browser permission.</div>
      ) : (
        <div className="presence-list">
          {rows.slice(0, 12).map((u) => (
            <div className="presence-row" key={u.userId || u.technicianId}>
              <div className="presence-avatar">{String(u.username || 'U').slice(0,1).toUpperCase()}</div>
              <div className="presence-main"><strong>{u.username || 'Unknown user'}</strong><span>{roleLabel(u.role)} · {u.mobile || u.technicianMobile || '—'}</span></div>
              <div className="presence-place"><strong>{u.address || `${Number(u.latitude).toFixed(4)}, ${Number(u.longitude).toFixed(4)}`}</strong><span>{u.accuracy ? `±${Math.round(u.accuracy)}m` : 'Accuracy unavailable'}</span></div>
              <div className="presence-time">{timeAgo(u.timestamp)}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default TechLocationMonitor;
