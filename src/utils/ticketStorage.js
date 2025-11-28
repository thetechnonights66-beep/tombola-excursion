// Gestion du stockage des tickets dans le localStorage
import { EventSystem } from './eventSystem';
import { DataProtection } from './dataProtection'; // ✅ IMPORT AJOUTÉ

export const TicketStorage = {
  // Récupérer tous les tickets
  getTickets() {
    const tickets = localStorage.getItem('tombolaTickets');
    return tickets ? JSON.parse(tickets) : [];
  },

  // 🎯 MODIFIÉ : Ajouter un nouveau ticket avec protection des données
  addTicket(ticketData) {
    const tickets = this.getTickets();
    
    // 🎯 PROTÉGER LES DONNÉES SENSIBLES
    const protectedTicket = {
      id: Date.now() + Math.random(),
      number: ticketData.number,
      purchaseDate: new Date().toISOString(),
      price: ticketData.price,
      isDrawn: false,
      drawResult: null,
      source: ticketData.source || 'purchase',
      
      // 🎯 GARDER SEULEMENT LES DONNÉES PUBLIQUES EN CLAIR
      publicData: {
        ticketNumber: ticketData.number,
        purchaseDate: new Date().toISOString(),
        ticketPrice: ticketData.price,
        isDrawn: false,
        source: ticketData.source || 'purchase'
      },
      
      // 🎯 PROTÉGER LES DONNÉES SENSIBLES
      protectedData: DataProtection.protectParticipant({
        name: ticketData.participant || 'Anonyme',
        email: ticketData.email || '',
        phone: ticketData.phone || ''
      })
    };
    
    tickets.push(protectedTicket);
    localStorage.setItem('tombolaTickets', JSON.stringify(tickets));
    
    // ✅ ÉMETTRE LES ÉVÉNEMENTS DE MISE À JOUR
    EventSystem.emitTicketsUpdated(tickets.length);
    EventSystem.emitParticipantsUpdated([...new Set(tickets.map(t => t.protectedData?.hash || ''))].length);
    
    console.log(`✅ Ticket #${protectedTicket.number} ajouté (${ticketData.source || 'achat'})`);
    
    return {
      ...protectedTicket.publicData,
      id: protectedTicket.id
    };
  },

  // Marquer un ticket comme tiré
  markAsDrawn(ticketNumber, result) {
    const tickets = this.getTickets();
    const updatedTickets = tickets.map(ticket => {
      if (ticket.number === ticketNumber) {
        return {
          ...ticket,
          isDrawn: true,
          drawResult: result,
          drawDate: new Date().toISOString(),
          publicData: {
            ...ticket.publicData,
            isDrawn: true
          }
        };
      }
      return ticket;
    });
    localStorage.setItem('tombolaTickets', JSON.stringify(updatedTickets));
    
    // ✅ ÉMETTRE UN ÉVÉNEMENT DE MISE À JOUR
    EventSystem.emitTicketsUpdated(updatedTickets.length);
  },

  // 🎯 MODIFIÉ : Récupérer les tickets d'un participant (version publique)
  getParticipantTickets(email) {
    const tickets = this.getTickets();
    return tickets
      .filter(ticket => {
        // Pour les utilisateurs normaux, on ne peut pas filtrer par email protégé
        // On retourne seulement les données publiques
        return ticket.publicData;
      })
      .map(ticket => ticket.publicData);
  },

  // 🎯 MODIFIÉ : Récupérer tous les participants uniques (version admin)
  getAllParticipants() {
    const tickets = this.getTickets();
    const participantsMap = new Map();
    
    tickets.forEach(ticket => {
      if (ticket.protectedData) {
        try {
          // 🎯 DÉPROTÉGER POUR L'ADMIN SEULEMENT
          const participantData = DataProtection.unprotectParticipant(ticket.protectedData);
          
          if (participantData && participantData.name && participantData.name !== 'Anonyme') {
            const key = participantData.hash; // Utiliser le hash comme clé unique
            
            if (!participantsMap.has(key)) {
              participantsMap.set(key, {
                id: ticket.id,
                name: participantData.name,
                email: participantData.email,
                phone: participantData.phone,
                tickets: 1,
                ticketNumbers: [ticket.number],
                firstPurchase: ticket.purchaseDate,
                totalSpent: ticket.price,
                lastPurchase: ticket.purchaseDate,
                source: ticket.source
              });
            } else {
              // Mettre à jour le participant existant
              const existing = participantsMap.get(key);
              existing.tickets += 1;
              existing.ticketNumbers.push(ticket.number);
              existing.totalSpent += ticket.price;
              existing.lastPurchase = ticket.purchaseDate;
              if (ticket.source) {
                existing.source = ticket.source;
              }
            }
          }
        } catch (error) {
          console.warn('Erreur déprotection participant:', error);
        }
      }
    });
    
    return Array.from(participantsMap.values());
  },

  // 🎯 MODIFIÉ : Statistiques en temps réel (version publique)
  getLiveStats() {
    const tickets = this.getTickets();
    const publicTickets = tickets.map(t => t.publicData);
    
    // Tickets des dernières 24h
    const recentTickets = publicTickets.filter(ticket => {
      const ticketTime = new Date(ticket.purchaseDate);
      const now = new Date();
      return (now - ticketTime) < (24 * 60 * 60 * 1000); // 24h
    });

    // 🎯 STATISTIQUES PAR SOURCE (publiques seulement)
    const ticketsBySource = publicTickets.reduce((acc, ticket) => {
      const source = ticket.source || 'purchase';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});

    const revenueBySource = publicTickets.reduce((acc, ticket) => {
      const source = ticket.source || 'purchase';
      acc[source] = (acc[source] || 0) + ticket.ticketPrice;
      return acc;
    }, {});

    return {
      totalParticipants: this.getAllParticipants().length, // 🎯 Seul l'admin voit le vrai nombre
      totalTickets: publicTickets.length,
      totalRevenue: publicTickets.reduce((sum, ticket) => sum + ticket.ticketPrice, 0),
      recentTickets: recentTickets.length,
      recentRevenue: recentTickets.reduce((sum, ticket) => sum + ticket.ticketPrice, 0),
      ticketsBySource,
      revenueBySource,
      drawnTickets: publicTickets.filter(t => t.isDrawn).length // 🎯 NOUVEAU
    };
  },

  // 🎯 NOUVELLE FONCTION : Déboguer les tickets (admin seulement)
  debugTickets() {
    const tickets = this.getTickets();
    const participants = this.getAllParticipants();
    const stats = this.getLiveStats();
    
    console.log('=== DEBUG TICKETSTORAGE ===');
    console.log(`Total tickets: ${tickets.length}`);
    console.log(`Total participants: ${participants.length}`);
    console.log(`Total revenue: €${stats.totalRevenue}`);
    console.log('Tickets par source:', stats.ticketsBySource);
    console.log('Revenue par source:', stats.revenueBySource);
    console.log('Derniers tickets (public):', tickets.slice(-3).map(t => t.publicData));
    console.log('Participants (déprotégés):', participants.slice(-3));
    
    // 🎯 AFFICHER LA PROTECTION DES DONNÉES
    console.log('=== PROTECTION DONNÉES ===');
    if (tickets.length > 0) {
      const sampleTicket = tickets[0];
      console.log('Ticket sample - Public:', sampleTicket.publicData);
      console.log('Ticket sample - Protected:', sampleTicket.protectedData);
      if (sampleTicket.protectedData) {
        try {
          const decrypted = DataProtection.unprotectParticipant(sampleTicket.protectedData);
          console.log('Ticket sample - Decrypted (admin):', decrypted);
        } catch (error) {
          console.log('Ticket sample - Cannot decrypt (normal user)');
        }
      }
    }
  },

  // 🎯 NOUVELLE FONCTION : Récupérer les détails d'un participant (admin seulement)
  getParticipantDetails(ticketNumber) {
    const tickets = this.getTickets();
    const ticket = tickets.find(t => t.publicData.ticketNumber === ticketNumber);
    
    if (!ticket || !ticket.protectedData) {
      return null;
    }
    
    // 🎯 DÉPROTÉGER POUR L'ADMIN
    try {
      const participantData = DataProtection.unprotectParticipant(ticket.protectedData);
      return {
        ...participantData,
        ticketNumber: ticket.number,
        purchaseDate: ticket.purchaseDate,
        price: ticket.price,
        source: ticket.source
      };
    } catch (error) {
      console.error('Erreur déprotection participant:', error);
      return null;
    }
  },

  // 🎯 NOUVELLE FONCTION : Vérifier l'accès admin
  hasAdminAccess() {
    // Vérifier si l'utilisateur a les droits d'admin
    // À adapter selon votre système d'authentification
    return localStorage.getItem('adminAuthenticated') === 'true';
  },

  // 🎯 MODIFIÉ : Récupérer les tickets avec différents niveaux d'accès
  getTicketsWithAccess(accessLevel = 'public') {
    const tickets = this.getTickets();
    
    if (accessLevel === 'admin' && this.hasAdminAccess()) {
      // 🎯 ADMIN : Accès complet avec données déprotégées
      return tickets.map(ticket => {
        try {
          const participantData = ticket.protectedData ? 
            DataProtection.unprotectParticipant(ticket.protectedData) : 
            { name: 'Anonyme', email: '', phone: '' };
          
          return {
            ...ticket.publicData,
            id: ticket.id,
            participant: participantData.name,
            email: participantData.email,
            phone: participantData.phone,
            protectedData: ticket.protectedData // Garder pour référence
          };
        } catch (error) {
          return {
            ...ticket.publicData,
            id: ticket.id,
            participant: 'Données protégées',
            email: 'Données protégées',
            phone: 'Données protégées'
          };
        }
      });
    } else {
      // 🎯 PUBLIC : Données limitées seulement
      return tickets.map(ticket => ticket.publicData);
    }
  },

  // ✅ CONSERVER LES FONCTIONS EXISTANTES (avec adaptations)
  clearAllTickets() {
    localStorage.removeItem('tombolaTickets');
    
    // ✅ ÉMETTRE LES ÉVÉNEMENTS DE RÉINITIALISATION
    EventSystem.emitTicketsUpdated(0);
    EventSystem.emitParticipantsUpdated(0);
    EventSystem.emitParticipantsReset('manual_clear');
    
    console.log('🗑️ Tous les tickets ont été supprimés');
  },

  generateTestTickets(count = 10) {
    const firstNames = ['Jean', 'Marie', 'Pierre', 'Sophie', 'Paul', 'Julie', 'Marc', 'Laura'];
    const lastNames = ['Dupont', 'Martin', 'Bernard', 'Thomas', 'Robert', 'Richard', 'Petit', 'Moreau'];
    
    const testTickets = Array.from({ length: count }, (_, i) => {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const ticketCount = Math.floor(Math.random() * 3) + 1; // 1-3 tickets
      
      return {
        id: Date.now() + i,
        number: Math.floor(1000 + Math.random() * 9000),
        purchaseDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        price: 5 * ticketCount,
        isDrawn: false,
        drawResult: null,
        source: 'test_generation',
        publicData: {
          ticketNumber: Math.floor(1000 + Math.random() * 9000),
          purchaseDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          ticketPrice: 5 * ticketCount,
          isDrawn: false,
          source: 'test_generation'
        },
        protectedData: DataProtection.protectParticipant({
          name: `${firstName} ${lastName}`,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
          phone: `+33${Math.floor(600000000 + Math.random() * 9999999)}`
        })
      };
    });

    // Ajouter aux tickets existants
    const existingTickets = this.getTickets();
    const allTickets = [...existingTickets, ...testTickets];
    localStorage.setItem('tombolaTickets', JSON.stringify(allTickets));
    
    // ✅ ÉMETTRE LES ÉVÉNEMENTS DE MISE À JOUR
    EventSystem.emitTicketsUpdated(allTickets.length);
    EventSystem.emitParticipantsUpdated([...new Set(allTickets.map(t => t.protectedData?.hash || ''))].length);
    
    console.log(`🧪 ${count} tickets de test générés (protégés)`);
    return testTickets.map(t => t.publicData);
  }
};
