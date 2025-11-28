// src/utils/ticketStorage.js - VERSION STABLE SANS PROTECTION
import { EventSystem } from './eventSystem';

export const TicketStorage = {
  // Récupérer tous les tickets
  getTickets() {
    const tickets = localStorage.getItem('tombolaTickets');
    return tickets ? JSON.parse(tickets) : [];
  },

  // ✅ VERSION SIMPLIFIÉE : Ajouter un nouveau ticket
  addTicket(ticketData) {
    const tickets = this.getTickets();
    
    const ticket = {
      id: Date.now() + Math.random(),
      number: ticketData.number,
      participant: ticketData.participant || 'Anonyme',
      email: ticketData.email || '',
      phone: ticketData.phone || '',
      purchaseDate: new Date().toISOString(),
      price: ticketData.price || 5,
      isDrawn: false,
      drawResult: null,
      source: ticketData.source || 'purchase'
    };
    
    tickets.push(ticket);
    localStorage.setItem('tombolaTickets', JSON.stringify(tickets));
    
    // ✅ ÉMETTRE LES ÉVÉNEMENTS DE MISE À JOUR
    EventSystem.emitTicketsUpdated(tickets.length);
    EventSystem.emitParticipantsUpdated([...new Set(tickets.map(t => t.email))].length);
    
    console.log(`✅ Ticket #${ticket.number} ajouté (${ticketData.source || 'achat'})`);
    
    return ticket;
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
          drawDate: new Date().toISOString()
        };
      }
      return ticket;
    });
    localStorage.setItem('tombolaTickets', JSON.stringify(updatedTickets));
    
    // ✅ ÉMETTRE UN ÉVÉNEMENT DE MISE À JOUR
    EventSystem.emitTicketsUpdated(updatedTickets.length);
  },

  // ✅ VERSION SIMPLIFIÉE : Récupérer les tickets d'un participant
  getParticipantTickets(email) {
    const tickets = this.getTickets();
    return tickets.filter(ticket => ticket.email === email);
  },

  // ✅ VERSION SIMPLIFIÉE : Récupérer tous les participants uniques
  getAllParticipants() {
    const tickets = this.getTickets();
    const participantsMap = new Map();
    
    tickets.forEach(ticket => {
      if (ticket.email) {
        const key = ticket.email;
        
        if (!participantsMap.has(key)) {
          participantsMap.set(key, {
            id: ticket.id,
            name: ticket.participant,
            email: ticket.email,
            phone: ticket.phone,
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
    });
    
    return Array.from(participantsMap.values());
  },

  // ✅ VERSION SIMPLIFIÉE : Statistiques en temps réel
  getLiveStats() {
    const tickets = this.getTickets();
    
    // Tickets des dernières 24h
    const recentTickets = tickets.filter(ticket => {
      const ticketTime = new Date(ticket.purchaseDate);
      const now = new Date();
      return (now - ticketTime) < (24 * 60 * 60 * 1000); // 24h
    });

    // Statistiques par source
    const ticketsBySource = tickets.reduce((acc, ticket) => {
      const source = ticket.source || 'purchase';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});

    const revenueBySource = tickets.reduce((acc, ticket) => {
      const source = ticket.source || 'purchase';
      acc[source] = (acc[source] || 0) + ticket.price;
      return acc;
    }, {});

    return {
      totalParticipants: this.getAllParticipants().length,
      totalTickets: tickets.length,
      totalRevenue: tickets.reduce((sum, ticket) => sum + ticket.price, 0),
      recentTickets: recentTickets.length,
      recentRevenue: recentTickets.reduce((sum, ticket) => sum + ticket.price, 0),
      ticketsBySource,
      revenueBySource,
      drawnTickets: tickets.filter(t => t.isDrawn).length
    };
  },

  // ✅ FONCTION DE DÉBOGAGE SIMPLIFIÉE
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
    console.log('Derniers tickets:', tickets.slice(-3));
    console.log('Derniers participants:', participants.slice(-3));
  },

  // ✅ FONCTION : Récupérer les détails d'un participant
  getParticipantDetails(ticketNumber) {
    const tickets = this.getTickets();
    const ticket = tickets.find(t => t.number === ticketNumber);
    
    if (!ticket) {
      return null;
    }
    
    return {
      name: ticket.participant,
      email: ticket.email,
      phone: ticket.phone,
      ticketNumber: ticket.number,
      purchaseDate: ticket.purchaseDate,
      price: ticket.price,
      source: ticket.source
    };
  },

  // ✅ FONCTION : Vérifier l'accès admin
  hasAdminAccess() {
    return localStorage.getItem('adminAuthenticated') === 'true';
  },

  // ✅ FONCTION : Récupérer les tickets avec différents niveaux d'accès
  getTicketsWithAccess(accessLevel = 'public') {
    const tickets = this.getTickets();
    
    if (accessLevel === 'admin' && this.hasAdminAccess()) {
      // ADMIN : Accès complet
      return tickets;
    } else {
      // PUBLIC : Données limitées (sans email/phone)
      return tickets.map(ticket => ({
        number: ticket.number,
        purchaseDate: ticket.purchaseDate,
        price: ticket.price,
        isDrawn: ticket.isDrawn,
        source: ticket.source,
        participant: ticket.participant // Garder le nom seulement
      }));
    }
  },

  // ✅ FONCTIONS EXISTANTES CONSERVÉES
  clearAllTickets() {
    localStorage.removeItem('tombolaTickets');
    
    // ÉMETTRE LES ÉVÉNEMENTS DE RÉINITIALISATION
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
        participant: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
        phone: `+33${Math.floor(600000000 + Math.random() * 9999999)}`,
        purchaseDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        price: 5 * ticketCount,
        isDrawn: false,
        drawResult: null,
        source: 'test_generation'
      };
    });

    // Ajouter aux tickets existants
    const existingTickets = this.getTickets();
    const allTickets = [...existingTickets, ...testTickets];
    localStorage.setItem('tombolaTickets', JSON.stringify(allTickets));
    
    // ÉMETTRE LES ÉVÉNEMENTS DE MISE À JOUR
    EventSystem.emitTicketsUpdated(allTickets.length);
    EventSystem.emitParticipantsUpdated([...new Set(allTickets.map(t => t.email))].length);
    
    console.log(`🧪 ${count} tickets de test générés`);
    return testTickets;
  }
};
