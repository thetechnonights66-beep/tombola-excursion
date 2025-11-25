import React, { useState } from 'react';
import { Auth } from '../utils/auth';

const AdminSecurity = () => {
  const [currentCode, setCurrentCode] = useState('');
  const [newCode, setNewCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [message, setMessage] = useState('');

  const handleUpdateCode = (e) => {
    e.preventDefault();
    
    if (!Auth.isAuthenticated()) {
      setMessage('❌ Vous devez être connecté');
      return;
    }

    if (newCode !== confirmCode) {
      setMessage('❌ Les codes ne correspondent pas');
      return;
    }

    if (newCode.length < 6) {
      setMessage('❌ Le code doit faire au moins 6 caractères');
      return;
    }

    // Vérifier le code actuel
    if (!Auth.validateSecurityCode(currentCode)) {
      setMessage('❌ Code actuel incorrect');
      return;
    }

    // Mettre à jour le code
    if (Auth.updateSecurityCode(newCode)) {
      setMessage('✅ Code de sécurité mis à jour avec succès');
      setCurrentCode('');
      setNewCode('');
      setConfirmCode('');
    } else {
      setMessage('❌ Erreur lors de la mise à jour');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-6">🛡️ Sécurité Admin</h1>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <form onSubmit={handleUpdateCode} className="space-y-4">
            
            {message && (
              <div className={`p-3 rounded-lg text-center ${
                message.includes('✅') ? 'bg-green-500' : 'bg-red-500'
              }`}>
                {message}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold mb-2">
                Code de sécurité actuel
              </label>
              <input
                type="password"
                value={currentCode}
                onChange={(e) => setCurrentCode(e.target.value)}
                className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600"
                placeholder="Code actuel"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Nouveau code de sécurité
              </label>
              <input
                type="password"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600"
                placeholder="Nouveau code (min. 6 caractères)"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Confirmer le nouveau code
              </label>
              <input
                type="password"
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value)}
                className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600"
                placeholder="Confirmer le code"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-semibold transition"
            >
              🔐 Mettre à jour le code de sécurité
            </button>
          </form>
        </div>

        <div className="mt-6 bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
          <h3 className="font-semibold mb-2">💡 Recommandations de sécurité</h3>
          <ul className="text-sm space-y-1 text-yellow-200">
            <li>• Utilisez un code d'au moins 8 caractères</li>
            <li>• Mélangez lettres, chiffres et caractères spéciaux</li>
            <li>• Ne partagez jamais le code</li>
            <li>• Changez le code régulièrement</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminSecurity;
