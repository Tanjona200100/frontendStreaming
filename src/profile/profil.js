import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Calendar, Settings, ArrowLeft, Camera, Save, Edit, Star, MessageSquare, Video, Clock, X, AlertCircle, LogOut } from 'lucide-react';
import './profil.css';

export default function ProfilPage() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    avatar: ''
  });
  const [videoStats, setVideoStats] = useState({
    ratedVideos: 0,
    averageRating: 0,
    commentsCount: 0,
    activeDays: 0
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Fonction utilitaire pour vérifier l'authentification
  const checkAuthentication = () => {
    const token = localStorage.getItem('authToken');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const user = localStorage.getItem('user');
    
    if (!token || isLoggedIn !== 'true' || !user) {
      return false;
    }
    return true;
  };

  // Charger les données utilisateur
  useEffect(() => {
    const fetchUserData = () => {
      console.log("Chargement des données du profil...");
      
      // Vérifier d'abord l'authentification
      if (!checkAuthentication()) {
        console.log("Non authentifié, redirection vers login");
        navigate('/', { replace: true });
        return;
      }
      
      try {
        // Charger depuis localStorage
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          console.log("Données utilisateur chargées:", parsedUser);
          
          setUserData(parsedUser);
          setFormData({
            name: parsedUser.name || '',
            email: parsedUser.email || '',
            bio: parsedUser.bio || '',
            avatar: parsedUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(parsedUser.name || 'User')}&background=FF2E2E&color=fff&size=150`
          });
          
          // Calculer les statistiques
          calculateVideoStats();
          
          setLoading(false);
        } else {
          throw new Error("Aucune donnée utilisateur trouvée");
        }
      } catch (error) {
        console.error("Erreur chargement données:", error);
        setError("Erreur lors du chargement du profil");
        setLoading(false);
        
        // Ne pas rediriger immédiatement, laisser l'utilisateur voir l'erreur
      }
    };

    fetchUserData();
  }, [navigate]);

  // Calculer les statistiques des vidéos
  const calculateVideoStats = () => {
    try {
      const savedNotes = localStorage.getItem('videoNotes');
      if (savedNotes) {
        const videoNotes = JSON.parse(savedNotes);
        const submittedNotes = Object.values(videoNotes).filter(note => note.isSubmitted);
        
        if (submittedNotes.length > 0) {
          const totalRating = submittedNotes.reduce((sum, note) => sum + (note.rating || 0), 0);
          const averageRating = totalRating / submittedNotes.length;
          
          setVideoStats({
            ratedVideos: submittedNotes.length,
            averageRating: parseFloat(averageRating.toFixed(1)),
            commentsCount: submittedNotes.filter(note => note.comment && note.comment.trim()).length,
            activeDays: calculateActiveDays(submittedNotes)
          });
        } else {
          setVideoStats({
            ratedVideos: 0,
            averageRating: 0,
            commentsCount: 0,
            activeDays: 0
          });
        }
      }
    } catch (error) {
      console.error("Erreur calcul statistiques:", error);
    }
  };

  const calculateActiveDays = (notes) => {
    const uniqueDates = new Set();
    notes.forEach(note => {
      if (note.submittedAt) {
        const date = new Date(note.submittedAt).toDateString();
        uniqueDates.add(date);
      }
    });
    return uniqueDates.size;
  };

  // Gérer les changements du formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Sauvegarder les modifications
  const handleSave = async () => {
    // Vérifier l'authentification avant de sauvegarder
    if (!checkAuthentication()) {
      alert('Session expirée. Veuillez vous reconnecter.');
      navigate('/', { replace: true });
      return;
    }
    
    setIsSaving(true);
    
    try {
      const token = localStorage.getItem('authToken');
      const apiUrl = process.env.REACT_APP_API_URL;
      
      if (apiUrl) {
        // Envoyer les modifications à l'API si disponible
        const response = await fetch(`${apiUrl}/api/auth/update-profile`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: formData.name.trim(),
            bio: formData.bio.trim()
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          // Mettre à jour les données locales
          const updatedUser = { ...userData, ...data.user };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUserData(updatedUser);
          alert("Profil mis à jour avec succès !");
        } else {
          throw new Error('Erreur API');
        }
      } else {
        // Si pas d'API, sauvegarder localement
        throw new Error('API non disponible');
      }
    } catch (error) {
      console.log("Sauvegarde locale:", error.message);
      // Sauvegarder localement
      const updatedUser = {
        ...userData,
        name: formData.name.trim(),
        bio: formData.bio.trim()
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUserData(updatedUser);
      alert("Profil mis à jour localement");
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  // Changer l'avatar
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Vérifier l'authentification
    if (!checkAuthentication()) {
      alert('Session expirée. Veuillez vous reconnecter.');
      navigate('/', { replace: true });
      return;
    }
    
    // Vérifications du fichier
    if (file.size > 2 * 1024 * 1024) {
      alert('La taille du fichier ne doit pas dépasser 2MB');
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image (JPG, PNG, etc.)');
      return;
    }
    
    setIsUploading(true);
    
    // Créer un URL temporaire pour l'aperçu
    const tempUrl = URL.createObjectURL(file);
    setFormData(prev => ({ ...prev, avatar: tempUrl }));
    
    try {
      const token = localStorage.getItem('authToken');
      const apiUrl = process.env.REACT_APP_API_URL;
      
      if (apiUrl) {
        const formDataObj = new FormData();
        formDataObj.append('avatar', file);
        
        const response = await fetch(`${apiUrl}/api/auth/upload-avatar`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formDataObj
        });
        
        if (response.ok) {
          const data = await response.json();
          const updatedUser = { ...userData, avatar: data.avatarUrl || tempUrl };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUserData(updatedUser);
          alert("Avatar mis à jour avec succès !");
        } else {
          throw new Error('Erreur API');
        }
      } else {
        throw new Error('API non disponible');
      }
    } catch (error) {
      console.log("Sauvegarde locale de l'avatar:", error.message);
      const updatedUser = { ...userData, avatar: tempUrl };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUserData(updatedUser);
      alert("Avatar mis à jour localement");
    } finally {
      setIsUploading(false);
    }
  };

  // Retour à la page d'accueil
  const handleBack = () => {
    navigate('/home');
  };

  // Déconnexion depuis la page profil
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Date inconnue';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Chargement du profil...</p>
      </div>
    );
  }

  return (
    <div className="profil-container">
      {/* Header */}
      <header className="profil-header">
        <button onClick={handleBack} className="back-button">
          <ArrowLeft size={20} />
          <span>Retour</span>
        </button>
        
        {error && (
          <div className="profile-error-banner">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        
        <div className="header-actions">
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="edit-button"
            disabled={isSaving || isUploading}
          >
            {isEditing ? (
              <>
                <X size={18} />
                <span>Annuler</span>
              </>
            ) : (
              <>
                <Edit size={18} />
                <span>Modifier</span>
              </>
            )}
          </button>
          
          <button 
            onClick={handleLogout} 
            className="logout-button-profile"
          >
            <LogOut size={18} />
            <span>Déconnexion</span>
          </button>
          
          {isEditing && (
            <button 
              onClick={handleSave} 
              className="save-button"
              disabled={isSaving || isUploading}
            >
              <Save size={18} />
              <span>{isSaving ? 'Enregistrement...' : 'Enregistrer'}</span>
            </button>
          )}
        </div>
      </header>

      {/* Contenu principal */}
      <div className="profil-content">
        {/* Section avatar */}
        <div className="avatar-section">
          <div className="avatar-container">
            <img 
              src={formData.avatar} 
              alt="Avatar" 
              className="user-avatar" 
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.name || 'User')}&background=FF2E2E&color=fff&size=150`;
              }}
            />
            
            {isEditing && (
              <div className="avatar-overlay">
                <label htmlFor="avatar-upload" className="avatar-upload-label">
                  <Camera size={24} />
                  <span>{isUploading ? 'Chargement...' : 'Changer'}</span>
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="avatar-upload-input"
                  disabled={isUploading}
                />
              </div>
            )}
          </div>
          
          <div className="avatar-info">
            {isEditing ? (
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="name-input"
                placeholder="Votre nom"
                maxLength="50"
                disabled={isSaving || isUploading}
              />
            ) : (
              <h1 className="user-name">{userData?.name || 'Utilisateur'}</h1>
            )}
            <p className="user-email">
              <Mail size={16} />
              <span>{userData?.email || 'Email non spécifié'}</span>
            </p>
            <p className="join-date">
              <Calendar size={16} />
              <span>Membre depuis: {formatDate(userData?.createdAt)}</span>
            </p>
          </div>
        </div>

        {/* Section informations */}
        <div className="info-section">
          <h2 className="section-title">
            <Settings size={20} />
            <span>Informations personnelles</span>
          </h2>
          
          <div className="info-grid">
            <div className="info-field">
              <label className="field-label">Nom complet</label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="field-input"
                  placeholder="Votre nom"
                  maxLength="50"
                  disabled={isSaving || isUploading}
                />
              ) : (
                <p className="field-value">{userData?.name || 'Non spécifié'}</p>
              )}
            </div>
            
            <div className="info-field">
              <label className="field-label">Email</label>
              <p className="field-value email-disabled">{userData?.email || 'Non spécifié'}</p>
              <small className="email-note">L'email n'est pas modifiable</small>
            </div>
            
            <div className="info-field full-width">
              <label className="field-label">Bio</label>
              {isEditing ? (
                <>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    className="field-textarea"
                    placeholder="Décrivez-vous en quelques mots..."
                    rows="3"
                    maxLength="200"
                    disabled={isSaving || isUploading}
                  />
                  <small className="char-count">
                    {formData.bio.length}/200 caractères
                  </small>
                </>
              ) : (
                <p className="field-value bio-text">
                  {userData?.bio || 'Aucune bio pour le moment...'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section statistiques */}
        <div className="stats-section">
          <h2 className="section-title">Statistiques d'activité</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <Video size={24} />
              </div>
              <div className="stat-value">{videoStats.ratedVideos}</div>
              <div className="stat-label">Vidéos notées</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <Star size={24} />
              </div>
              <div className="stat-value">{videoStats.averageRating.toFixed(1)}</div>
              <div className="stat-label">Note moyenne</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <MessageSquare size={24} />
              </div>
              <div className="stat-value">{videoStats.commentsCount}</div>
              <div className="stat-label">Commentaires</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <Clock size={24} />
              </div>
              <div className="stat-value">{videoStats.activeDays}</div>
              <div className="stat-label">Jours actifs</div>
            </div>
          </div>
          
          {videoStats.ratedVideos === 0 && (
            <div className="no-stats-message">
              <p>Commencez à noter des vidéos pour voir vos statistiques !</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}