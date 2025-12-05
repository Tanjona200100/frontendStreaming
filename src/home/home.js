import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, Settings, Maximize, ThumbsUp, ThumbsDown, User, Bell, LogOut, Check, Star, MessageSquare, X } from 'lucide-react';
import './home.css';

export default function YouTubeInterface() {
  const [selectedVideo, setSelectedVideo] = useState(0);
  const [videoStates, setVideoStates] = useState(Array(4).fill({ isPlaying: false, progress: 27 }));
  const videoRefs = useRef(Array(4).fill(null));
  
  // Tableau pour stocker les vidéos sélectionnées (4 max)
  const [selectedVideos, setSelectedVideos] = useState([0, 1, 2, 3]);
  
  // État pour les notes et commentaires
  const [showNoteForm, setShowNoteForm] = useState(null); // null ou index de la vidéo
  const [videoNotes, setVideoNotes] = useState(
    Array(4).fill({ rating: 0, comment: '', isSubmitted: false })
  );

  const allVideos = [
    { 
      id: 0,
      title: "Ancient Temple Exploration", 
      thumbnail: "https://images.unsplash.com/photo-1516815231560-8f41ec531527?w=800&h=450&fit=crop",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      viewers: "2.3K"
    },
    { 
      id: 1,
      title: "Desert Ruins Discovery", 
      thumbnail: "https://images.unsplash.com/photo-1512753360435-329c4535a9a7?w=800&h=450&fit=crop",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      viewers: "1.8K"
    },
    { 
      id: 2,
      title: "Archaeological Site Tour", 
      thumbnail: "https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?w=800&h=450&fit=crop",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      viewers: "3.1K"
    },
    { 
      id: 3,
      title: "Historical Monument Live", 
      thumbnail: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=450&fit=crop",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      viewers: "1.5K"
    },
    { 
      id: 4,
      title: "Pyramids Night View", 
      thumbnail: "https://images.unsplash.com/photo-1503756234508-e32369269deb?w=800&h=450&fit=crop",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
      viewers: "4.2K"
    },
    { 
      id: 5,
      title: "Roman Colosseum Tour", 
      thumbnail: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&h=450&fit=crop",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
      viewers: "5.1K"
    },
    { 
      id: 6,
      title: "Machu Picchu Sunrise", 
      thumbnail: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800&h=450&fit=crop",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
      viewers: "3.8K"
    },
    { 
      id: 7,
      title: "Petra Treasury Live", 
      thumbnail: "https://images.unsplash.com/photo-1578895101408-1a36b834405b?w=800&h=450&fit=crop",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
      viewers: "2.9K"
    }
  ];

  const relatedVideos = [
    { title: "LOST CIVILIZATIONS", thumbnail: "ancient-ruins-1" },
    { title: "ARCHAEOLOGICAL DISCOVERIES", thumbnail: "ancient-ruins-2" },
    { title: "MYSTERY OF THE PYRAMIDS", thumbnail: "pyramids-1" },
    { title: "MYSTERY OF THE PYRAMIDS", thumbnail: "pyramids-2" }
  ];

  const trendingVideos = [
    { title: "HAMADRENAS", thumbnail: "trending-1" },
    { title: "EXPLORING ANCIENT RUINS", thumbnail: "trending-2" },
    { title: "EXPLORING ANCIENT RUINS", thumbnail: "trending-3" },
    { title: "NIGHT EXPLORATION", thumbnail: "trending-4" },
    { title: "ANCIENT SITES", thumbnail: "trending-5" },
    { title: "HISTORICAL PLACES", thumbnail: "trending-6" }
  ];

  const comments = [
    { name: "User 1", text: "His learn ndley yand bve anather", subtext: "Lesson ared13 Me puger diit" },
    { name: "User 2", text: "Rave inally at hasleat", subtext: "Sd lerle us" }
  ];

  // Fonction pour obtenir la disposition
  const getVideoLayout = () => {
    const count = selectedVideos.filter(id => id !== null).length;
    return count;
  };

  // Obtenir les vidéos affichées
  const displayedVideos = selectedVideos.map(id => 
    id !== null ? allVideos.find(video => video.id === id) || null : null
  );

  const toggleVideoPlayback = (index) => {
    const video = videoRefs.current[index];
    if (!video) return;

    setVideoStates(prev => {
      const newStates = [...prev];
      newStates[index] = {
        ...newStates[index],
        isPlaying: !newStates[index].isPlaying
      };
      return newStates;
    });

    if (videoStates[index].isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const handleVideoTimeUpdate = (index) => {
    return () => {
      const video = videoRefs.current[index];
      if (!video) return;

      const progress = (video.currentTime / video.duration) * 100;
      setVideoStates(prev => {
        const newStates = [...prev];
        newStates[index] = {
          ...newStates[index],
          progress: progress
        };
        return newStates;
      });
    };
  };

  const toggleVideoSelection = (videoId) => {
    if (selectedVideos.includes(videoId)) {
      const newSelectedVideos = selectedVideos.filter(id => id !== videoId);
      while (newSelectedVideos.length < 4) {
        newSelectedVideos.push(null);
      }
      setSelectedVideos(newSelectedVideos.slice(0, 4));
    } else if (selectedVideos.filter(id => id !== null).length < 4) {
      const newSelectedVideos = [...selectedVideos];
      const emptyIndex = newSelectedVideos.findIndex(id => id === null);
      if (emptyIndex !== -1) {
        newSelectedVideos[emptyIndex] = videoId;
      } else {
        newSelectedVideos[0] = videoId;
      }
      setSelectedVideos(newSelectedVideos);
    } else {
      alert("Maximum 4 vidéos peuvent être sélectionnées.");
    }
  };

  // Fonctions pour gérer les notes et commentaires
  const handleNoteButtonClick = (index) => {
    setShowNoteForm(showNoteForm === index ? null : index);
  };

  const handleRatingChange = (index, rating) => {
    setVideoNotes(prev => {
      const newNotes = [...prev];
      newNotes[index] = {
        ...newNotes[index],
        rating: rating
      };
      return newNotes;
    });
  };

  const handleCommentChange = (index, comment) => {
    setVideoNotes(prev => {
      const newNotes = [...prev];
      newNotes[index] = {
        ...newNotes[index],
        comment: comment
      };
      return newNotes;
    });
  };

  const submitNote = (index) => {
    if (videoNotes[index].rating > 0) {
      setVideoNotes(prev => {
        const newNotes = [...prev];
        newNotes[index] = {
          ...newNotes[index],
          isSubmitted: true
        };
        return newNotes;
      });
      setShowNoteForm(null);
    } else {
      alert("Veuillez donner une note avant de soumettre.");
    }
  };

  const getVideoGridClasses = () => {
    const count = getVideoLayout();
    let classes = 'video-grid';
    
    switch(count) {
      case 1:
        classes += ' single-video';
        break;
      case 2:
        classes += ' two-videos';
        break;
      case 3:
        classes += ' three-videos';
        break;
      case 4:
        classes += ' four-videos';
        break;
      default:
        classes += ' four-videos';
    }
    
    return classes;
  };

  const handleLogout = () => {
    console.log("Déconnexion...");
  };

  const handleNotifications = () => {
    console.log("Notifications...");
  };

  return (
    <div className="home-container">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <div className="logo-container">
            <Play className="logo-icon" />
          </div>
        </div>
        
        <div className="video-selectors">
          <div className="selector-group simple-selector">
            <label className="selector-label">Sélection des vidéos:</label>
            <div className="dropdown-container">
              <div className="dropdown-header">
                <span className="dropdown-label">
                  {selectedVideos.filter(id => id !== null).length} vidéo(s) sélectionnée(s)
                </span>
              </div>
              
              <div className="dropdown-content">
                {allVideos.map((video) => (
                  <div 
                    key={video.id} 
                    className="dropdown-item"
                    onClick={() => toggleVideoSelection(video.id)}
                  >
                    <div className="item-checkbox">
                      <input
                        type="checkbox"
                        id={`video-${video.id}`}
                        checked={selectedVideos.includes(video.id)}
                        onChange={() => {}}
                        className="checkbox-input"
                      />
                      <label htmlFor={`video-${video.id}`} className="checkbox-label">
                        {selectedVideos.includes(video.id) && (
                          <Check className="check-icon" />
                        )}
                      </label>
                    </div>
                    <span className="item-title">{video.title}</span>
                    <span className="item-viewers">({video.viewers})</span>
                  </div>
                ))}
              </div>
              
              <div className="selection-info">
                <small>Sélectionnez jusqu'à 4 vidéos maximum</small>
              </div>
            </div>
          </div>
        </div>

        <div className="header-right">
          <button onClick={handleLogout} className="header-button logout-button">
            <LogOut className="header-icon" />
            <span>Déconnexion</span>
          </button>
          <button onClick={handleNotifications} className="header-button notifications-button">
            <Bell className="header-icon" />
            <span>Notifications</span>
          </button>
          <div className="user-profile">
            <User className="profile-icon" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="main-content">
        {/* Video Player Section */}
        <div className="video-section">
          {/* Video Player */}
          <div className="video-player">
            <div className={getVideoGridClasses()}>
              {displayedVideos.map((video, index) => (
                video !== null ? (
                  <div 
                    key={index} 
                    className={`video-grid-item ${getVideoLayout() === 1 ? 'fullscreen-video' : ''}`}
                    style={{ 
                      border: selectedVideo === index ? '3px solid var(--color-accent)' : '2px solid transparent' 
                    }}
                    onClick={() => video && setSelectedVideo(index)}
                  >
                    <div className="video-container">
                      <video
                        ref={el => videoRefs.current[index] = el}
                        src={video.videoUrl}
                        className="live-video-element"
                        onTimeUpdate={handleVideoTimeUpdate(index)}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleVideoPlayback(index);
                        }}
                      />
                      <div className="live-overlay">
                        <div className="live-badge">LIVE</div>
                        <div className="viewer-count">👁 {video.viewers}</div>
                        <button 
                          className="note-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNoteButtonClick(index);
                          }}
                        >
                          <Star className="note-icon" />
                          <span>Note</span>
                        </button>
                      </div>
                      
                      <div className="individual-controls">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleVideoPlayback(index);
                          }}
                          className="mini-play-button"
                        >
                          <div className="mini-play-icon">
                            {videoStates[index]?.isPlaying ? 
                              <Pause className="play-icon-small" /> : 
                              <Play className="play-icon-small" />
                            }
                          </div>
                        </button>
                        
                        <div className="individual-progress-container">
                          <div className="individual-progress-bar">
                            <div 
                              className="individual-progress-fill"
                              style={{ width: `${videoStates[index]?.progress || 0}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="individual-control-buttons">
                          <button className="individual-control-button">
                            <Volume2 className="control-icon-small" />
                          </button>
                          <button className="individual-control-button">
                            <Settings className="control-icon-small" />
                          </button>
                          <button className="individual-control-button">
                            <Maximize className="control-icon-small" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="video-info">
                      <h3 className="live-video-title">{video.title}</h3>
                      {videoNotes[index]?.isSubmitted && (
                        <div className="video-rating-display">
                          <div className="rating-stars">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star}
                                className={`star-icon ${star <= videoNotes[index].rating ? 'filled' : ''}`}
                                size={14}
                              />
                            ))}
                          </div>
                          {videoNotes[index].comment && (
                            <div className="video-comment-preview">
                              <MessageSquare size={12} />
                              <span>{videoNotes[index].comment.substring(0, 20)}...</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : null
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar - Notes et Commentaires */}
        <div className="notes-sidebar">
          <h3 className="sidebar-title">NOTES ET COMMENTAIRES</h3>
          
          {showNoteForm !== null && displayedVideos[showNoteForm] && (
            <div className="note-form-container">
              <div className="note-form-header">
                <h4>Ajouter une note pour : {displayedVideos[showNoteForm].title}</h4>
                <button 
                  className="close-note-form"
                  onClick={() => setShowNoteForm(null)}
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="rating-input">
                <p>Note :</p>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      className={`star-button ${star <= videoNotes[showNoteForm].rating ? 'active' : ''}`}
                      onClick={() => handleRatingChange(showNoteForm, star)}
                    >
                      <Star size={28} />
                    </button>
                  ))}
                </div>
                <div className="rating-value">
                  {videoNotes[showNoteForm].rating}/5
                </div>
              </div>
              
              <div className="comment-input">
                <label htmlFor={`comment-${showNoteForm}`}>Commentaire :</label>
                <textarea
                  id={`comment-${showNoteForm}`}
                  value={videoNotes[showNoteForm].comment}
                  onChange={(e) => handleCommentChange(showNoteForm, e.target.value)}
                  placeholder="Ajoutez un commentaire (optionnel)"
                  rows="4"
                />
              </div>
              
              <button 
                className="submit-note-button"
                onClick={() => submitNote(showNoteForm)}
              >
                Soumettre la note
              </button>
            </div>
          )}
          
          <div className="notes-summary">
            <h4>Résumé des notes :</h4>
            {displayedVideos.map((video, index) => (
              video !== null && videoNotes[index]?.isSubmitted ? (
                <div key={index} className="note-summary-item">
                  <div className="note-video-info">
                    <div className="note-video-title">{video.title}</div>
                    <div className="note-rating">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star}
                          className={`star-summary ${star <= videoNotes[index].rating ? 'filled' : ''}`}
                          size={16}
                        />
                      ))}
                      <span className="rating-text">{videoNotes[index].rating}/5</span>
                    </div>
                  </div>
                  {videoNotes[index].comment && (
                    <div className="note-comment">
                      <MessageSquare size={14} />
                      <p>{videoNotes[index].comment}</p>
                    </div>
                  )}
                </div>
              ) : null
            ))}
            {!displayedVideos.some((video, index) => video !== null && videoNotes[index]?.isSubmitted) && (
              <div className="no-notes-message">
                <Star size={40} className="no-notes-icon" />
                <p>Aucune note soumise pour le moment</p>
                <small>Cliquez sur le bouton "Note" d'une vidéo pour commencer</small>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}