import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import io from 'socket.io-client';
import axios from 'axios';
import { API_URL, SOCKET_REALTIME_ENABLED, SOCKET_SERVER_URL } from '../config';

const defaultCenter = [19.7515, 75.7139];
const POLL_MS = 30000;
const MAP_TILES = [
  { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', attribution: 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, USGS, Intermap, INCREMENT P, NRCAN, Esri Japan, METI, Esri China (Hong Kong), NOSTRA, &copy; OpenStreetMap contributors' },
  { url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', attribution: '&copy; OpenStreetMap contributors &copy; CARTO' },
];

const ResilientTileLayer = () => {
  const [index, setIndex] = useState(0);
  const [errors, setErrors] = useState(0);
  useEffect(() => setErrors(0), [index]);
  const provider = MAP_TILES[index];
  return <TileLayer key={provider.url} attribution={provider.attribution} url={provider.url} maxZoom={19} eventHandlers={{ tileerror: () => setErrors((count) => { const next = count + 1; if (next >= 3 && index < MAP_TILES.length - 1) setIndex(index + 1); return next; }) }} />;
};

const isValidCoordinate = (lat, lng) => {
  const latitude = Number(lat);
  const longitude = Number(lng);
  return Number.isFinite(latitude) && Number.isFinite(longitude)
    && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
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
    const timer = window.setTimeout(() => map.invalidateSize({ animate: false }), 0);
    if (!locations.length) map.setView(defaultCenter, 6, { animate: false });
    else if (locations.length === 1) map.setView([Number(locations[0].latitude), Number(locations[0].longitude)], 13, { animate: false });
    else map.fitBounds(locations.map((loc) => [Number(loc.latitude), Number(loc.longitude)]), { padding: [34, 34], maxZoom: 13, animate: false });
    return () => window.clearTimeout(timer);
  }, [locations, map]);
  return null;
};

const usersToLocations = (data) => {
  const next = {};
  (Array.isArray(data) ? data : []).forEach((user) => {
    if (!isValidCoordinate(user.lastLocation?.latitude, user.lastLocation?.longitude)) return;
    next[user._id] = {
      userId: user._id,
      username: user.username,
      mobile: user.mobile,
      role: user.role,
      latitude: Number(user.lastLocation.latitude),
      longitude: Number(user.lastLocation.longitude),
      accuracy: user.lastLocation.accuracy,
      address: user.lastLocation.address,
      timestamp: user.lastLocation.capturedAt || user.lastLocation.updatedAt,
    };
  });
  return next;
};

const TechLocationMap = () => {
  const [locations, setLocations] = useState({});
  const [loadState, setLoadState] = useState('loading');

  useEffect(() => {
    let active = true;
    let socket;
    const token = localStorage.getItem('token');
    const auth = { headers: { Authorization: `Bearer ${token}` } };

    const refresh = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/users`, auth);
        if (active) setLocations(usersToLocations(data));
      } catch {
        // Preserve the last known map state on transient network failures.
      } finally {
        if (active) setLoadState('ready');
      }
    };

    refresh();
    const interval = window.setInterval(refresh, POLL_MS);

    if (SOCKET_REALTIME_ENABLED && SOCKET_SERVER_URL) {
      socket = io(SOCKET_SERVER_URL, { withCredentials: true, transports: ['websocket'], auth: { token } });
      const onStatus = (data) => {
        const key = data?.userId || data?.technicianId;
        if (!key || !isValidCoordinate(data?.latitude, data?.longitude)) return;
        setLocations((prev) => ({ ...prev, [key]: { ...prev[key], ...data, latitude: Number(data.latitude), longitude: Number(data.longitude) } }));
        setLoadState('ready');
      };
      socket.on('userStatus', onStatus);
      socket.on('techStatus', onStatus);
    }

    return () => {
      active = false;
      window.clearInterval(interval);
      socket?.disconnect();
    };
  }, []);

  const list = useMemo(() => Object.values(locations).filter((loc) => isValidCoordinate(loc.latitude, loc.longitude)), [locations]);

  return (
    <div className="location-map-shell">
      <div className="location-map-shell__head">
        <div><strong>User location map</strong><span>Latest authenticated user positions · refreshes automatically</span></div>
        <span>{list.length} located</span>
      </div>
      <div className="location-map-canvas" aria-label="User location map">
        <MapContainer center={defaultCenter} zoom={6} scrollWheelZoom={false} style={{ width: '100%', height: '100%' }} attributionControl>
          <ResilientTileLayer />
          <FitLocationBounds locations={list} />
          {list.map((loc) => (
            <CircleMarker key={loc.userId || loc.technicianId} center={[Number(loc.latitude), Number(loc.longitude)]} radius={8} pathOptions={{ color: '#315f50', fillColor: '#315f50', fillOpacity: 0.86, weight: 2 }}>
              <Popup minWidth={220}>
                <div className="location-map-popup">
                  <strong>{loc.username || 'User'}</strong>
                  <span>{String(loc.role || 'user').replaceAll('_', ' ')}</span>
                  {(loc.mobile || loc.technicianMobile) ? <span>{loc.mobile || loc.technicianMobile}</span> : null}
                  {loc.address ? <span>{loc.address}</span> : null}
                  <span>{formatLastSeen(loc.timestamp)}</span>
                  {Number.isFinite(Number(loc.accuracy)) && Number(loc.accuracy) > 0 ? <span>Accuracy ±{Math.round(Number(loc.accuracy))} m</span> : null}
                  <a href={`https://www.google.com/maps/search/?api=1&query=${Number(loc.latitude)},${Number(loc.longitude)}`} target="_blank" rel="noreferrer">Open location</a>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
        {loadState === 'loading' && <div className="location-map-overlay">Loading user locations…</div>}
        {loadState === 'ready' && list.length === 0 && <div className="location-map-empty"><strong>No location data yet</strong><span>Ask a signed-in user to allow browser location permission. Their last-known position will appear here automatically.</span></div>}
      </div>
    </div>
  );
};

export default React.memo(TechLocationMap);
