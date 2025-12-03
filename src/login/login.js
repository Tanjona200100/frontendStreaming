import React, { useState, useEffect } from 'react';
import './login.css';

const StreamingLogin = () => {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [isBlocked, setIsBlocked] = useState(false);
  const [timer, setTimer] = useState(0);

  const MAX_RETRIES = 5;
  const RETRY_DELAY = 1000;
  const BLOCK_DURATION = 15 * 60; // 15 minutes

  /* --------------------------
     Charger Remember Me + blocage
  -------------------------- */
  useEffect(() => {
    const savedRemember = localStorage.getItem('rememberMe') === 'true';
    if (savedRemember) {
      setRememberMe(true);
      const savedEmail = localStorage.getItem('savedEmail');
      if (savedEmail) setEmail(savedEmail);
    }

    const blockedUntil = localStorage.getItem('loginBlockedUntil');
    if (blockedUntil) {
      const now = Date.now();
      const remaining = Math.floor((blockedUntil - now) / 1000);
      if (remaining > 0) {
        setIsBlocked(true);
        setTimer(remaining);
      } else {
        localStorage.removeItem('loginBlockedUntil');
      }
    }
  }, []);

  /* --------------------------
     Timer du blocage
  -------------------------- */
  useEffect(() => {
    let interval;
    if (isBlocked && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else if (timer === 0 && isBlocked) {
      setIsBlocked(false);
      setError('');
      localStorage.removeItem('loginBlockedUntil');
    }
    return () => clearInterval(interval);
  }, [isBlocked, timer]);

  /* --------------------------
     Soumission du formulaire
  -------------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isBlocked) return;

    setError('');
    setSuccess('');
    setIsLoading(true);

    if (!email.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs');
      setIsLoading(false);
      return;
    }

    if (rememberMe) {
      localStorage.setItem('rememberMe', 'true');
      localStorage.setItem('savedEmail', email);
    } else {
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('savedEmail');
    }

    let attempt = 0;

    const attemptLogin = async () => {
      attempt++;
      try {
        const API_URL = 'http://192.168.2.161:5000/api/auth/login';
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password, remember: rememberMe }),
        });

        const text = await response.text();
        let data = {};
        try { data = JSON.parse(text); } catch {}

        if (!response.ok) {
          if (response.status === 401) throw new Error("Identifiants invalides");
          if (response.status === 429) throw new Error("429 Too Many Requests");
          throw new Error(`${response.status} ${text}`);
        }

        setSuccess('Connexion réussie !');

        // Sauvegarder token et user
        if (data.token) localStorage.setItem('authToken', data.token);
        if (data.user) localStorage.setItem('user', JSON.stringify(data.user));

        // Redirection vers page d'accueil après 1,5s
        // setTimeout(() => {
        //   navigate('/home'); // ← page d'accueil
        // }, 1500);

      } catch (err) {
        if (err.message.includes("429") && attempt < MAX_RETRIES) {
          console.warn(`Tentative ${attempt} échouée, nouvelle tentative dans 1s...`);
          setTimeout(attemptLogin, RETRY_DELAY);
          return;
        }

        if (err.message.includes("429") && attempt >= MAX_RETRIES) {
          setError("Trop de tentatives. Réessayez dans 15 minutes.");
          setIsBlocked(true);
          setTimer(BLOCK_DURATION);
          localStorage.setItem("loginBlockedUntil", Date.now() + BLOCK_DURATION * 1000);
        } else if (err.message.toLowerCase().includes("identifiants")) {
          setError("Identifiants invalides. Vérifiez vos informations.");
        } else if (err instanceof TypeError && err.message === "Failed to fetch") {
          setError("Impossible de contacter le serveur.");
        } else if (err.message.includes("404")) {
          setError("API introuvable. Vérifiez l’URL.");
        } else {
          setError(err.message || "Erreur inconnue.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    attemptLogin();
  };

  /* --------------------------
     Format du timer
  -------------------------- */
  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  /* --------------------------
     JSX
  -------------------------- */
  return (
    <div className="streaming-login-container">
      <div className="login-background">
        <div className="video-overlay"></div>
      </div>

      <div className="login-center-wrapper">
        <div className="login-content">
          <div className="login-card">
            <h2>Streaming video</h2>

            {success && <div className="success-message">{success}</div>}
            {error && <div className="error-message">{error}</div>}
            {isBlocked && <div className="error-message">Réessayez dans {formatTime(timer)}</div>}

            <form onSubmit={handleSubmit} className="login-form">

              <div className="form-group">
                <label>Email</label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="Entrez votre email"
                  disabled={isLoading || isBlocked}
                />
              </div>

              <div className="form-group">
                <label>Mot de passe</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Entrez votre mot de passe"
                  disabled={isLoading || isBlocked}
                />
              </div>

              <div className="form-options">
                <div className="remember-me">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isLoading || isBlocked}
                  />
                  <label htmlFor="remember">Se souvenir de moi</label>
                </div>

                <a href="#" className="forgot-password">Mot de passe oublié ?</a>
              </div>

              <button
                type="submit"
                className="login-button"
                disabled={isLoading || isBlocked}
              >
                {isLoading ? 'CONNEXION...' : 'SE CONNECTER'}
              </button>

            </form>

          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamingLogin;
