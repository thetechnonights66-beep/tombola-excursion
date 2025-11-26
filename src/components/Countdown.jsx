import React, { useState, useEffect } from 'react';
import { TicketStorage } from '../utils/ticketStorage';

const Countdown = () => {
  const [participants, setParticipants] = useState(0);
  const [seuilAtteint, setSeuilAtteint] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [currentLevel, setCurrentLevel] = useState(1);
  const SEUIL_MINIMUM = 150; // 🎯 Seuil de 150 participants
  const DATE_LIMITE = new Date('2025-12-31T23:59:59'); // ⏰ Date de secours

  // 🎯 NIVEAUX DE LOTS PROGRESSIFS
  const LEVELS = {
    1: { participants: 0, lots: 3, label: "Démarrage" },
    2: { participants: 50, lots: 3, label: "Croissance" },
    3: { participants: 100, lots: 5, label: "Popularité" },
    4: { participants: 150, lots: 5, label: "Succès" },
    5: { participants: 200, lots: 7, label: "Exceptionnel" },
    6: { participants: 300, lots: 10, label: "Prestige" }
  };

  useEffect(() => {
    const checkProgress = () => {
      const totalParticipants = TicketStorage.getAllParticipants().length;
      setParticipants(totalParticipants);
      
      // 🎯 DÉTERMINER LE NIVEAU ACTUEL
      let newLevel = 1;
      Object.keys(LEVELS).reverse().forEach(level => {
        if (totalParticipants >= LEVELS[level].participants) {
          newLevel = parseInt(level);
          return;
        }
      });
      setCurrentLevel(newLevel);

      // 🎯 VÉRIFIER SI SEUIL ATTEINT
      if (totalParticipants >= SEUIL_MINIMUM && !seuilAtteint) {
        setSeuilAtteint(true);
        startRealCountdown();
      }

      // 🎯 VÉRIFIER DATE LIMITE
      const now = new Date();
      if (now >= DATE_LIMITE && !seuilAtteint) {
        setSeuilAtteint(true);
        startRealCountdown();
      }
    };

    checkProgress();
    const interval = setInterval(checkProgress, 30000); // ✅ Vérif toutes les 30 secondes
    return () => clearInterval(interval);
  }, [seuilAtteint]);

  const startRealCountdown = () => {
    // 🎯 DÉMARRER LE VRAI COMPTE À REBOURS (24h)
    const tirageTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
    localStorage.setItem('tirageTime', tirageTime.toISOString());
    
    const updateCountdown = () => {
      const now = new Date();
      const difference = tirageTime - now;
      
      if (difference <= 0) {
        setTimeLeft("🎉 TIRAGE EN COURS !");
        clearInterval(countdownInterval);
      } else {
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
    };

    updateCountdown();
    const countdownInterval = setInterval(updateCountdown, 1000);
  };

  // 🎯 CALCUL DE LA PROGRESSION
  const getNextLevel = () => {
    const nextLevel = currentLevel + 1;
    return LEVELS[nextLevel] ? LEVELS[nextLevel] : null;
  };

  const nextLevel = getNextLevel();
  const progression = nextLevel 
    ? Math.min(100, (participants / nextLevel.participants) * 100)
    : 100;

  return (
    <div className="text-center bg-white/10 backdrop-blur rounded-2xl p-8 border border-white/20 shadow-2xl">
      
      {/* EN-TÊTE DYNAMIQUE */}
      <div className="mb-8">
        <h2 className="text-4xl font-bold mb-4">
          {!seuilAtteint ? "🎪 Tirage en Préparation" : "🚀 Tirage Imminent !"}
        </h2>
        <p className="text-xl opacity-90">
          {!seuilAtteint 
            ? "Le tirage démarre à 150 participants" 
            : "Le compte à rebours final est lancé !"}
        </p>
      </div>

      {!seuilAtteint ? (
        /* 🎯 AFFICHAGE AVANT SEUIL */
        <div className="space-y-6">
          
          {/* COMPTEUR PARTICIPANTS */}
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl p-6 shadow-lg">
            <div className="text-5xl font-bold mb-2">{participants}</div>
            <div className="text-lg">Participants</div>
            <div className="text-sm opacity-80 mt-2">
              Objectif : {SEUIL_MINIMUM} participants
            </div>
          </div>

          {/* BARRE DE PROGRESSION PRINCIPALE */}
          <div className="bg-white/5 rounded-xl p-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Progression vers le tirage</span>
              <span>{participants}/{SEUIL_MINIMUM}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="bg-gradient-to-r from-green-400 to-blue-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (participants / SEUIL_MINIMUM) * 100)}%` }}
              ></div>
            </div>
            <div className="text-sm mt-2 text-yellow-300">
              {SEUIL_MINIMUM - participants > 0 
                ? `Plus que ${SEUIL_MINIMUM - participants} participants !` 
                : "🎉 Objectif atteint !"}
            </div>
          </div>

          /* 🎁 SYSTÈME DE LOTS PROGRESSIFS */
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6">
            <h3 className="text-2xl font-bold mb-4">🎁 Lots Progressifs</h3>
            
            {/* NIVEAU ACTUEL */}
            <div className="bg-white/20 rounded-xl p-4 mb-4">
              <div className="text-sm text-white/80">Niveau Actuel</div>
              <div className="text-xl font-bold">{LEVELS[currentLevel].label}</div>
              <div className="text-3xl font-bold mt-2">{LEVELS[currentLevel].lots} LOTS</div>
              <div className="text-sm mt-1">
                {participants >= LEVELS[currentLevel].participants 
                  ? "✅ Seuil atteint" 
                  : `À partir de ${LEVELS[currentLevel].participants} participants`}
              </div>
            </div>

            {/* PROCHAIN NIVEAU */}
            {nextLevel && (
              <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                <div className="text-sm text-white/80">Prochain Niveau</div>
                <div className="text-lg font-bold">{nextLevel.label}</div>
                <div className="text-2xl font-bold mt-1">{nextLevel.lots} LOTS</div>
                
                {/* BARRE PROGRESSION NIVEAU */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Progression</span>
                    <span>{participants}/{nextLevel.participants}</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progression}%` }}
                    ></div>
                  </div>
                  <div className="text-xs mt-1">
                    {nextLevel.participants - participants > 0 
                      ? `Encore ${nextLevel.participants - participants} participants` 
                      : "🎉 Niveau atteint !"}
                  </div>
                </div>
              </div>
            )}

            {/* NIVEAU MAX ATTEINT */}
            {!nextLevel && (
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-4 text-center">
                <div className="text-2xl">🏆 NIVEAU MAXIMAL</div>
                <div className="text-lg">Tous les lots sont débloqués !</div>
              </div>
            )}
          </div>

          /* 📱 APPEL À L'ACTION */
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-3">🚀 Accélérez le tirage !</h3>
            <p className="mb-4">
              Partagez avec vos amis pour débloquer plus de lots et déclencher le tirage plus rapidement !
            </p>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => (window.location.hash = '#/buy')}
                className="bg-white text-green-600 px-6 py-3 rounded-full font-bold hover:bg-gray-100 transition"
              >
                🎫 Acheter des tickets
              </button>
              <button 
                onClick={() => (window.location.hash = '#/')}
                className="bg-yellow-400 text-gray-800 px-6 py-3 rounded-full font-bold hover:bg-yellow-300 transition"
              >
                👥 Parrainer des amis
              </button>
            </div>
          </div>

          /* ⏰ DATE LIMITE */
          <div className="bg-white/5 rounded-xl p-4 text-sm">
            <div className="flex items-center justify-center gap-2">
              <span>⏰</span>
              <span>
                Tirage garanti le {DATE_LIMITE.toLocaleDateString()} même si le seuil n'est pas atteint
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* 🚀 AFFICHAGE APRÈS SEUIL ATTEINT */
        <div className="space-y-6">
          
          {/* COMPTE À REBOURS FINAL */}
          <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl p-8 shadow-2xl">
            <div className="text-2xl font-bold mb-4">🎉 TIRAGE DÉCLENCHÉ !</div>
            <div className="text-5xl font-bold mb-4">{timeLeft}</div>
            <div className="text-lg">Avant le tirage au sort</div>
          </div>

          /* 🏆 RÉCAPITULATIF FINAL */
          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl p-6">
            <h3 className="text-2xl font-bold mb-4">🏆 Lots Débloqués</h3>
            <div className="text-4xl font-bold mb-2">{LEVELS[currentLevel].lots} LOTS</div>
            <div className="text-lg">{LEVELS[currentLevel].label}</div>
            <div className="text-sm mt-2 opacity-80">
              Merci aux {participants} participants !
            </div>
          </div>

          /* 📊 STATISTIQUES FINALES */
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">{participants}</div>
              <div className="text-sm">Participants</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">{LEVELS[currentLevel].lots}</div>
              <div className="text-sm">Lots à gagner</div>
            </div>
          </div>

          <div className="bg-green-500/20 border border-green-400 rounded-xl p-4 text-center">
            <div className="text-lg font-bold">🎯 Le tirage sera diffusé en direct</div>
            <button 
              onClick={() => (window.location.hash = '#/live')}
              className="mt-3 bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full font-bold transition"
            >
              📺 Voir le direct
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Countdown;
