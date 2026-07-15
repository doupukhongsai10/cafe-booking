import { createContext, useContext, useMemo, useState } from 'react';
import { loginUser, logoutUser, registerUser } from '../services/auth.service';

const AUTH_STORAGE_KEY = 'aura-reserve-auth';
const AuthContext = createContext(undefined);

function getStoredSession() {
  const storedSession = localStorage.getItem(AUTH_STORAGE_KEY);

  if (!storedSession) {
    return null;
  }

  try {
    return JSON.parse(storedSession);
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(getStoredSession);

  function saveSession(nextSession) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
  }

  async function login(credentials) {
    const nextSession = await loginUser(credentials);
    saveSession(nextSession);
  }

  async function register(details) {
    const nextSession = await registerUser(details);
    saveSession(nextSession);
  }

  async function logout() {
    try {
      if (session?.token) {
        await logoutUser(session.token);
      }
    } finally {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      setSession(null);
    }
  }

  const value = useMemo(() => ({
    user: session?.user ?? null,
    token: session?.token ?? null,
    isAuthenticated: Boolean(session?.token),
    login,
    register,
    logout,
  }), [session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }

  return context;
}
