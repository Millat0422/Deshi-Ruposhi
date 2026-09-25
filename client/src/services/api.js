import axios from 'axios';
import { storage, STORAGE_KEYS } from '../utils/storage';

// One shared axios instance for the whole app.
// VITE_API_URL is empty in development (Vite proxies /api to the Express server).
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach the JWT to every request when the user is logged in.
api.interceptors.request.use((config) => {
  const token = storage.get(STORAGE_KEYS.token);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normalise errors so every component can just show `error.message`.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;
    let message = data?.message;

    if (!message) {
      if (error.code === 'ECONNABORTED') message = 'The request took too long. Please try again.';
      else if (!error.response) message = 'Cannot reach the server. Check your connection and try again.';
      else message = 'Something went wrong. Please try again.';
    }

    // A rejected token means the session is over -> tell AuthContext to log out.
    if (status === 401 && error.config?.headers?.Authorization) {
      window.dispatchEvent(new CustomEvent('orixa:unauthorized'));
    }

    const normalized = new Error(message);
    normalized.status = status;
    normalized.errors = data?.errors || [];
    return Promise.reject(normalized);
  }
);

// Helper: unwrap { success, data } -> data
export const unwrap = (promise) => promise.then((response) => response.data.data);
export const unwrapWithMessage = (promise) =>
  promise.then((response) => ({ data: response.data.data, message: response.data.message }));

export default api;
