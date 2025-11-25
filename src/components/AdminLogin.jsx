import React, { useState } from 'react';
import { Auth } from '../utils/auth';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [securityCode, setSecurityCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // ✅ VÉRIFICATION AVEC CODE DE SÉCURITÉ
      const result = Auth.login(email, password, securityCode);
      
      if (result.success) {
        console.log('✅ Connexion réussie, redirection...');
        // Journaliser la connexion
        Auth.logActivity('admin_login', {
          email: email,
          ip: 'client', // En production, récupérer l'IP réelle
          userAgent: navigator.userAgent
        });
        
        // Redirection vers le panel admin
        window.location.hash = '#/admin';
      } else {
        setError(result.message || '❌ Identifiants ou code de sécurité incorrect');
        
        // Journaliser la tentative échouée
        Auth.logActivity('failed_login_attempt', {
          email: email,
          reason: 'invalid_credentials'
        });
      }
    } catch (error) {
      setError('❌ Erreur de connexion: ' + error.message);
      console.error('Erreur connexion admin:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetForm = () => {
    setEmail('');
    setPassword('');
    setSecurityCode('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        
        {/* En-tête */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white text-center">
          <div className="text-4xl mb-2">🔐</div>
          <h1 className="text-3xl font-bold">Connexion Admin</h1>
          <p className="opacity-90 mt-2">Accès sécurisé au panel d'administration</p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-700">
                <span className="text-lg">❌</span>
                <div>
                  <div className="font-semibold">Erreur de connexion</div>
                  <div className="text-sm mt-1">{error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Champ Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                📧 Email Administrateur
              </span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              placeholder="admin@tombola.com"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              required
              disabled={isLoading}
            />
          </div>

          {/* Champ Mot de passe */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                🔒 Mot de passe
              </span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="Votre mot de passe administrateur"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              required
              disabled={isLoading}
            />
          </div>

          {/* Champ Code de Sécurité */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                🛡️ Code de Sécurité
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  Requis
                </span>
              </span>
            </label>
            <input
              type="password"
              value={securityCode}
              onChange={(e) => {
                setSecurityCode(e.target.value.toUpperCase());
                setError('');
              }}
              placeholder="Entrez le code de sécurité"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition font-mono"
              required
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Code de sécurité administrateur requis pour l'accès
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Connexion...
                </>
              ) : (
                <>
                  <span>🚀</span>
                  Se connecter
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={handleResetForm}
              disabled={isLoading}
              className="px-6 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold transition"
            >
              Effacer
            </button>
          </div>

          {/* Informations de sécurité */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <span>ℹ️</span>
              Informations de sécurité
            </h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li className="flex items-center gap-2">
                <span className="text-blue-500">⏱️</span>
                Session valide 24 heures maximum
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500">🔒</span>
                Authentification à 3 facteurs requise
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500">📝</span>
                Toutes les actions sont journalisées
              </li>
            </ul>
          </div>

          {/* Informations de test (À RETIRER EN PRODUCTION) */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
              <span>💡</span>
              Informations de test
            </h3>
            <div className="text-sm text-yellow-700 space-y-1">
              <div className="font-mono bg-yellow-100 px-2 py-1 rounded">
                Email: admin@tombola.com
              </div>
              <div className="font-mono bg-yellow-100 px-2 py-1 rounded">
                Mot de passe: admin123
              </div>
              <div className="font-mono bg-yellow-100 px-2 py-1 rounded">
                Code sécurité: TOMBOLA2024
              </div>
            </div>
            <p className="text-xs text-yellow-600 mt-2">
              ⚠️ <strong>Important :</strong> Changez ces informations en production !
            </p>
          </div>
        </form>

        {/* Pied de page */}
        <div className="bg-gray-50 p-4 text-center">
          <div className="text-sm text-gray-600 space-y-1">
            <p>🔒 Accès réservé aux administrateurs autorisés</p>
            <p className="text-xs">Toute tentative non autorisée sera journalisée</p>
          </div>
          
          {/* Lien retour accueil */}
          <div className="mt-3">
            <a 
              href="#/" 
              className="text-purple-600 hover:text-purple-700 text-sm font-medium transition"
            >
              ← Retour à l'accueil
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
