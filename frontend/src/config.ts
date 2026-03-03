// Use environment variables from Vite, with fallbacks that work for both local and cloud deployments.
// If VITE_API_URL is not set at build time, it will fallback to the current origin on port 8000 (standard backend port).
// If we are in production (Docker/Cloud), we might want it to point to the same host but different port or same port.
const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8080';
const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

const DEFAULT_API_URL = `${origin.replace(':8080', ':8000')}`;
const DEFAULT_WS_URL = `ws://${hostname}:8000`;

const API_BASE_URL = import.meta.env.VITE_API_URL || DEFAULT_API_URL;
const WS_BASE_URL = import.meta.env.VITE_WS_URL || DEFAULT_WS_URL;

export const config = {
  apiUrl: API_BASE_URL,
  wsUrl: WS_BASE_URL,
};
