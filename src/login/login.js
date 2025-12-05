import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from "react-router-dom";
import './login.css';

const StreamingLogin = () => {
  const navigate = useNavigate();

  const MAX_ATTEMPTS = 5;
  const BLOCK_TIME = 15 * 60 * 1000; // 15 minutes en millisecondes
  const RETRY_DELAY = 2000; // 2 secondes
  const MAX_RETRY = 3;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [isBlocked, setIsBlocked] = useState(false);
  const [timer, setTimer] = useState(0);

  // Vérifier et restaurer l'état de blocage
  useEffect(() => {
    const checkBlockStatus = () => {
      const blockedUntil = localStorage.getItem("blockedUntil");
      if (blockedUntil) {
        const remaining = parseInt(blockedUntil) - Date.now();
        if (remaining > 0) {
          setIsBlocked(true);
          setTimer(Math.floor(remaining / 1000));
        } else {
          localStorage.removeItem("blockedUntil");
          localStorage.removeItem("loginAttempts");
          setIsBlocked(false);
          setTimer(0);
        }
      }
    };

    checkBlockStatus();
    const interval = setInterval(checkBlockStatus, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Timer pour le blocage
  useEffect(() => {
    let interval;
    if (isBlocked && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsBlocked(false);
            localStorage.removeItem("blockedUntil");
            localStorage.removeItem("loginAttempts");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isBlocked]);

  // Formater le temps
  const formatTime = useCallback((seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, []);

  // Validation des champs
  const validateFields = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email.trim()) {
      setError("L'email est requis");
      return false;
    }
    
    if (!emailRegex.test(email)) {
      setError("Veuillez entrer un email valide");
      return false;
    }
    
    if (!password.trim()) {
      setError("Le mot de passe est requis");
      return false;
    }
    
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return false;
    }
    
    return true;
  };

  // Fonction de redirection
  const redirectToHome = useCallback(() => {
    console.log("Redirection vers /home...");
    navigate("/home", { replace: true });
  }, [navigate]);

  // Gestion de la connexion
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Vérifier si bloqué
    if (isBlocked) {
      setError(`Veuillez patienter ${formatTime(timer)} avant de réessayer`);
      return;
    }
    
    // Réinitialiser les messages
    setError('');
    setSuccess('');
    
    // Valider les champs
    if (!validateFields()) {
      return;
    }
    
    setIsLoading(true);
    
    let attempts = parseInt(localStorage.getItem("loginAttempts") || "0");
    
    try {
      // Tentative de connexion
      const response = await fetch("http://192.168.2.161:5000/api/auth/login", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ 
          email: email.trim(), 
          password, 
          remember: rememberMe 
        }),
      });

      // Lire la réponse comme texte d'abord
      const responseText = await response.text();
      console.log("Réponse serveur:", responseText);
      console.log("Statut HTTP:", response.status);

      // Essayer de parser la réponse JSON
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
        console.log("Données parsées:", data);
      } catch (parseError) {
        console.error("Erreur de parsing JSON:", parseError);
        setError("Format de réponse invalide du serveur");
        setIsLoading(false);
        return;
      }

      // Gestion des erreurs HTTP
      if (!response.ok) {
        if (response.status === 429) {
          setError("Trop de tentatives. Veuillez réessayer plus tard.");
        } else if (response.status === 401 || response.status === 400) {
          attempts++;
          localStorage.setItem("loginAttempts", attempts.toString());
          
          if (attempts >= MAX_ATTEMPTS) {
            const blockEnd = Date.now() + BLOCK_TIME;
            localStorage.setItem("blockedUntil", blockEnd.toString());
            setIsBlocked(true);
            setTimer(Math.floor(BLOCK_TIME / 1000));
            setError("Trop de tentatives échouées. Vous êtes bloqué pour 15 minutes.");
          } else {
            setError(data.message || "Identifiants incorrects");
          }
        } else if (response.status === 404) {
          setError("Service temporairement indisponible");
        } else {
          setError(`Erreur ${response.status}: ${data.message || "Une erreur est survenue"}`);
        }
        
        setIsLoading(false);
        return;
      }

      // SUCCÈS - Le serveur renvoie 200 OK
      console.log("Connexion réussie! Données reçues:", data);
      
      // Vérifier le message de succès
      if (data.message && data.message.includes("Connexion réussie")) {
        // Stocker les informations même sans token (pour le développement)
        if (data.token) {
          localStorage.setItem("authToken", data.token);
        } else {
          // Pour le développement: créer un token factice
          const mockToken = `dev-token-${Date.now()}`;
          localStorage.setItem("authToken", mockToken);
          localStorage.setItem("isDevMode", "true");
        }
        
        // Stocker l'email si "Se souvenir de moi"
        if (rememberMe) {
          localStorage.setItem("rememberMe", "true");
          localStorage.setItem("savedEmail", email);
        } else {
          localStorage.removeItem("rememberMe");
          localStorage.removeItem("savedEmail");
        }
        
        // Stocker les informations utilisateur
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        } else {
          // Informations utilisateur minimales
          localStorage.setItem("user", JSON.stringify({
            email: email,
            name: email.split('@')[0],
            isAuthenticated: true
          }));
        }
        
        // Marquer comme connecté
        localStorage.setItem("isLoggedIn", "true");
        
        // Réinitialiser les tentatives
        localStorage.removeItem("loginAttempts");
        localStorage.removeItem("blockedUntil");
        
        // Afficher le message de succès
        setSuccess("Connexion réussie ! Redirection...");
        
        // Rediriger IMMÉDIATEMENT vers /home
        console.log("Redirection immédiate vers /home");
        setIsLoading(false); // Important: arrêter le loading avant la redirection
        
        // Utiliser un timeout très court pour laisser le state se mettre à jour
        setTimeout(() => {
          redirectToHome();
        }, 100);
        
      } else {
        // Le serveur a répondu OK mais sans message de succès clair
        setError("Réponse du serveur inattendue");
        setIsLoading(false);
      }

    } catch (err) {
      // Gestion des erreurs réseau
      console.error("Erreur de connexion:", err);
      
      if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        setError("Impossible de se connecter au serveur. Vérifiez votre connexion internet.");
      } else {
        setError("Une erreur inattendue est survenue. Veuillez réessayer.");
      }
      
      setIsLoading(false);
    }
  };

  // Charger l'email sauvegardé si "Se souvenir de moi" était coché
  useEffect(() => {
    const savedRememberMe = localStorage.getItem("rememberMe");
    const savedEmail = localStorage.getItem("savedEmail");
    
    if (savedRememberMe === "true" && savedEmail) {
      setRememberMe(true);
      setEmail(savedEmail);
    }
  }, []);

  // Vérifier si déjà connecté
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const authToken = localStorage.getItem("authToken");
    
    if (isLoggedIn === "true" && authToken) {
      console.log("Déjà connecté, redirection vers /home");
      // Petit délai pour éviter les boucles de redirection
      setTimeout(() => {
        redirectToHome();
      }, 100);
    }
  }, [redirectToHome]);

  // Gestion de la touche Entrée
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading && !isBlocked) {
      handleSubmit(e);
    }
  };

  return (
    <div className="streaming-login-container" onKeyPress={handleKeyPress}>
      <div className="login-background">
        <div className="video-overlay"></div>
      </div>

      <div className="login-center-wrapper">
        <div className="login-content">
          <div className="login-card">
            <h2>Streaming vidéo</h2>
            
            {success && (
              <div className="success-message">
                <i className="success-icon">✓</i> {success}
              </div>
            )}
            
            {error && (
              <div className="error-message">
                <i className="error-icon">!</i> {error}
              </div>
            )}
            
            {isBlocked && (
              <center><div className="blocked-message">
                <i className="blocked-icon">⏱️</i>{formatTime(timer)}
              </div></center>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  disabled={isLoading || isBlocked}
                  placeholder="votre@email.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Mot de passe</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  disabled={isLoading || isBlocked}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </div>

              <div className="form-options">
                <div className="remember-me">
                  <input
                    id="rememberMe"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isLoading || isBlocked}
                  />
                  <label htmlFor="rememberMe">Se souvenir de moi</label>
                </div>
                <a 
                  href="/forgot-password" 
                  className="forgot-password"
                  onClick={(e) => {
                    e.preventDefault();
                  }}
                >
                  Mot de passe oublié ?
                </a>
              </div>

              <button 
                type="submit" 
                className={`login-button ${isLoading ? 'loading' : ''}`} 
                disabled={isLoading || isBlocked || !email.trim() || !password.trim()}
              >
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    CONNEXION...
                  </>
                ) : (
                  "SE CONNECTER"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamingLogin;