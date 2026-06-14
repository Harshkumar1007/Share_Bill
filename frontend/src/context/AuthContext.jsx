import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import authService from '../services/auth.service';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  useEffect(() => {
    const loadUser = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        // Apply authorization header globally
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        try {
          const response = await authService.getMe();
          if (response.success && response.data) {
            setUser(response.data);
          } else {
            logout();
          }
        } catch (error) {
          console.error('Failed to load user session', error);
          logout();
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const resData = await authService.login(email, password);
      if (resData.success && resData.data) {
        const { token: receivedToken, id, name, email: userEmail } = resData.data;
        localStorage.setItem('token', receivedToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${receivedToken}`;
        setToken(receivedToken);
        setUser({ id, name, email: userEmail });
        return { success: true };
      }
      return { success: false, error: resData.error || 'Invalid credentials' };
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Login failed';
      return { success: false, error: errMsg };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const resData = await authService.register(name, email, password);
      if (resData.success && resData.data) {
        const { token: receivedToken, id, name: userName, email: userEmail } = resData.data;
        localStorage.setItem('token', receivedToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${receivedToken}`;
        setToken(receivedToken);
        setUser({ id, name: userName, email: userEmail });
        return { success: true };
      }
      return { success: false, error: resData.error || 'Registration failed' };
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Registration failed';
      return { success: false, error: errMsg };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
