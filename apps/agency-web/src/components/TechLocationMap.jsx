import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import io from 'socket.io-client';
import axios from 'axios';
import { API_URL } from '../config';

const defaultCenter = [19.7515, 75.7139];
const SOCKET_SERVER_URL = String(import.meta.env.VITE_SOCKET_SERVER_URL||'').replace(/\/$/,'')||(String(import.meta.env.VITE_API_URL||'').replace(/\/$/,'')||(import.meta.env.PROD?'':'http://localhost:3000'));

const isValidCoordinate = (lat, lng) => {
  const latitude = Number(lat);
  const longitude = Number(lng);
  return Number.isFinite(latitude)
    && Number.isFinite(longitude)
    && latitude >= -90 && latitude <= 90
    && longitude >= -180 && longitude <= 180;
};

const formatLastSeen = (value) => {
  if (!value) return 'Last seen time unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Last seen time unavailable';
  return `Last seen ${date.toLocaleString()}`;
};

const FitLocationBounds = ({ locations }) => {
  const map = useMap();

  useEffect(() => {
    if (!locations.length) {
      map.setView(defaultCenter, 6, { animate: false });
      return;
    }
    if (locations.length === 1) {
      map.setView([Number(locations[0].latitude), Number(locations[0].longitude)], 13, { animate: false });
      return;
    }
    const bounds = locations.map((loc) => [Number(loc.latitude), Number(loc.longitude)]);
    map.fitBounds(bounds, { padding: [34, 34], maxZoom: 13, animate: false });
  }, [locations, map]);

  return null;
};

const TechLocationMap = () => {
  const [locations, setLocations] = useState({});
  const [loadState, setLoadState] = useState('loading');

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem('token');

    axios.get(`${API_URL}/api/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => {
        if (!active) return;
        const next = {};
        (Array.isArray(data) ? data : []).forEach((user) => {
          if (isValidCoordinate(user.lastLocation?.latitude, user.lastLocation?.longitude)) {
            next[user._id] = {
              userId: user._id,
              username: user.username,
              mobile: user.mobile,
              role: user.role,
              latitude: Number(user.lastLocation.latitude),
              longitude: Number(user.lastLocation.longitude),
              accuracy: user.lastLocation.accuracy,
              timestamp: user.lastLocation.capturedAt || user.lastLocation.updatedAt,
            };
          }
        });
        setLocations(next);
        setLoadState('ready');
      })
      .catch(() => {
        if (active) setLoadState('ready');
      });

    const socket = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'],
      auth: { token },
    });

    const onStatus = (data) => {
      const key = data?.userId || data?.technicianId;
      if (!key || !isValidCoordinate(data?.latitude, data?.longitude)) return;
      setLocations((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          ...data,
          latitude: Number(data.latitude),
          longitude: Number(data.longitude),
        },
      }));
      setLoadState('ready');
    };

    socket.on('userStatus', onStatus);
    socket.on('techStatus', onStatus);

    return () => {
      active = false;
      socket.off('userStatus', onStatus);
      socket.off('techStatus', onStatus);
      socket.disconnect();
    };
  }, []);

  const list = useMemo(
    () => Object.values(locations).filter((loc) => isValidCoordinate(loc.latitude, loc.longitude)),
    [locations],
  );

  return (
    <div className="location-map-shell">
      <div className="location-map-shell__head">
        <div>
          <strong>User location map</strong>
          <span>Live and last-known positions for authenticated users</span>
        </div>
        <span>{list.length} located</span>
      </div>

      <div className="location-map-canvas" aria-label="User location map">
        <MapContainer
          center={defaultCenter}
          zoom={6}
          scrollWheelZoom={false}
          style={{ width: '100%', height: '390px' }}
          attributionControl
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitLocationBounds locations={list} />
          {list.map((loc) => (
            <CircleMarker
              key={loc.userId || loc.technicianId}
              center={[Number(loc.latitude), Number(loc.longitude)]}
              radius={8}
              pathOptions={{ color: '#315f50', fillColor: '#315f50', fillOpacity: 0.86, weight: 2 }}
            >
              <Popup minWidth={220}>
                <div className="location-map-popup">
                  <strong>{loc.username || 'User'}</strong>
                  <span>{String(loc.role || 'user').replaceAll('_', ' ')}</span>
                  {loc.mobile || loc.technicianMobile ? <span>{loc.mobile || loc.technicianMobile}</span> : null}
                  <span>{formatLastSeen(loc.timestamp)}</span>
                  {Number.isFinite(Number(loc.accuracy)) && Number(loc.accuracy) > 0 ? <span>Accuracy ±{Math.round(Number(loc.accuracy))} m</span> : null}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${Number(loc.latitude)},${Number(loc.longitude)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open location
                  </a>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        {loadState === 'loading' && <div className="location-map-overlay">Loading user locations…</div>}
        {loadState === 'ready' && list.length === 0 && (
          <div className="location-map-empty">
            <strong>No location data yet</strong>
            <span>Location appears here after a logged-in user grants browser location permission.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(TechLocationMap);
