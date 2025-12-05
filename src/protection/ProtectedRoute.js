// src/protection/ProtectedRoute.js
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <div>Vérification de l'authentification...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Option: Vérifier les rôles utilisateurs
  if (requireAdmin && user?.role !== "admin") {
    return <Navigate to="/home" replace />;
  }

  return children;
};

export default ProtectedRoute;