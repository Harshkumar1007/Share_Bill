import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  useEffect(() => {
    const loadUser = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        // Set standard authorization headers
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        try {
          // Mock or fetch user profile from API in future
          // For now, use template user payload
          setUser({
            id: 'mock-user-id',
            name: 'Mock User',
            email: 'user@example.com',
            avatarUrl: null
          });
        } catch (error) {
          console.error('Failed to load user profile', error);
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
      // Boilerplate placeholder:
      const mockToken = 'dummy-jwt-token-string';
      localStorage.setItem('token', mockToken);
      setToken(mockToken);
      setUser({
        id: 'mock-user-id',
        name: 'Mock User',
        email: email,
        avatarUrl: null
      });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const mockToken = 'dummy-jwt-token-string';
      localStorage.setItem('token', mockToken);
      setToken(mockToken);
      setUser({
        id: 'mock-user-id',
        name: name,
        email: email,
        avatarUrl: null
      });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
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
