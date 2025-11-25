// src/utils/auth.js - VERSION AVEC CODE DE SÉCURITÉ AMÉLIORÉE
export const Auth = {
  // ✅ CODE ADMIN CONFIGURABLE
  ADMIN_CREDENTIALS: {
    email: 'admin@tombola.com',
    password: 'admin123', // 🔒 Changez ce mot de passe
    securityCode: 'TOMBOLA2024' // 🔐 Code de sécurité requis
  },

  // ✅ VÉRIFICATION AVEC CODE
  login(email, password, securityCode = '') {
    // Vérification des credentials
    if (email === this.ADMIN_CREDENTIALS.email && 
        password === this.ADMIN_CREDENTIALS.password &&
        securityCode === this.ADMIN_CREDENTIALS.securityCode) {
      
      const user = {
        email: email,
        name: 'Administrateur Tombola',
        role: 'admin',
        loginTime: new Date().toISOString(),
        sessionId: Math.random().toString(36).substring(2, 15),
        permissions: this.getUserPermissions(email)
      };
      
      localStorage.setItem('adminUser', JSON.stringify(user));
      localStorage.setItem('adminToken', this.generateToken());
      
      console.log('✅ Connexion admin réussie');
      return { success: true, user: user };
    }
    
    console.log('❌ Échec connexion admin');
    return { success: false, message: 'Identifiants incorrects' };
  },

  // ✅ GÉNÉRATION DE TOKEN
  generateToken() {
    return 'admin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },

  // ✅ VÉRIFICATION AUTHENTIFICATION
  isAuthenticated() {
    const user = localStorage.getItem('adminUser');
    const token = localStorage.getItem('adminToken');
    
    if (!user || !token) {
      return false;
    }
    
    // Vérifier si le token est expiré (24h)
    try {
      const tokenParts = token.split('_');
      const tokenTime = parseInt(tokenParts[1]);
      const now = Date.now();
      const tokenAge = now - tokenTime;
      
      // Token expiré après 24 heures
      if (tokenAge > 24 * 60 * 60 * 1000) {
        this.logout();
        return false;
      }
      
      return true;
    } catch (error) {
      this.logout();
      return false;
    }
  },

  // ✅ RÉCUPÉRATION UTILISATEUR
  getCurrentUser() {
    if (this.isAuthenticated()) {
      return JSON.parse(localStorage.getItem('adminUser'));
    }
    return null;
  },

  // ✅ DÉCONNEXION
  logout() {
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminToken');
    console.log('🔒 Admin déconnecté');
  },

  // ✅ VÉRIFICATION DU CODE DE SÉCURITÉ
  validateSecurityCode(code) {
    return code === this.ADMIN_CREDENTIALS.securityCode;
  },

  // ✅ CHANGEMENT DU CODE DE SÉCURITÉ
  updateSecurityCode(newCode) {
    if (newCode && newCode.length >= 6) {
      this.ADMIN_CREDENTIALS.securityCode = newCode;
      console.log('🔐 Code de sécurité mis à jour');
      return true;
    }
    return false;
  },

  // ✅ PROTÉGER UNE ROUTE - REDIRIGE VERS LOGIN SI NON AUTHENTIFIÉ
  requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.hash = '#/admin-login';
      return false;
    }
    return true;
  },

  // ✅ ACCÈS DIRECT À L'ADMIN (POUR DÉVELOPPEMENT)
  directAccess() {
    // Cette fonction permet d'accéder directement à l'admin
    // en connaissant l'URL exacte - À UTILISER AVEC PRÉCAUTION
    return true;
  },

  // ✅ FONCTION POUR METTRE À JOUR LES INFOS UTILISATEUR
  updateUserInfo(userInfo) {
    if (this.isAuthenticated()) {
      const currentUser = this.getCurrentUser() || {};
      const updatedUser = { ...currentUser, ...userInfo };
      localStorage.setItem('adminUser', JSON.stringify(updatedUser));
      return updatedUser;
    }
    return null;
  },

  // ✅ FONCTION POUR VÉRIFIER LES PERMISSIONS SPÉCIFIQUES
  hasPermission(permission) {
    const user = this.getCurrentUser();
    if (!user || !user.permissions) return false;

    return user.permissions.includes(permission);
  },

  // ✅ OBTENIR LES PERMISSIONS DE L'UTILISATEUR
  getUserPermissions(email) {
    const permissions = {
      // Permissions de base pour tous les admins
      base: ['ticket_management', 'view_analytics', 'view_dashboard'],
      
      // Permissions avancées pour super admin
      advanced: ['user_management', 'system_settings', 'payment_management', 'export_data']
    };

    // Définir les emails super admin
    const superAdminEmails = [
      'votre-email@admin.com', // ⚠️ REMPLACEZ PAR VOTRE EMAIL
      'superadmin@tombola.com'
    ];

    if (superAdminEmails.includes(email)) {
      return [...permissions.base, ...permissions.advanced];
    }

    return permissions.base;
  },

  // ✅ FONCTION POUR OBTENIR LE TEMPS DE SESSION
  getSessionDuration() {
    const user = this.getCurrentUser();
    if (!user || !user.loginTime) return '0min';
    
    const loginTime = new Date(user.loginTime);
    const now = new Date();
    const diffMs = now - loginTime;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins}min`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h${mins}min`;
    }
  },

  // ✅ FONCTION POUR VALIDER LA SESSION (EXPIRATION)
  validateSession() {
    const user = this.getCurrentUser();
    if (!user || !user.loginTime) {
      this.logout();
      return false;
    }

    // Session expire après 8 heures
    const loginTime = new Date(user.loginTime);
    const now = new Date();
    const sessionDuration = now - loginTime;
    const maxSessionDuration = 8 * 60 * 60 * 1000; // 8 heures en millisecondes

    if (sessionDuration > maxSessionDuration) {
      this.logout();
      return false;
    }

    return true;
  },

  // ✅ SAUVEGARDER LA CONFIGURATION ADMIN
  saveAdminConfig(config) {
    if (this.hasPermission('system_settings')) {
      try {
        localStorage.setItem('adminConfig', JSON.stringify(config));
        return true;
      } catch (error) {
        console.error('Erreur sauvegarde config:', error);
        return false;
      }
    }
    return false;
  },

  // ✅ CHARGER LA CONFIGURATION ADMIN
  loadAdminConfig() {
    try {
      const config = localStorage.getItem('adminConfig');
      return config ? JSON.parse(config) : {};
    } catch (error) {
      console.error('Erreur chargement config:', error);
      return {};
    }
  },

  // ✅ JOURNALISATION DES ACTIVITÉS ADMIN
  logActivity(action, details = {}) {
    if (!this.isAuthenticated()) return;

    const user = this.getCurrentUser();
    const activity = {
      action,
      user: user.email,
      timestamp: new Date().toISOString(),
      details,
      sessionId: user.sessionId
    };

    // Sauvegarder dans le localStorage (limité à 50 activités)
    try {
      const activities = JSON.parse(localStorage.getItem('adminActivities') || '[]');
      activities.unshift(activity);
      
      // Garder seulement les 50 dernières activités
      if (activities.length > 50) {
        activities.pop();
      }
      
      localStorage.setItem('adminActivities', JSON.stringify(activities));
    } catch (error) {
      console.error('Erreur journalisation:', error);
    }
  },

  // ✅ RÉCUPÉRER LES ACTIVITÉS RÉCENTES
  getRecentActivities(limit = 10) {
    try {
      const activities = JSON.parse(localStorage.getItem('adminActivities') || '[]');
      return activities.slice(0, limit);
    } catch (error) {
      console.error('Erreur récupération activités:', error);
      return [];
    }
  },

  // ✅ VÉRIFIER LA FORCE DU MOT DE PASSE
  validatePasswordStrength(password) {
    const requirements = {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const strength = Object.values(requirements).filter(Boolean).length;
    
    return {
      strength,
      requirements,
      isValid: strength >= 4 // Au moins 4 conditions sur 5
    };
  }
};
