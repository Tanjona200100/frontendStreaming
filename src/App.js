// src/App.js
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import StreamingLogin from './login/login';
import HomePage from './home/home';
import ProtectedRoute from "./protection/ProtectedRoute";
import Profil from "./profile/profil";

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Router>
      <Routes>
        {/* Redirection si déjà authentifié */}
        <Route 
          path="/" 
          element={
            isAuthenticated ? <Navigate to="/home" replace /> : <StreamingLogin />
          } 
        />

        {/* Routes protégées */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/profil"
          element={
            <ProtectedRoute>
              <Profil />
            </ProtectedRoute>
          }
        />

        
      
      </Routes>
    </Router>
  );
}

export default App;