const trimOrigin = (value) => String(value || '').trim().replace(/\/$/, '');

const configuredApi = trimOrigin(import.meta.env.VITE_API_URL);
export const API_URL = configuredApi || (import.meta.env.PROD ? '' : 'http://localhost:3000');

const configuredSocket = trimOrigin(import.meta.env.VITE_SOCKET_SERVER_URL);
export const SOCKET_SERVER_URL = configuredSocket || API_URL;

// Vercel/serverless deployments cannot guarantee a long-lived Socket.IO session.
// Keep realtime sockets opt-in for a dedicated Node host; Agency location screens
// transparently fall back to authenticated REST heartbeat + polling everywhere else.
export const SOCKET_REALTIME_ENABLED = String(import.meta.env.VITE_ENABLE_SOCKET_REALTIME || '').toLowerCase() === 'true';

export const resolveAssetUrl = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^(data:|blob:)/i.test(raw)) return raw;
  const localMatch = raw.match(/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(\/.*)$/i);
  if (localMatch) return `${API_URL || ''}${localMatch[1]}` || localMatch[1];
  if (raw.startsWith('/')) return `${API_URL || ''}${raw}` || raw;
  return raw;
};
