import React, { useState, useEffect } from 'react';
import Countdown from './Countdown';

const Home = () => {
  const [prizes, setPrizes] = useState([]);

  // Charger les lots depuis le localStorage
  useEffect(() => {
    const savedPrizes = localStorage.getItem('tombolaPrizes');
    if (savedPrizes) {
      setPrizes(JSON.parse(savedPrizes));
    } else {
      // Lots par défaut
      const defaultPrizes = [
        {
          id: 1,
          name: "Voyage en Italie",
          description: "Weekend romantique à Venise pour 2 personnes",
          value: "€1,500",
          emoji: "🇮🇹",
          order: 1,
          image: "https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=300&h=200&fit=crop"
        },
        {
          id: 2,
          name: "iPhone 15 Pro",
          description: "Dernier modèle 256GB",
          value: "€1,200",
          emoji: "📱",
          order: 2,
          image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300&h=200&fit=crop"
        },
        {
          id: 3,
          name: "Bon d'achat Amazon",
          description: "Dépensez-le comme vous voulez !",
          value: "€500",
          emoji: "📦",
          order: 3,
          image: "https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=300&h=200&fit=crop"
        }
      ];
      setPrizes(defaultPrizes);
      localStorage.setItem('tombolaPrizes', JSON.stringify(defaultPrizes));
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 text-white">
      <div className="container mx-auto px-4 py-8">
        
        {/* ✅ NOUVEAU COMPOSANT COUNTDOWN */}
        <Countdown />

        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">
            🎪 Tombola Excursion
          </h1>
          <p className="text-xl">
            Tentez votre chance pour gagner des lots exceptionnels !
          </p>
        </div>
        
        {/* AFFICHAGE DYNAMIQUE DES LOTS */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
          {prizes.map((prize) => (
            <div key={prize.id} className="bg-white/20 rounded-xl backdrop-blur border border-white/30 overflow-hidden hover:scale-105 transition duration-300">
              <div className="h-48 bg-gray-300 overflow-hidden">
                <img 
                  src={prize.image} 
                  alt={prize.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop';
                  }}
                />
              </div>
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-3xl">{prize.emoji}</div>
                  <div className="text-yellow-300 font-bold text-lg">{prize.value}</div>
                </div>
                
                <h3 className="text-xl font-semibold mb-2">{prize.name}</h3>
                <p className="text-white/80 text-sm mb-4">{prize.description}</p>
                
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <span className="text-sm">🎯 Lot {prize.order}</span>
                </div>

                {prize.winner && (
                  <div className="mt-3 bg-green-500/20 border border-green-400 rounded-lg p-2 text-center">
                    <span className="text-xs text-green-300">🏆 Déjà attribué</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {prizes.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎁</div>
            <h3 className="text-2xl font-bold mb-4">Lots en cours de préparation</h3>
            <p className="text-white/80 mb-6">
              Les lots exceptionnels de cette tombola seront annoncés très bientôt !
            </p>
            <div className="bg-white/10 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-sm">
                Revenez dans quelques instants pour découvrir les lots à gagner...
              </p>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
          <div className="bg-white/20 p-6 rounded-lg backdrop-blur">
            <h3 className="text-2xl font-semibold mb-4">🎫 Achetez vos tickets</h3>
            <p>Participation à partir de 5€</p>
          </div>
          
          <div className="bg-white/20 p-6 rounded-lg backdrop-blur">
            <h3 className="text-2xl font-semibold mb-4">💰 Paiement sécurisé</h3>
            <p>Carte bancaire & Crypto</p>
          </div>
          
          <div className="bg-white/20 p-6 rounded-lg backdrop-blur">
            <h3 className="text-2xl font-semibold mb-4">🏆 {prizes.length} Lots à gagner</h3>
            <p>Tentez votre chance dès maintenant</p>
          </div>
        </div>

        {/* ✅ NOUVELLE SECTION : RÈGLES DU JEU */}
        <div className="bg-white/10 rounded-2xl p-6 mt-8 backdrop-blur border border-white/20">
          <h3 className="text-2xl font-bold mb-4">📋 Règles du Tirage Progressif</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span>🎯</span>
                <span><strong>Seuil de déclenchement :</strong> 150 participants</span>
              </div>
              <div className="flex items-center gap-2">
                <span>⏰</span>
                <span><strong>Date limite :</strong> 31 décembre 2024</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🎁</span>
                <span><strong>Lots progressifs :</strong> De 3 à 15 lots</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span>✅</span>
                <span>Tirage garanti à 150 participants ou à la date limite</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🔄</span>
                <span>Plus de participants = plus de lots à gagner</span>
              </div>
              <div className="flex items-center gap-2">
                <span>📺</span>
                <span>Tirage en direct transparent</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center space-y-4 md:space-y-0 md:space-x-6 mt-8">
          <button 
            onClick={() => (window.location.hash = '#/buy')}
            className="bg-yellow-500 text-purple-900 px-8 py-4 rounded-full text-xl font-bold hover:bg-yellow-400 transition transform hover:scale-105 shadow-lg"
          >
            Acheter mes tickets 🎫
          </button>
          
          <button 
            onClick={() => (window.location.hash = '#/live')}
            className="bg-green-500 text-white px-8 py-4 rounded-full text-xl font-bold hover:bg-green-600 transition transform hover:scale-105 shadow-lg border-2 border-green-300"
          >
            📺 Voir le tirage en direct
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
