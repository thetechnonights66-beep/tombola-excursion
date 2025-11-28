import React, { useState, useEffect } from 'react';
import { Auth } from '../utils/auth';
import BallDrop from './BallDrop';
import { TicketStorage } from '../utils/ticketStorage';
import { ParticipantHistory } from '../utils/participantHistory';
import { EmailVerification } from '../utils/emailVerification';
import { EventSystem } from '../utils/eventSystem';
import { WhatsAppService } from '../utils/whatsappService';

const AdminPanel = () => {
  const [participants, setParticipants] = useState([]);
  const [winners, setWinners] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [liveStats, setLiveStats] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [resetBallDrop, setResetBallDrop] = useState(0);
  const [snapshots, setSnapshots] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [transactionStats, setTransactionStats] = useState(null);

  // ✅ CORRECTION CRITIQUE : VÉRIFICATION IMMÉDIATE DE SÉCURITÉ
  useEffect(() => {
    console.log('🔐 VÉRIFICATION SÉCURITÉ ADMIN...');
    
    const forceAuthCheck = () => {
      // ✅ VÉRIFICATION TRÈS STRICTE
      const userData = localStorage.getItem('adminUser');
      const token = localStorage.getItem('adminToken');
      
      console.log('🔐 Données auth trouvées:', {
        user: !!userData,
        token: !!token
      });

      // ✅ SI AUCUNE DONNÉE D'AUTH → REDIRECTION IMMÉDIATE
      if (!userData || !token) {
        console.log('❌ AUCUNE DONNÉE AUTH - REDIRECTION IMMÉDIATE');
        window.location.href = window.location.origin + window.location.pathname + '#/admin-login';
        return;
      }

      // ✅ VÉRIFICATION AVEC LE SERVICE AUTH
      try {
        const authValid = Auth.isAuthenticated();
        console.log('🔐 Auth service result:', authValid);

        if (!authValid) {
          console.log('❌ AUTH INVALIDE - REDIRECTION');
          window.location.href = window.location.origin + window.location.pathname + '#/admin-login';
          return;
        }

        // ✅ SEULEMENT SI TOUT EST VALIDE
        console.log('✅ ACCÈS AUTORISÉ');
        setIsAuthenticated(true);
        setIsCheckingAuth(false);
        
        // Charger les données réelles
        loadRealData();
        
        // Charger les gagnants existants
        const savedWinners = localStorage.getItem('tombolaWinners');
        if (savedWinners) {
          setWinners(JSON.parse(savedWinners));
        }

        // Charger l'historique des snapshots
        setSnapshots(ParticipantHistory.getSnapshots());

        // Charger les stats transactions
        refreshTransactions();
        
      } catch (error) {
        console.error('❌ Erreur vérification auth:', error);
        window.location.href = window.location.origin + window.location.pathname + '#/admin-login';
      }
    };

    // Délai très court pour s'assurer que tout est chargé
    setTimeout(forceAuthCheck, 50);
  }, []);

  // ✅ Charger les données réelles
  const loadRealData = () => {
    console.log('🔄 Chargement des données réelles...');
    const realParticipants = TicketStorage.getAllParticipants();
    const stats = TicketStorage.getLiveStats();
    
    setParticipants(realParticipants);
    setLiveStats(stats);
    setLastUpdate(new Date());
  };

  // ✅ SURVEILLANCE EN TEMPS RÉEL AVEC ÉVÉNEMENTS
  useEffect(() => {
    if (!isAuthenticated) return;

    // ✅ GESTIONNAIRES D'ÉVÉNEMENTS
    const handleTicketsUpdated = (event) => {
      console.log('🎯 Événement ticketsUpdated reçu:', event.detail);
      loadRealData();
    };

    const handleParticipantsUpdated = (event) => {
      console.log('🎯 Événement participantsUpdated reçu:', event.detail);
      loadRealData();
    };

    const handleDrawReset = (event) => {
      console.log('🎯 Événement drawReset reçu:', event.detail);
      loadRealData();
      setWinners([]);
    };

    const handleParticipantsReset = (event) => {
      console.log('🎯 Événement participantsReset reçu:', event.detail);
      loadRealData();
      setWinners([]);
      setLiveStats(null);
    };

    // ✅ S'ABONNER AUX ÉVÉNEMENTS
    EventSystem.on(EventSystem.EVENTS.TICKETS_UPDATED, handleTicketsUpdated);
    EventSystem.on(EventSystem.EVENTS.PARTICIPANTS_UPDATED, handleParticipantsUpdated);
    EventSystem.on(EventSystem.EVENTS.DRAW_RESET, handleDrawReset);
    EventSystem.on(EventSystem.EVENTS.PARTICIPANTS_RESET, handleParticipantsReset);

    // ✅ INTERVALLE DE SAUVEGARDE
    const interval = setInterval(() => {
      loadRealData();
    }, 3000);

    // ✅ SURVEILLANCE DES TRANSACTIONS
    const transactionInterval = setInterval(() => {
      refreshTransactions();
    }, 10000);

    // ✅ NETTOYAGE
    return () => {
      clearInterval(interval);
      clearInterval(transactionInterval);
      EventSystem.off(EventSystem.EVENTS.TICKETS_UPDATED, handleTicketsUpdated);
      EventSystem.off(EventSystem.EVENTS.PARTICIPANTS_UPDATED, handleParticipantsUpdated);
      EventSystem.off(EventSystem.EVENTS.DRAW_RESET, handleDrawReset);
      EventSystem.off(EventSystem.EVENTS.PARTICIPANTS_RESET, handleParticipantsReset);
    };
  }, [isAuthenticated]);

  // ✅ SURVEILLANCE DES TRANSACTIONS CRYPTO
  const refreshTransactions = () => {
    const payments = JSON.parse(localStorage.getItem('cryptoPendingPayments') || '{}');
    const allPayments = Object.values(payments);
    
    const stats = {
      total: allPayments.length,
      pending: allPayments.filter(p => p.status === 'pending').length,
      confirmed: allPayments.filter(p => p.status === 'confirmed').length,
      expired: allPayments.filter(p => p.status === 'expired').length,
      totalRevenue: allPayments
        .filter(p => p.status === 'confirmed')
        .reduce((sum, p) => sum + (p.amount || 0), 0),
      recent: allPayments
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10)
    };
    
    setTransactionStats(stats);
  };

  // ✅ NETTOYAGE DES TRANSACTIONS EXPIRÉES
  const cleanupExpiredTransactions = () => {
    const payments = JSON.parse(localStorage.getItem('cryptoPendingPayments') || '{}');
    const now = new Date();
    
    Object.keys(payments).forEach(paymentId => {
      const payment = payments[paymentId];
      const paymentTime = new Date(payment.timestamp);
      const expiryTime = new Date(paymentTime.getTime() + 30 * 60 * 1000);
      
      if (now > expiryTime && payment.status === 'pending') {
        payments[paymentId].status = 'expired';
      }
    });
    
    localStorage.setItem('cryptoPendingPayments', JSON.stringify(payments));
    refreshTransactions();
    showToast('🗑️ Transactions nettoyées', 'Paiements expirés mis à jour', 'blue');
  };

  // ✅ EXPORT DES TRANSACTIONS CSV
  const exportTransactionsCSV = () => {
    const payments = JSON.parse(localStorage.getItem('cryptoPendingPayments') || '{}');
    const csvHeader = 'ID,Nom,Email,Montant,Crypto,Statut,Tickets,Date,Transaction Hash\n';
    
    const csvRows = Object.values(payments).map(payment => 
      `"${payment.id}","${payment.participant?.name || 'N/A'}","${payment.participant?.email || 'N/A'}",${payment.amount},"${payment.crypto}","${payment.status}",${payment.ticketCount},"${payment.timestamp}","${payment.transactionHash || 'N/A'}"`
    ).join('\n');
    
    const csv = csvHeader + csvRows;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_tombola_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('📊 Export CSV', 'Transactions exportées avec succès');
  };

  // ✅ MODIFIER handleWinnerSelected POUR WHATSAPP
  const handleWinnerSelected = (winner) => {
    // ✅ VÉRIFICATION DE SÉCURITÉ
    if (!Auth.isAuthenticated()) {
      alert('🚨 Session expirée! Veuillez vous reconnecter.');
      Auth.logout();
      window.location.hash = '#/admin-login';
      return;
    }

    const newWinner = {
      participant: winner.name,
      ticketNumber: winner.ticketNumber,
      prize: `Lot ${winners.length + 1}`,
      time: new Date().toLocaleTimeString(),
      phone: winner.phone
    };
    
    const updatedWinners = [...winners, newWinner];
    setWinners(updatedWinners);
    localStorage.setItem('tombolaWinners', JSON.stringify(updatedWinners));
    
    EventSystem.emitWinnersUpdated(updatedWinners.length);
    
    if (winner.phone) {
      const whatsappLink = WhatsAppService.generateWinnerLink(
        winner.phone,
        winner.name, 
        newWinner.prize,
        winner.ticketNumber
      );
      
      showToast('📱 Lien WhatsApp Gagnant', `Lien créé pour ${winner.name}`, 'green');
      
      setTimeout(() => {
        if (window.confirm(`Ouvrir WhatsApp pour notifier ${winner.name} ?`)) {
          window.open(whatsappLink, '_blank');
        }
      }, 1000);
    }
  };

  // ✅ FONCTION POUR ACCÉDER AUX ANALYTICS AVANCÉS
  const handleAnalyticsAccess = () => {
    // ✅ VÉRIFICATION DE SÉCURITÉ
    if (!Auth.isAuthenticated()) {
      alert('🚨 Session expirée! Veuillez vous reconnecter.');
      Auth.logout();
      window.location.hash = '#/admin-login';
      return;
    }

    const currentUser = Auth.getCurrentUser();
    if (currentUser) {
      window.location.hash = '#/analytics';
    } else {
      alert('❌ Vous devez être connecté en tant qu\'administrateur');
      window.location.hash = '#/admin-login';
    }
  };

  // ✅ FONCTION RÉINITIALISATION AVEC SAUVEGARDE
  const resetDraw = () => {
    // ✅ VÉRIFICATION DE SÉCURITÉ
    if (!Auth.isAuthenticated()) {
      alert('🚨 Session expirée! Veuillez vous reconnecter.');
      Auth.logout();
      window.location.hash = '#/admin-login';
      return;
    }

    if (window.confirm('🔄 Réinitialiser le tirage ?\n\n• Tous les gagnants seront effacés\n• Les tickets seront remis en jeu\n• L\'animation sera réinitialisée\n• Une sauvegarde sera créée')) {
      
      const snapshotId = ParticipantHistory.saveParticipantsSnapshot(
        participants, 
        winners, 
        'reset_tirage'
      );
      
      setWinners([]);
      localStorage.removeItem('tombolaWinners');
      
      const tickets = TicketStorage.getTickets();
      const updatedTickets = tickets.map(ticket => ({
        ...ticket,
        isDrawn: false,
        drawResult: null,
        drawDate: null
      }));
      localStorage.setItem('tombolaTickets', JSON.stringify(updatedTickets));
      
      EventSystem.emitDrawReset('manual_reset');
      EventSystem.emitWinnersUpdated(0);
      
      setResetBallDrop(prev => prev + 1);
      setSnapshots(ParticipantHistory.getSnapshots());
      
      showToast('✅ Tirage réinitialisé', `Sauvegarde #${snapshotId.split('_')[1]} créée`);
    }
  };

  // ✅ FONCTION RÉINITIALISATION PARTICIPANTS AVEC SAUVEGARDE
  const resetParticipants = () => {
    // ✅ VÉRIFICATION DE SÉCURITÉ
    if (!Auth.isAuthenticated()) {
      alert('🚨 Session expirée! Veuillez vous reconnecter.');
      Auth.logout();
      window.location.hash = '#/admin-login';
      return;
    }

    if (window.confirm('⚠️ RÉINITIALISER TOUS LES PARTICIPANTS ?\n\nUne sauvegarde complète sera créée avant la suppression.')) {
      
      if (window.confirm(`❌ CONFIRMER LA SUPPRESSION :\n\n• ${participants.length} participant(s)\n• ${liveStats?.totalTickets || 0} ticket(s)\n• €${liveStats?.totalRevenue || 0} de recettes\n\nUne sauvegarde sera disponible dans l'historique.`)) {
        
        const snapshotId = ParticipantHistory.saveParticipantsSnapshot(
          participants, 
          winners, 
          'reset_complet'
        );
        
        TicketStorage.clearAllTickets();
        
        setParticipants([]);
        setWinners([]);
        setLiveStats(null);
        
        localStorage.removeItem('tombolaWinners');
        
        EventSystem.emitParticipantsReset('manual_clear');
        EventSystem.emitWinnersUpdated(0);
        
        setResetBallDrop(prev => prev + 1);
        setSnapshots(ParticipantHistory.getSnapshots());
        
        showToast('🗑️ Participants réinitialisés', `Sauvegarde #${snapshotId.split('_')[1]} créée`, 'orange');
      }
    }
  };

  // ✅ FONCTION POUR RESTAURER UN SNAPSHOT
  const restoreSnapshot = (snapshotId) => {
    // ✅ VÉRIFICATION DE SÉCURITÉ
    if (!Auth.isAuthenticated()) {
      alert('🚨 Session expirée! Veuillez vous reconnecter.');
      Auth.logout();
      window.location.hash = '#/admin-login';
      return;
    }

    const snapshot = ParticipantHistory.getSnapshot(snapshotId);
    if (!snapshot) return;

    if (window.confirm(`🔄 Restaurer la sauvegarde du ${new Date(snapshot.timestamp).toLocaleString()} ?\n\n• ${snapshot.totalParticipants} participants\n• ${snapshot.totalTickets} tickets\n• ${snapshot.winnersCount} gagnants`)) {
      
      try {
        ParticipantHistory.restoreSnapshot(snapshotId);
        
        loadRealData();
        const savedWinners = localStorage.getItem('tombolaWinners');
        if (savedWinners) {
          setWinners(JSON.parse(savedWinners));
        }
        
        setSnapshots(ParticipantHistory.getSnapshots());
        
        EventSystem.emitTicketsUpdated(snapshot.totalTickets);
        EventSystem.emitParticipantsUpdated(snapshot.totalParticipants);
        EventSystem.emitWinnersUpdated(snapshot.winnersCount);
        
        showToast('✅ Sauvegarde restaurée', `Snapshot ${snapshotId.split('_')[1]} chargé`);
        
      } catch (error) {
        showToast('❌ Erreur', 'Impossible de restaurer la sauvegarde', 'red');
      }
    }
  };

  // ✅ FONCTION POUR EXPORTER UN SNAPSHOT
  const exportSnapshot = (snapshotId) => {
    // ✅ VÉRIFICATION DE SÉCURITÉ
    if (!Auth.isAuthenticated()) {
      alert('🚨 Session expirée! Veuillez vous reconnecter.');
      Auth.logout();
      window.location.hash = '#/admin-login';
      return;
    }

    const csv = ParticipantHistory.exportToCSV(snapshotId);
    if (csv) {
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tombola_snapshot_${snapshotId}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      showToast('📊 Export CSV', 'Fichier téléchargé');
    }
  };

  // ✅ FONCTION POUR SUPPRIMER UN SNAPSHOT
  const deleteSnapshot = (snapshotId) => {
    // ✅ VÉRIFICATION DE SÉCURITÉ
    if (!Auth.isAuthenticated()) {
      alert('🚨 Session expirée! Veuillez vous reconnecter.');
      Auth.logout();
      window.location.hash = '#/admin-login';
      return;
    }

    if (window.confirm('Supprimer cette sauvegarde ?')) {
      const updatedSnapshots = ParticipantHistory.deleteSnapshot(snapshotId);
      setSnapshots(updatedSnapshots);
      showToast('🗑️ Sauvegarde supprimée', 'Snapshot effacé', 'red');
    }
  };

  // ✅ FONCTION POUR ANALYSER TOUS LES EMAILS
  const analyzeAllEmails = () => {
    // ✅ VÉRIFICATION DE SÉCURITÉ
    if (!Auth.isAuthenticated()) {
      alert('🚨 Session expirée! Veuillez vous reconnecter.');
      Auth.logout();
      window.location.hash = '#/admin-login';
      return;
    }

    const report = EmailVerification.generateSuspiciousEmailsReport(participants);
    
    console.log('📊 Rapport des emails suspects:', report);
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-gray-800 p-6 rounded-lg max-w-4xl w-full mx-4 max-h-96 overflow-y-auto">
        <h3 class="text-xl font-bold mb-4">📊 Analyse des Emails</h3>
        
        <div class="grid grid-cols-4 gap-4 mb-4">
          <div class="bg-blue-600 p-3 rounded text-center">
            <div class="text-2xl font-bold">${report.totalParticipants}</div>
            <div class="text-sm">Total</div>
          </div>
          <div class="bg-red-600 p-3 rounded text-center">
            <div class="text-2xl font-bold">${report.suspiciousCount}</div>
            <div class="text-sm">Suspects</div>
          </div>
          <div class="bg-orange-600 p-3 rounded text-center">
            <div class="text-2xl font-bold">${report.summary.duplicates}</div>
            <div class="text-sm">Duplicatas</div>
          </div>
          <div class="bg-yellow-600 p-3 rounded text-center">
            <div class="text-2xl font-bold">${report.summary.disposableDomains}</div>
            <div class="text-sm">Domaines jetables</div>
          </div>
        </div>
        
        ${report.suspiciousEmails.length > 0 ? `
          <div class="space-y-2">
            <h4 class="font-semibold mb-2">Emails à vérifier :</h4>
            ${report.suspiciousEmails.map(email => `
              <div class="bg-gray-700 p-3 rounded">
                <div class="flex justify-between">
                  <div>
                    <strong>${email.participant}</strong>
                    <div class="text-sm text-gray-400">${email.email}</div>
                  </div>
                  <div class="text-right text-sm">
                    <div>Score: ${email.analysis.score}/100</div>
                    <div class="text-red-400">${email.analysis.domainAnalysis.reason || 'Problème détecté'}</div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="text-center py-8 text-gray-400">
            <div class="text-4xl mb-4">✅</div>
            <p>Aucun email suspect détecté</p>
          </div>
        `}
        
        <button onclick="this.parentElement.parentElement.remove()" 
                class="w-full mt-4 bg-gray-600 text-white py-2 rounded hover:bg-gray-700">
          Fermer
        </button>
      </div>
    `;
    
    document.body.appendChild(modal);
  };

  // ✅ FONCTION POUR GÉNÉRER DES PARTICIPANTS DE TEST
  const generateTestParticipants = () => {
    // ✅ VÉRIFICATION DE SÉCURITÉ
    if (!Auth.isAuthenticated()) {
      alert('🚨 Session expirée! Veuillez vous reconnecter.');
      Auth.logout();
      window.location.hash = '#/admin-login';
      return;
    }

    const count = parseInt(prompt('Combien de participants de test générer ?', '10')) || 10;
    
    if (count > 0) {
      TicketStorage.generateTestTickets(count);
      loadRealData();
      showToast('🧪 Participants test générés', `${count} nouveaux participants ajoutés`);
    }
  };

  // ✅ FONCTION UTILITAIRE POUR LES TOASTS
  const showToast = (title, message, color = 'green') => {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 bg-${color}-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce`;
    toast.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="text-xl">${title.charAt(0)}</span>
        <div>
          <div class="font-semibold">${title}</div>
          <div class="text-sm opacity-90">${message}</div>
        </div>
      </div>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 4000);
  };

  const handleLogout = () => {
    Auth.logout();
    window.location.hash = '#/';
  };

  const forceRefresh = () => {
    loadRealData();
    refreshTransactions();
  };

  // ✅ ÉCRAN DE CHARGEMENT PENDANT LA VÉRIFICATION AUTH
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <div>Vérification de sécurité en cours...</div>
          <div className="text-sm text-gray-400 mt-2">
            Accès administrateur protégé
          </div>
        </div>
      </div>
    );
  }

  // ✅ DOUBLE SÉCURITÉ : REDIRECTION SI NON AUTHENTIFIÉ
  if (!isAuthenticated) {
    useEffect(() => {
      console.log('🚨 ACCÈS REFUSÉ - REDIRECTION VERS LOGIN');
      window.location.hash = '#/admin-login';
    }, []);
    
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">
          Accès refusé - Redirection...
        </div>
      </div>
    );
  }

  // ✅ SEULEMENT SI AUTHENTIFIÉ - AFFICHER LE CONTENU
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* ✅ BANNIÈRE DE SÉCURITÉ */}
        <div className="bg-green-600 border-2 border-green-400 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🛡️</span>
              <div>
                <div className="font-bold">SESSION ADMIN SÉCURISÉE</div>
                <div className="text-sm opacity-90">
                  Connecté • {Auth.getSessionDuration()} • Accès autorisé
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-semibold transition"
            >
              🔒 Déconnexion
            </button>
          </div>
        </div>

        {/* En-tête avec indicateur temps réel */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">🎮 Panel Admin Tombola</h1>
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>En direct • Dernière mise à jour : {lastUpdate.toLocaleTimeString()}</span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={forceRefresh}
              className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg font-semibold text-sm"
            >
              🔄 Actualiser
            </button>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded-lg font-semibold text-sm"
            >
              📊 Historique
            </button>
            <button
              onClick={() => setShowTransactions(!showTransactions)}
              className="bg-teal-500 hover:bg-teal-600 px-4 py-2 rounded-lg font-semibold text-sm"
            >
              💎 Transactions
            </button>
            <button
              onClick={analyzeAllEmails}
              className="bg-teal-500 hover:bg-teal-600 px-4 py-2 rounded-lg font-semibold text-sm"
              disabled={participants.length === 0}
            >
              🔍 Vérifier Emails
            </button>
            <button
              onClick={() => window.location.hash = '#/referral-admin'}
              className="bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded-lg font-semibold text-sm"
            >
              👥 Admin Parrainage
            </button>
            <button
              onClick={() => window.location.hash = '#/prize-manager'}
              className="bg-pink-500 hover:bg-pink-600 px-4 py-2 rounded-lg font-semibold text-sm"
            >
              🎁 Gérer Lots
            </button>
            <button
              onClick={handleAnalyticsAccess}
              className="bg-teal-500 hover:bg-teal-600 px-4 py-2 rounded-lg font-semibold text-sm"
            >
              📊 Analytics Avancés
            </button>
            <button
              onClick={resetDraw}
              className="bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg font-semibold text-sm"
              disabled={winners.length === 0}
            >
              🎯 Réinit. Tirage
            </button>
            <button
              onClick={generateTestParticipants}
              className="bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded-lg font-semibold text-sm"
            >
              🧪 Générer Test
            </button>
            <button
              onClick={resetParticipants}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-semibold text-sm"
              disabled={participants.length === 0}
            >
              🗑️ Réinit. Participants
            </button>
            <button
              onClick={handleLogout}
              className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg font-semibold text-sm"
            >
              Déconnexion
            </button>
          </div>
        </div>

        {/* STATISTIQUES EN TEMPS RÉEL */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-600 p-4 rounded-lg">
            <div className="text-2xl font-bold">
              {liveStats ? liveStats.totalParticipants : participants.length}
            </div>
            <div>Participants Réels</div>
            <div className="text-xs text-blue-200 mt-1">
              {participants.length} détectés
            </div>
          </div>
          <div className="bg-green-600 p-4 rounded-lg">
            <div className="text-2xl font-bold">
              {liveStats ? liveStats.totalTickets : '...'}
            </div>
            <div>Tickets Vendus</div>
            <div className="text-xs text-green-200 mt-1">
              +{liveStats?.recentTickets || 0} aujourd'hui
            </div>
          </div>
          <div className="bg-purple-600 p-4 rounded-lg">
            <div className="text-2xl font-bold">{winners.length}</div>
            <div>Gagnants</div>
          </div>
          <div className="bg-yellow-600 p-4 rounded-lg">
            <div className="text-2xl font-bold">
              {liveStats ? `€${liveStats.totalRevenue}` : '...'}
            </div>
            <div>Recettes Réelles</div>
            {liveStats?.ticketsBySource && (
              <div className="text-xs text-yellow-200 mt-1">
                Parrainage: {liveStats.ticketsBySource.referral_reward || 0} tickets
              </div>
            )}
          </div>
        </div>

        {/* SECTION TRANSACTIONS CRYPTO */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">💎 Surveillance Transactions Crypto</h2>
            <div className="flex gap-4 items-center">
              <div className="text-sm text-gray-400">
                Mise à jour automatique
              </div>
              <button
                onClick={() => setShowTransactions(!showTransactions)}
                className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg font-semibold text-sm"
              >
                {showTransactions ? '🔼 Masquer' : '🔽 Afficher'}
              </button>
            </div>
          </div>

          {showTransactions && (
            <div className="space-y-6">
              {/* STATS TRANSACTIONS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-600 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold">{transactionStats?.total || 0}</div>
                  <div className="text-blue-100">Total Transactions</div>
                </div>
                <div className="bg-yellow-600 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold">{transactionStats?.pending || 0}</div>
                  <div className="text-yellow-100">En Attente</div>
                </div>
                <div className="bg-green-600 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold">{transactionStats?.confirmed || 0}</div>
                  <div className="text-green-100">Confirmées</div>
                </div>
                <div className="bg-red-600 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold">€{transactionStats?.totalRevenue || 0}</div>
                  <div className="text-red-100">Recettes Crypto</div>
                </div>
              </div>

              {/* LISTE DES TRANSACTIONS RÉCENTES */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">🕒 Transactions Récentes</h3>
                {transactionStats?.recent && transactionStats.recent.length > 0 ? (
                  <div className="space-y-2">
                    {transactionStats.recent.map((transaction, index) => (
                      <div key={transaction.id} className={`p-3 rounded-lg ${
                        transaction.status === 'confirmed' ? 'bg-green-500/20 border border-green-400' :
                        transaction.status === 'pending' ? 'bg-yellow-500/20 border border-yellow-400' :
                        'bg-red-500/20 border border-red-400'
                      }`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold">
                              {transaction.participant?.name || 'Anonyme'}
                            </div>
                            <div className="text-sm text-gray-300">
                              {transaction.ticketCount} ticket(s) - {transaction.crypto}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">€{transaction.amount}</div>
                            <div className={`text-xs ${
                              transaction.status === 'confirmed' ? 'text-green-300' :
                              transaction.status === 'pending' ? 'text-yellow-300' : 'text-red-300'
                            }`}>
                              {transaction.status === 'confirmed' ? '✅ Confirmé' :
                              transaction.status === 'pending' ? '⏳ En attente' : '❌ Expiré'}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 mt-2">
                          {new Date(transaction.timestamp).toLocaleString()}
                          {transaction.transactionHash && (
                            <span className="ml-2">
                              TX: {transaction.transactionHash.substring(0, 15)}...
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-400">
                    <div className="text-4xl mb-2">💸</div>
                    <p>Aucune transaction pour le moment</p>
                  </div>
                )}
              </div>

              {/* ACTIONS TRANSACTIONS */}
              <div className="flex gap-3">
                <button
                  onClick={refreshTransactions}
                  className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg font-semibold text-sm"
                >
                  🔄 Actualiser Transactions
                </button>
                <button
                  onClick={exportTransactionsCSV}
                  className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg font-semibold text-sm"
                >
                  📊 Export CSV
                </button>
                <button
                  onClick={cleanupExpiredTransactions}
                  className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-semibold text-sm"
                >
                  🗑️ Nettoyer Expirés
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ANIMATION BILLES TOMBANTES */}
        <BallDrop 
          participants={participants} 
          onWinnerSelected={handleWinnerSelected}
          resetTrigger={resetBallDrop}
        />

        {/* SECTION HISTORIQUE DES SAUVEGARDES */}
        {showHistory && (
          <div className="bg-gray-800 rounded-lg p-6 mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">📊 Historique des Sauvegardes</h2>
              <div className="text-sm text-gray-400">
                {snapshots.length} sauvegarde(s)
              </div>
            </div>
            
            {snapshots.length > 0 ? (
              <div className="space-y-4">
                {snapshots.map((snapshot, index) => (
                  <div key={snapshot.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-semibold">
                          Sauvegarde #{snapshot.id.split('_')[1]}
                        </div>
                        <div className="text-sm text-gray-400">
                          {new Date(snapshot.timestamp).toLocaleString()}
                        </div>
                        <div className="text-xs text-blue-400 mt-1">
                          Raison: {snapshot.reason === 'reset_tirage' ? 'Réinitialisation tirage' : 'Réinitialisation complète'}
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div>{snapshot.totalParticipants} participants</div>
                        <div>{snapshot.totalTickets} tickets</div>
                        <div>€{snapshot.totalRevenue} recettes</div>
                        <div>{snapshot.winnersCount} gagnants</div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => restoreSnapshot(snapshot.id)}
                        className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
                      >
                        🔄 Restaurer
                      </button>
                      <button
                        onClick={() => exportSnapshot(snapshot.id)}
                        className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                      >
                        📊 Export CSV
                      </button>
                      <button
                        onClick={() => deleteSnapshot(snapshot.id)}
                        className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                      >
                        🗑️ Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <div className="text-4xl mb-4">💾</div>
                <p>Aucune sauvegarde disponible</p>
                <p className="text-sm mt-2">
                  Les sauvegardes sont créées automatiquement lors des réinitialisations
                </p>
              </div>
            )}
          </div>
        )}

        {/* SECTION GAGNANTS */}
        {winners.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">🏆 Historique des Gagnants</h2>
              <div className="flex gap-4 items-center">
                <div className="text-sm text-gray-400">
                  {winners.length} gagnant(s)
                </div>
                <button
                  onClick={resetDraw}
                  className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-semibold text-sm"
                >
                  🔄 Réinitialiser Tirage
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {winners.map((winner, index) => (
                <div key={index} className="bg-green-600 p-4 rounded-lg">
                  <div className="font-semibold text-lg">{winner.participant}</div>
                  <div>Ticket #{winner.ticketNumber} - {winner.prize}</div>
                  <div className="text-sm text-green-200">{winner.time}</div>
                  {winner.phone && (
                    <div className="text-xs text-green-300 mt-1">
                      📱 {winner.phone}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LISTE DES PARTICIPANTS RÉELS */}
        <div className="bg-gray-800 rounded-lg p-6 mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">
              👥 Participants Réels ({participants.length})
            </h2>
            <div className="flex gap-4 items-center">
              <div className="text-sm text-gray-400">
                Dernier : {lastUpdate.toLocaleTimeString()}
              </div>
              <button
                onClick={resetParticipants}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-semibold text-sm"
                disabled={participants.length === 0}
              >
                🗑️ Tout Supprimer
              </button>
            </div>
          </div>
          
          {participants.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-2">Nom</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Téléphone</th>
                    <th className="text-left p-2">Tickets</th>
                    <th className="text-left p-2">Dépense</th>
                    <th className="text-left p-2">Source</th>
                    <th className="text-left p-2">Premier achat</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((participant, index) => (
                    <tr key={participant.id || index} className="border-b border-gray-700 hover:bg-gray-700">
                      <td className="p-2 font-semibold">{participant.name}</td>
                      <td className="p-2">{participant.email}</td>
                      <td className="p-2">
                        {participant.phone ? (
                          <span className="text-green-400">📱 {participant.phone}</span>
                        ) : (
                          <span className="text-gray-500 text-sm">Aucun</span>
                        )}
                      </td>
                      <td className="p-2">
                        <span className="bg-blue-500 text-white px-2 py-1 rounded text-sm">
                          {participant.tickets}
                        </span>
                      </td>
                      <td className="p-2">
                        <span className="bg-green-500 text-white px-2 py-1 rounded text-sm">
                          €{participant.totalSpent}
                        </span>
                      </td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          participant.source === 'referral_reward' ? 'bg-purple-500 text-white' :
                          participant.source === 'test_generation' ? 'bg-gray-500 text-white' :
                          'bg-blue-500 text-white'
                        }`}>
                          {participant.source === 'referral_reward' ? '🎁 Parrainage' :
                          participant.source === 'test_generation' ? '🧪 Test' : '🛒 Achat'}
                        </span>
                      </td>
                      <td className="p-2 text-sm text-gray-400">
                        {new Date(participant.firstPurchase).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-4">📝</div>
              <p>Aucun participant détecté</p>
              <p className="text-sm mt-2">
                Utilisez "Générer Test" pour créer des données de démonstration
              </p>
            </div>
          )}
        </div>

        {/* BOUTON DEBUG */}
        <div className="mt-4 text-center">
          <button
            onClick={() => {
              console.log('=== DEBUG ADMINPANEL ===');
              console.log('Participants:', participants);
              console.log('LiveStats:', liveStats);
              console.log('Gagnants:', winners);
              console.log('Snapshots:', snapshots);
              console.log('TransactionStats:', transactionStats);
              console.log('ResetBallDrop counter:', resetBallDrop);
              TicketStorage.debugTickets();
              
              // Debug transactions
              const payments = JSON.parse(localStorage.getItem('cryptoPendingPayments') || '{}');
              console.log('Transactions Crypto:', payments);
            }}
            className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm"
          >
            🐛 Debug Console
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
