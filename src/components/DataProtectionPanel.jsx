import React, { useState, useEffect } from 'react';
import { EncryptionService } from '../utils/encryptionService';
import { DataProtection } from '../utils/dataProtection';

const DataProtectionPanel = () => {
  const [protectionStatus, setProtectionStatus] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    checkProtectionStatus();
  }, []);

  const checkProtectionStatus = () => {
    const status = {
      encryptionWorking: EncryptionService.testEncryption(),
      hasParticipants: false,
      protectedParticipants: 0,
      totalParticipants: 0
    };

    // Vérifier les données existantes
    try {
      const tickets = JSON.parse(localStorage.getItem('tombolaTickets') || '[]');
      status.totalParticipants = tickets.length;
      status.protectedParticipants = tickets.filter(t => t.protectedData).length;
      status.hasParticipants = tickets.length > 0;
    } catch (error) {
      console.error('Erreur vérification données:', error);
    }

    setProtectionStatus(status);
  };

  const testProtection = () => {
    setIsTesting(true);
    
    setTimeout(() => {
      const testData = {
        name: 'Jean Dupont',
        email: 'jean.dupont@example.com',
        phone: '+33612345678'
      };
      
      const protectedData = DataProtection.protectParticipant(testData);
      const unprotectedData = DataProtection.unprotectParticipant(protectedData);
      
      const success = JSON.stringify(testData) === JSON.stringify(unprotectedData);
      
      alert(success ? '✅ Protection des données fonctionne !' : '❌ Erreur de protection');
      setIsTesting(false);
      checkProtectionStatus();
    }, 500);
  };

  const migrateExistingData = () => {
    const tickets = JSON.parse(localStorage.getItem('tombolaTickets') || '[]');
    let migrated = 0;
    
    tickets.forEach((ticket, index) => {
      if (!ticket.protectedData && (ticket.email || ticket.phone)) {
        // 🎯 MIGRER LES ANCIENNES DONNÉES
        tickets[index] = {
          publicData: ticket.publicData || {
            ticketNumber: ticket.number,
            purchaseDate: ticket.purchaseDate,
            ticketPrice: ticket.price,
            isDrawn: ticket.isDrawn
          },
          protectedData: DataProtection.protectParticipant({
            name: ticket.participant || ticket.name,
            email: ticket.email,
            phone: ticket.phone
          })
        };
        migrated++;
      }
    });
    
    localStorage.setItem('tombolaTickets', JSON.stringify(tickets));
    alert(`✅ ${migrated} participants migrés vers la protection`);
    checkProtectionStatus();
  };

  if (!protectionStatus) return <div>Chargement...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🛡️ Protection des Données</h1>

        {/* STATUT */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">📊 Statut de Protection</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Système de chiffrement:</span>
              <span className={protectionStatus.encryptionWorking ? 'text-green-400' : 'text-red-400'}>
                {protectionStatus.encryptionWorking ? '✅ ACTIF' : '❌ INACTIF'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>Participants protégés:</span>
              <span>{protectionStatus.protectedParticipants} / {protectionStatus.totalParticipants}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Taux de protection:</span>
              <span className={
                protectionStatus.totalParticipants === protectionStatus.protectedParticipants ? 
                'text-green-400' : 'text-yellow-400'
              }>
                {protectionStatus.totalParticipants > 0 ? 
                  Math.round((protectionStatus.protectedParticipants / protectionStatus.totalParticipants) * 100) : 0
                }%
              </span>
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">⚡ Actions</h2>
          
          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={testProtection}
              disabled={isTesting}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 p-4 rounded-lg font-semibold transition"
            >
              {isTesting ? '🧪 Test en cours...' : '🧪 Tester la protection'}
            </button>
            
            {protectionStatus.totalParticipants > 0 && (
              <button
                onClick={migrateExistingData}
                className="bg-green-600 hover:bg-green-700 p-4 rounded-lg font-semibold transition"
              >
                🔄 Protéger les données existantes
              </button>
            )}
            
            <button
              onClick={() => window.location.hash = '#/admin'}
              className="bg-gray-600 hover:bg-gray-700 p-4 rounded-lg font-semibold transition"
            >
              ← Retour Admin
            </button>
          </div>
        </div>

        {/* INFORMATIONS */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">💡 Informations</h2>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <span>🔐</span>
              <span>Les emails et téléphones sont maintenant chiffrés dans le stockage local</span>
            </div>
            
            <div className="flex items-start gap-2">
              <span>👁️</span>
              <span>Seul l'administrateur peut voir les données déchiffrées</span>
            </div>
            
            <div className="flex items-start gap-2">
              <span>🔄</span>
              <span>Les nouvelles données sont automatiquement protégées</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataProtectionPanel;
