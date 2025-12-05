// src/hooks/useAuth.js
import { useState, useEffect } from "react";

export const useAuth = () => {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    isLoading: true,
    user: null,
  });

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const userData = localStorage.getItem("userData");

    if (token) {
      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        user: userData ? JSON.parse(userData) : null,
      });
    } else {
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
      });
    }
  }, []);

  const login = (token, userData) => {
    localStorage.setItem("authToken", token);
    if (userData) {
      localStorage.setItem("userData", JSON.stringify(userData));
    }
    setAuthState({
      isAuthenticated: true,
      isLoading: false,
      user: userData,
    });
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });
  };

  return { ...authState, login, logout };
};