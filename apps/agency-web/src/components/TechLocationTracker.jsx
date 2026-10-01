import React, { useEffect, useRef, useState } from 'react';
import { Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';
import io from 'socket.io-client';
import { API_URL, SOCKET_REALTIME_ENABLED, SOCKET_SERVER_URL } from '../config';

const ACCURACY_THRESHOLD = 50;
const MIN_SEND_INTERVAL = 30000;

const TechLocationTracker = () => {
  const lastSendRef = useRef(0);
  const [trackingActive, setTrackingActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [waiting, setWaiting] = useState(true);
  const [currentAccuracy, setCurrentAccuracy] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !navigator.geolocation) {
      setErrorMsg(!navigator.geolocation ? 'Geolocation is not supported by this browser.' : 'Authentication required.');
      setWaiting(false);
      return undefined;
    }
    const technicianMobile = localStorage.getItem('technicianMobile') || localStorage.getItem('userMobile') || '';
    const technicianName = localStorage.getItem('techName') || localStorage.getItem('username') || 'Technician';
    const auth = { headers: { Authorization: `Bearer ${token}` } };
    const socket = SOCKET_REALTIME_ENABLED && SOCKET_SERVER_URL
      ? io(SOCKET_SERVER_URL, { withCredentials: true, transports: ['websocket'], auth: { token } })
      : null;

    const handlePosition = async (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      setCurrentAccuracy(accuracy);
      if (accuracy > ACCURACY_THRESHOLD && lastSendRef.current) return;
      const now = Date.now();
      if (now - lastSendRef.current < MIN_SEND_INTERVAL) return;
      lastSendRef.current = now;
      const payload = { technicianMobile, username: technicianName, latitude, longitude, accuracy: Math.round(accuracy || 0), capturedAt: new Date(now).toISOString(), timestamp: now };
      try {
        await axios.post(`${API_URL}/api/users/me/location`, payload, auth);
        socket?.emit('techStatus', payload);
        setTrackingActive(true);
        setWaiting(false);
        setErrorMsg('');
      } catch {
        setErrorMsg(navigator.onLine ? 'Location could not be synced. It will retry automatically.' : 'Offline. Location will sync when the connection returns.');
        setWaiting(false);
      }
    };
    const handleError = () => { setErrorMsg('Location unavailable. Allow location permission in your browser settings.'); setWaiting(false); };
    navigator.geolocation.getCurrentPosition(handlePosition, handleError, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
    const watchId = navigator.geolocation.watchPosition(handlePosition, handleError, { enableHighAccuracy: true, timeout: 15000, maximumAge: 15000 });
    return () => { navigator.geolocation.clearWatch(watchId); socket?.disconnect(); };
  }, []);

  return (
    <div className="mb-4">
      {errorMsg ? <Alert variant="warning" className="mb-0">{errorMsg}</Alert> : waiting ? (
        <Alert variant="secondary" className="d-flex align-items-center mb-0"><Spinner animation="border" size="sm" className="me-2" /><span>Acquiring accurate location…</span>{currentAccuracy !== null && <small className="ms-2 text-muted">({Math.round(currentAccuracy)} m)</small>}</Alert>
      ) : (
        <Alert variant="success" className="d-flex align-items-center mb-0"><span>{trackingActive ? 'Location sync active' : 'Location ready'}</span>{currentAccuracy !== null && <small className="ms-2 text-muted">(accuracy: {Math.round(currentAccuracy)} m)</small>}</Alert>
      )}
    </div>
  );
};

export default TechLocationTracker;
