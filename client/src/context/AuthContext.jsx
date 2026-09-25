import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService';
import { storage, STORAGE_KEYS } from '../utils/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // True right after the user clicks "Log out" (protected pages then go to "/" instead of /login).
  const [loggedOut, setLoggedOut] = useState(false);
  // `initializing` is true while we check a saved token on first load.
  const [initializing, setInitializing] = useState(() => Boolean(storage.get(STORAGE_KEYS.token)));

  const saveSession = useCallback(({ user: nextUser, token }) => {
    if (token) storage.set(STORAGE_KEYS.token, token);
    setLoggedOut(false);
    setUser(nextUser);
    return nextUser;
  }, []);

  const logout = useCallback(() => {
    storage.remove(STORAGE_KEYS.token);
    setLoggedOut(true);
    setUser(null);
  }, []);

  // Session expired / rejected by the server (not a manual logout).
  const expireSession = useCallback(() => {
    storage.remove(STORAGE_KEYS.token);
    setUser(null);
  }, []);

  // Restore the session from a saved token.
  useEffect(() => {
    if (!storage.get(STORAGE_KEYS.token)) return;
    authService
      .me()
      .then(({ user: me }) => setUser(me))
      .catch(() => storage.remove(STORAGE_KEYS.token))
      .finally(() => setInitializing(false));
  }, []);

  // The API layer fires this event when the server rejects our token.
  useEffect(() => {
    const handler = () => expireSession();
    window.addEventListener('orixa:unauthorized', handler);
    return () => window.removeEventListener('orixa:unauthorized', handler);
  }, [expireSession]);

  const login = useCallback(async (email, password) => saveSession(await authService.login({ email, password })), [saveSession]);
  const register = useCallback(async (payload) => saveSession(await authService.register(payload)), [saveSession]);

  const updateProfile = useCallback(
    async (payload) => {
      const { data, message } = await authService.updateProfile(payload);
      saveSession(data);
      return message;
    },
    [saveSession]
  );

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isAdmin: Boolean(user?.isAdmin),
      initializing,
      loggedOut,
      login,
      register,
      logout,
      updateProfile,
      saveSession,
      setUser,
    }),
    [user, initializing, loggedOut, login, register, logout, updateProfile, saveSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
