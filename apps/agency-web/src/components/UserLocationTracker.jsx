import React, { useEffect, useRef } from 'react';
import io from 'socket.io-client';

const SOCKET_SERVER_URL = String(import.meta.env.VITE_SOCKET_SERVER_URL||'').replace(/\/$/,'')||(String(import.meta.env.VITE_API_URL||'').replace(/\/$/,'')||(import.meta.env.PROD?'':'http://localhost:3000'));
const ACCURACY_THRESHOLD = 120;
const MIN_EMIT_INTERVAL = 30000;

const UserLocationTracker = () => {
  const socketRef = useRef(null);
  const lastEmitRef = useRef(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const mobile = localStorage.getItem('userMobile') || localStorage.getItem('technicianMobile');
    const username = localStorage.getItem('username') || 'User';
    const role = localStorage.getItem('userRole') || 'user';
    if (!token || (!userId && !mobile) || !navigator.geolocation) return undefined;

    const socket = io(SOCKET_SERVER_URL, { transports: ['websocket', 'polling'], auth: { token: localStorage.getItem('token') } });
    socketRef.current = socket;

    const emitPosition = (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      const now = Date.now();
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
      if (accuracy > ACCURACY_THRESHOLD && lastEmitRef.current) return;
      if (now - lastEmitRef.current < MIN_EMIT_INTERVAL) return;
      lastEmitRef.current = now;
      socket.emit('userStatus', {
        userId,
        mobile,
        technicianMobile: mobile,
        username,
        role,
        latitude,
        longitude,
        accuracy: Math.round(accuracy || 0),
        timestamp: now,
      });
    };

    const watchId = navigator.geolocation.watchPosition(emitPosition, () => {}, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 15000,
    });

    return () => {
      navigator.geolocation.clearWatch(watchId);
      socket.disconnect();
    };
  }, []);

  return null;
};

export default UserLocationTracker;
