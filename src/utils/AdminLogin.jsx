import React, { useState, useEffect } from 'react';
import { Auth } from '../utils/auth';

const AdminPanel = () => {
  const [participants, setParticipants] = useState([]);
  const [winners, setWinners] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // ✅ CORRECTION : GESTION CORRECTE DE L'AUTHENTIFICATION
  useEffect(() => {
    console.log('🔐 Vérification authentification AdminPanel...');
    
    const checkAuthentication = () => {
      const user = Auth.getCurrentUser();
      const authStatus = Auth.isAuthenticated();
      
      console.log('🔐 Statut auth:', authStatus);
      console.log('🔐 Utilisateur:', user);
      
      if (authStatus && user) {
        setIsAuthenticated(true);
        setCurrentUser(user);
        console.log('✅ Accès admin autorisé');
        
        // Charger les participants une fois authentifié
        loadParticipants();
      } else {
        console.log('❌ Non authentifié, redirection...');
        window.location.hash = '#/admin-login';
      }
      
      setIsCheckingAuth(false);
    };

    checkAuthentication();
  }, []);

  // ✅ FONCTION POUR CHARGER LES PARTICIPANTS
  const loadParticipants = () => {
    console.log('📥 Chargement des participants...');
    
    // Remplacer par vos vraies données
    const mockParticipants = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      name: `Participant ${i + 1}`,
      email: `participant${i + 1}@email.com`,
      tickets: Math.floor(Math.random() * 5) + 1,
      numbers: Array.from({ length: 5 }, () => Math.floor(Math.random() * 1000))
    }));
    
    setParticipants(mockParticipants);
    console.log(`✅ ${mockParticipants.length} participants chargés`);
  };

  // ✅ CORRECTION : VÉRIFICATION AUTH DANS STARTDRAW
  const startDraw = () => {
    console.log('🎯 Début du tirage...');
    
    if (!Auth.isAuthenticated()) {
      console.log('❌ Auth perdue, redirection');
      window.location.hash = '#/admin-login';
      return;
    }

    if (participants.length === 0) {
      alert('Aucun participant pour le tirage!');
      return;
    }

    setIsDrawing(true);
    console.log('🎲 Tirage en cours...');
    
    // Simuler le tirage
    setTimeout(() => {
      const winnerIndex = Math.floor(Math.random() * participants.length);
      const winner = participants[winnerIndex];
      const winningNumber = winner.numbers[Math.floor(Math.random() * winner.numbers.length)];
      
      const newWinner = {
        participant: winner.name,
        ticketNumber: winningNumber,
        prize: `Lot ${winners.length + 1}`,
        time: new Date().toLocaleTimeString(),
        drawId: Date.now()
      };
      
      setWinners(prev => [...prev, newWinner]);
      setIsDrawing(false);
      
      // ✅ JOURNALISER L'ACTIVITÉ
      Auth.logActivity('tirage_effectue', {
        gagnant: winner.name,
        ticket: winningNumber,
        lot: newWinner.prize
      });
      
      console.log('✅ Tirage terminé:', newWinner);
    }, 3000);
  };

  // ✅ CORRECTION : DÉCONNEXION SÉCURISÉE
  const handleLogout = () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      console.log('🔒 Déconnexion admin');
      Auth.logout();
      window.location.hash = '#/';
    }
  };

  // ✅ CORRECTION : GESTION DES ÉTATS DE CHARGEMENT
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          Vérification de sécurité...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">
          <div className="text-red-500 text-4xl mb-4">🔒</div>
          Accès non autorisé - Redirection...
          <button 
            onClick={() => window.location.hash = '#/admin-login'}
            className="ml-4 bg-blue-500 px-4 py-2 rounded hover:bg-blue-600 transition"
          >
            Page de connexion
          </button>
        </div>
      </div>
    );
  }

  // ✅ CALCUL DES STATISTIQUES
  const totalTickets = participants.reduce((sum, p) => sum + p.tickets, 0);
  const totalRevenue = participants.reduce((sum, p) => sum + p.tickets * 5, 0);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* ✅ EN-TÊTE AVEC INFOS SÉCURITÉ */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">🎮 Panel Admin Tombola</h1>
            <p className="text-gray-400 mt-2">
              Connecté en tant que <span className="text-blue-400">{currentUser?.name}</span> • 
              Session: <span className="text-green-400">{Auth.getSessionDuration()}</span>
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-semibold transition"
          >
            🔒 Déconnexion
          </button>
        </div>

        {/* ✅ BANNIÈRE DE SÉCURITÉ */}
        <div className="bg-green-600 border border-green-700 rounded-lg p-4 mb-8">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🛡️</span>
            <div>
              <div className="font-semibold">Session administrateur active</div>
              <div className="text-sm opacity-90">
                Dernière activité: {new Date().toLocaleTimeString()} • 
                Email: {currentUser?.email}
              </div>
            </div>
          </div>
        </div>

        {/* ✅ STATISTIQUES */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-600 p-4 rounded-lg">
            <div className="text-2xl font-bold">{participants.length}</div>
            <div>Participants</div>
          </div>
          <div className="bg-green-600 p-4 rounded-lg">
            <div className="text-2xl font-bold">{totalTickets}</div>
            <div>Tickets vendus</div>
          </div>
          <div className="bg-purple-600 p-4 rounded-lg">
            <div className="text-2xl font-bold">{winners.length}</div>
            <div>Gagnants</div>
          </div>
          <div className="bg-yellow-600 p-4 rounded-lg">
            <div className="text-2xl font-bold">{totalRevenue}€</div>
            <div>Recettes totales</div>
          </div>
        </div>

        {/* ✅ BOUTON TIRAGE */}
        <div className="text-center mb-8">
          <button
            onClick={startDraw}
            disabled={isDrawing || participants.length === 0}
            className={`px-8 py-4 rounded-full text-xl font-bold transition ${
              isDrawing 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-red-500 hover:bg-red-600 transform hover:scale-105'
            }`}
          >
            {isDrawing ? '🎲 Tirage en cours...' : '🎯 Lancer le tirage'}
          </button>
          
          {participants.length === 0 && (
            <p className="text-yellow-500 mt-2">Aucun participant pour le moment</p>
          )}
        </div>

        {/* ✅ ANIMATION TIRAGE */}
        {isDrawing && (
          <div className="text-center my-8">
            <div className="text-6xl animate-bounce mb-4">🎰</div>
            <p className="text-xl">Tirage au sort en cours...</p>
            <p className="text-gray-400">Veuillez patienter</p>
          </div>
        )}

        {/* ✅ LISTE DES GAGNANTS */}
        {winners.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">🏆 Derniers Gagnants</h2>
            <div className="space-y-3">
              {winners.slice(-5).reverse().map((winner, index) => (
                <div key={winner.drawId} className="bg-green-600 p-4 rounded-lg">
                  <div className="font-semibold text-lg">{winner.participant}</div>
                  <div>Ticket #{winner.ticketNumber} - {winner.prize}</div>
                  <div className="text-sm text-green-200">{winner.time}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ✅ LISTE DES PARTICIPANTS */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">👥 Participants ({participants.length})</h2>
            <button 
              onClick={loadParticipants}
              className="bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded text-sm"
            >
              Actualiser
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-2">Nom</th>
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">Tickets</th>
                  <th className="text-left p-2">Numéros</th>
                </tr>
              </thead>
              <tbody>
                {participants.slice(0, 10).map(participant => (
                  <tr key={participant.id} className="border-b border-gray-700 hover:bg-gray-700">
                    <td className="p-2">{participant.name}</td>
                    <td className="p-2">{participant.email}</td>
                    <td className="p-2">{participant.tickets}</td>
                    <td className="p-2 text-sm text-gray-400">
                      {participant.numbers.slice(0, 3).join(', ')}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {participants.length > 10 && (
            <p className="text-gray-400 mt-4 text-sm">
              Affichage des 10 premiers participants sur {participants.length}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
