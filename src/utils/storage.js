// src/utils/storage.js
const TOKEN_KEY = "authToken";
const USER_DATA_KEY = "userData";

export const storage = {
  setToken: (token) => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      console.error("Erreur de stockage du token:", error);
    }
  },

  getToken: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error("Erreur de récupération du token:", error);
      return null;
    }
  },

  removeToken: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_DATA_KEY);
    } catch (error) {
      console.error("Erreur de suppression du token:", error);
    }
  },

  setUserData: (userData) => {
    try {
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error("Erreur de stockage des données utilisateur:", error);
    }
  },

  getUserData: () => {
    try {
      const data = localStorage.getItem(USER_DATA_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Erreur de récupération des données utilisateur:", error);
      return null;
    }
  },

  clear: () => {
    localStorage.clear();
  }
};