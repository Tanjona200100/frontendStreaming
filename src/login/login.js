import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import './login.css';

const StreamingLogin = () => {
  const navigate = useNavigate();

  const MAX_ATTEMPTS = 5;
  const BLOCK_TIME = 15 * 60; // 15 minutes en secondes
  const RETRY_DELAY = 1000;
  const MAX_RETRY = 5;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [isBlocked, setIsBlocked] = useState(false);
  const [timer, setTimer] = useState(0);

  // ------ RESTAURATION DU BLOCAGE ------
  useEffect(() => {
    const blockedUntil = localStorage.getItem("blockedUntil");
    if (blockedUntil) {
      const remaining = Math.floor((blockedUntil - Date.now()) / 1000);
      if (remaining > 0) {
        setIsBlocked(true);
        setTimer(remaining);
      } else {
        localStorage.removeItem("blockedUntil");
        localStorage.removeItem("loginAttempts");
      }
    }
  }, []);

  // ------ TIMER ------
  useEffect(() => {
    let interval;
    if (isBlocked && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    } else if (timer === 0 && isBlocked) {
      setIsBlocked(false);
      localStorage.removeItem("blockedUntil");
      localStorage.removeItem("loginAttempts");
    }
    return () => clearInterval(interval);
  }, [isBlocked, timer]);

  // ------ FORMAT TIMER ------
  const formatTime = (sec) =>
    `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;

  // ------ LOGIN ------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isBlocked) return;

    setError('');
    setSuccess('');
    setIsLoading(true);

    if (!email.trim() || !password.trim()) {
      setError("Veuillez remplir tous les champs");
      setIsLoading(false);
      return;
    }

    let attempts = Number(localStorage.getItem("loginAttempts") || 0);
    let retry = 0;

    const sendLogin = async () => {
      retry++;
      try {
        const response = await fetch("http://192.168.2.161:5000/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, remember: rememberMe }),
        });

        if (!response.ok) {
          if (response.status === 429 && retry < MAX_RETRY) {
            setTimeout(sendLogin, RETRY_DELAY);
            return;
          }
          if (response.status === 404) throw new Error("API introuvable");
          throw new Error(`HTTP ${response.status}`);
        }

        const text = await response.text();
        let data = {};
        try { data = JSON.parse(text); } catch {}

        // ----- SUCCÈS -----
        localStorage.setItem("authToken", data.token);
        if (rememberMe) localStorage.setItem("rememberMe", "true");
        if (data.user) localStorage.setItem("user", JSON.stringify(data.user));

        localStorage.removeItem("loginAttempts");
        localStorage.removeItem("blockedUntil");

        setSuccess("Connexion réussie !");
        navigate("/home");
        setIsLoading(false);

      } catch (err) {
        attempts++;
        localStorage.setItem("loginAttempts", attempts);

        if (attempts >= MAX_ATTEMPTS) {
          const blockEnd = Date.now() + BLOCK_TIME * 1000;
          localStorage.setItem("blockedUntil", blockEnd);
          setIsBlocked(true);
          setTimer(BLOCK_TIME);
          setError("Trop de tentatives. Vous êtes bloqué 15 minutes.");
        } else if (err instanceof TypeError) {
          setError("Impossible de joindre le serveur. Vérifiez votre connexion.");
        } else if (err.message === "API introuvable") {
          setError("API introuvable.");
        } else {
          setError("Identifiants invalides.");
        }

        setIsLoading(false);
      }
    };

    sendLogin();
  };

  return (
    <div className="streaming-login-container">

      <div className="login-background">
        <div className="video-overlay"></div>
      </div>

      <div className="login-center-wrapper">
        <div className="login-content">
          <div className="login-card">

            <h2>Streaming vidéo</h2>

            {success && <div className="success-message">{success}</div>}
            {error && <div className="error-message">{error}</div>}
            {isBlocked && (
              <div className="error-message">Réessayez dans {formatTime(timer)}</div>
            )}

            <form onSubmit={handleSubmit} className="login-form">

              <div className="form-group">
                <label>Email</label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  disabled={isLoading || isBlocked}
                />
              </div>

              <div className="form-group">
                <label>Mot de passe</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  disabled={isLoading || isBlocked}
                />
              </div>

              <div className="form-options">
                <div>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isLoading || isBlocked}
                  />
                  <label>Se souvenir de moi</label>
                </div>
                <a href="#" className="forgot-password">Mot de passe oublié ?</a>
              </div>

              <button className="login-button" disabled={isLoading || isBlocked}>
                {isLoading ? "CONNEXION..." : "SE CONNECTER"}
              </button>

            </form>

          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamingLogin;
