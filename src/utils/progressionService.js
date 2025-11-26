// src/utils/progressionService.js
export const ProgressionService = {
  SEUIL_MINIMUM: 150,
  DATE_LIMITE: new Date('2024-12-31T23:59:59'),

  // 🎯 NIVEAUX DE LOTS
  LEVELS: {
    1: { participants: 0, lots: 3, label: "Démarrage", description: "3 lots principaux" },
    2: { participants: 50, lots: 3, label: "Croissance", description: "+2 lots secondaires" },
    3: { participants: 100, lots: 5, label: "Popularité", description: "+2 lots surprises" },
    4: { participants: 150, lots: 5, label: "Succès", description: "+3 lots premium" },
    5: { participants: 200, lots: 7, label: "Exceptionnel", description: "+2 lots exclusifs" },
    6: { participants: 300, lots: 10, label: "Prestige", description: "+3 lots prestige" }
  },

  // 🎯 CALCUL DU NIVEAU ACTUEL
  getCurrentLevel(participantCount) {
    let currentLevel = 1;
    Object.keys(this.LEVELS).reverse().forEach(level => {
      if (participantCount >= this.LEVELS[level].participants) {
        currentLevel = parseInt(level);
        return;
      }
    });
    return currentLevel;
  },

  // 🎯 PROCHAIN NIVEAU
  getNextLevel(participantCount) {
    const currentLevel = this.getCurrentLevel(participantCount);
    const nextLevel = currentLevel + 1;
    return this.LEVELS[nextLevel] || null;
  },

  // 🎯 PROGRESSION VERS LE PROCHAIN NIVEAU
  getNextLevelProgress(participantCount) {
    const nextLevel = this.getNextLevel(participantCount);
    if (!nextLevel) return { progress: 100, remaining: 0 };

    const progress = (participantCount / nextLevel.participants) * 100;
    const remaining = nextLevel.participants - participantCount;
    
    return {
      progress: Math.min(100, progress),
      remaining: Math.max(0, remaining),
      nextLevel: nextLevel
    };
  },

  // 🎯 VÉRIFIER SI SEUIL ATTEINT
  isSeuilAtteint(participantCount) {
    return participantCount >= this.SEUIL_MINIMUM || new Date() >= this.DATE_LIMITE;
  },

  // 🎯 NOMBRE DE LOTS ACTUELS
  getCurrentLots(participantCount) {
    const level = this.getCurrentLevel(participantCount);
    return this.LEVELS[level].lots;
  },

  // 🎯 STATUT DU TIRAGE
  getTirageStatus(participantCount) {
    const seuilAtteint = this.isSeuilAtteint(participantCount);
    const currentLevel = this.getCurrentLevel(participantCount);
    const nextLevelProgress = this.getNextLevelProgress(participantCount);

    return {
      seuilAtteint,
      participantCount,
      currentLevel: this.LEVELS[currentLevel],
      nextLevelProgress,
      missingForSeuil: Math.max(0, this.SEUIL_MINIMUM - participantCount),
      daysUntilDeadline: Math.ceil((this.DATE_LIMITE - new Date()) / (1000 * 60 * 60 * 24))
    };
  }
};
