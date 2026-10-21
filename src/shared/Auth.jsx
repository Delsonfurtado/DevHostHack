import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, clearSession, setSession } from './api.js';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(Boolean(sessionStorage.getItem('niramaya.access')));
  useEffect(() => {
    if (!loading) return;
    api
      .me()
      .then((value) => {
        sessionStorage.setItem('niramaya.user', JSON.stringify(value));
        setUser(value);
      })
      .catch(() => {
        try {
          const cached = JSON.parse(sessionStorage.getItem('niramaya.user') || 'null');
          if (!navigator.onLine && cached?.role === 'client') setUser(cached);
          else {
            clearSession();
            setUser(null);
          }
        } catch {
          clearSession();
          setUser(null);
        }
      })
      .finally(() => setLoading(false));
  }, []);
  const signIn = async (credentials) => {
    const result = await api.login(credentials);
    setSession(result);
    setUser(result.user);
    return result.user;
  };
  const signOut = () => {
    clearSession();
    setUser(null);
  };
  return (
    <AuthContext.Provider value={{ user, setUser, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
