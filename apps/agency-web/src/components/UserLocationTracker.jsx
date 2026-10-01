import React, { useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { API_URL, SOCKET_REALTIME_ENABLED, SOCKET_SERVER_URL } from '../config';

const ACCURACY_THRESHOLD = 120;
const MIN_EMIT_INTERVAL = 30000;

const UserLocationTracker = () => {
  const lastEmitRef = useRef(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const mobile = localStorage.getItem('userMobile') || localStorage.getItem('technicianMobile');
    const username = localStorage.getItem('username') || 'User';
    const role = localStorage.getItem('userRole') || 'user';
    if (!token || (!userId && !mobile) || !navigator.geolocation) return undefined;

    const auth = { headers: { Authorization: `Bearer ${token}` } };
    const socket = SOCKET_REALTIME_ENABLED && SOCKET_SERVER_URL
      ? io(SOCKET_SERVER_URL, { withCredentials: true, transports: ['websocket'], auth: { token } })
      : null;

    const persistPosition = async (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      const now = Date.now();
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
      if (accuracy > ACCURACY_THRESHOLD && lastEmitRef.current) return;
      if (now - lastEmitRef.current < MIN_EMIT_INTERVAL) return;
      lastEmitRef.current = now;
      const payload = { userId, mobile, technicianMobile: mobile, username, role, latitude, longitude, accuracy: Math.round(accuracy || 0), capturedAt: new Date(now).toISOString(), timestamp: now };
      try {
        await axios.post(`${API_URL}/api/users/me/location`, payload, auth);
        socket?.emit('userStatus', payload);
      } catch {
        // Location is advisory; the next watch callback retries without blocking the UI.
      }
    };

    const watchId = navigator.geolocation.watchPosition(persistPosition, () => {}, { enableHighAccuracy: true, timeout: 15000, maximumAge: 15000 });
    return () => { navigator.geolocation.clearWatch(watchId); socket?.disconnect(); };
  }, []);

  return null;
};

export default UserLocationTracker;
