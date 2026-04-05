import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { 
      const stored = localStorage.getItem('user');
      const parsed = stored ? JSON.parse(stored) : null;
      console.log('[AUTH INIT] User from localStorage:', parsed);
      return parsed;
    } catch (e) { 
      console.error('[AUTH INIT] Error parsing user:', e);
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const saveAuth = (token, userData) => {
    console.log('[AUTH SAVE] Saving user:', userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    console.log('[AUTH LOGOUT] Clearing auth data');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    console.log('[AUTH LOGIN] Response:', res.data);
    saveAuth(res.data.token, res.data.user);
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await authAPI.register({ name, email, password });
    saveAuth(res.data.token, res.data.user);
    return res.data;
  };

  const googleLogin = async (credential) => {
    const res = await authAPI.googleLogin(credential);
    saveAuth(res.data.token, res.data.user);
    return res.data;
  };

  const updateProfile = async (data) => {
    const res = await authAPI.updateProfile(data);
    const updated = res.data.user;
    localStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
    return updated;
  };

  const isAdmin = user?.role === 'admin';
  console.log('[AUTH STATE] User:', user, 'isAdmin:', isAdmin);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, googleLogin, logout, updateProfile, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
