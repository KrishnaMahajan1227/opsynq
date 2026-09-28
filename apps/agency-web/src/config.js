const configuredApi=String(import.meta.env.VITE_API_URL||'').trim();
export const API_URL=configuredApi.replace(/\/$/,'')||(import.meta.env.PROD?'':'http://localhost:3000');
const configuredSocket=String(import.meta.env.VITE_SOCKET_SERVER_URL||'').trim();
export const SOCKET_SERVER_URL=configuredSocket.replace(/\/$/,'')||API_URL;
