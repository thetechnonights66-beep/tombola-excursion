import React, { useState, useEffect } from 'react';
import { PrizeManager } from '../utils/prizeManager';
import { TicketStorage } from '../utils/ticketStorage'; // ✅ IMPORT AJOUTÉ

const PrizeManagerComponent = () => {
  const [prizes, setPrizes] = useState([]);
  const [editingPrize, setEditingPrize] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPrize, setNewPrize] = useState({
    emoji: "🎁",
    name: "",
    value: "",
    image: "",
    description: ""
  });
  const [participantCount, setParticipantCount] = useState(0); // ✅ STATE AJOUTÉ
  const [maxLots, setMaxLots] = useState(3); // ✅ STATE AJOUTÉ

  useEffect(() => {
    loadPrizes();
    calculateMaxLots(); // ✅ CALCUL AUTOMATIQUE
  }, []);

  const loadPrizes = () => {
    const loadedPrizes = PrizeManager.getPrizes();
    setPrizes(loadedPrizes.sort((a, b) => a.order - b.order));
  };

  // ✅ FONCTION POUR CALCULER LE NOMBRE MAX DE LOTS
  const calculateMaxLots = () => {
    const participants = TicketStorage.getAllParticipants();
    const count = participants.length;
    setParticipantCount(count);
    
    const calculatedMaxLots = getLotsByParticipantCount(count);
    setMaxLots(calculatedMaxLots);
    
    console.log(`🎯 Participants: ${count} → Lots recommandés: ${calculatedMaxLots}`);
  };

  // ✅ FONCTION DE CALCUL DES LOTS PAR NOMBRE DE PARTICIPANTS
  const getLotsByParticipantCount = (participantCount) => {
    const LEVELS = {
      1: { participants: 0, lots: 3 },
      2: { participants: 50, lots: 3 },
      3: { participants: 100, lots: 5 },
      4: { participants: 150, lots: 5 },
      5: { participants: 200, lots: 7 },
      6: { participants: 300, lots: 10 }
    };

    let appropriateLevel = 1;
    Object.keys(LEVELS).reverse().forEach(level => {
      if (participantCount >= LEVELS[level].participants) {
        appropriateLevel = parseInt(level);
        return;
      }
    });

    return LEVELS[appropriateLevel].lots;
  };

  const handleAddPrize = () => {
    // ✅ VÉRIFICATION DU NOMBRE MAXIMUM DE LOTS
    if (prizes.length >= maxLots) {
      alert(`❌ Nombre maximum de lots atteint (${maxLots})\n\n📊 Participants actuels: ${participantCount}\n🎯 Lots recommandés: ${maxLots}\n\n💡 Augmentez le nombre de participants pour ajouter plus de lots.`);
      return;
    }

    if (!newPrize.name || !newPrize.value) {
      alert('Veuillez remplir au moins le nom et la valeur du lot');
      return;
    }

    PrizeManager.addPrize(newPrize);
    setNewPrize({
      emoji: "🎁",
      name: "",
      value: "",
      image: "",
      description: ""
    });
    setShowAddForm(false);
    loadPrizes();
    calculateMaxLots(); // ✅ RECALCUL APRÈS AJOUT
  };

  const handleUpdatePrize = (prizeId, updates) => {
    PrizeManager.updatePrize(prizeId, updates);
    setEditingPrize(null);
    loadPrizes();
  };

  const handleDeletePrize = (prizeId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce lot ?')) {
      PrizeManager.deletePrize(prizeId);
      loadPrizes();
      calculateMaxLots(); // ✅ RECALCUL APRÈS SUPPRESSION
    }
  };

  const handleReorder = (fromIndex, toIndex) => {
    const reorderedPrizes = [...prizes];
    const [movedPrize] = reorderedPrizes.splice(fromIndex, 1);
    reorderedPrizes.splice(toIndex, 0, movedPrize);
    
    const prizeIds = reorderedPrizes.map(prize => prize.id);
    PrizeManager.reorderPrizes(prizeIds);
    loadPrizes();
  };

  const handleToggleActive = (prizeId, isActive) => {
    PrizeManager.updatePrize(prizeId, { isActive });
    loadPrizes();
  };

  const addSamplePrizes = () => {
    // ✅ VÉRIFICATION AVANT D'AJOUTER LES LOTS EXEMPLES
    const samplePrizes = PrizeManager.getSamplePrizes();
    const availableSlots = maxLots - prizes.length;
    
    if (availableSlots < samplePrizes.length) {
      alert(`❌ Pas assez de places disponibles pour tous les lots exemples\n\n📊 Places disponibles: ${availableSlots}\n🎁 Lots exemples: ${samplePrizes.length}\n\n💡 Supprimez quelques lots ou augmentez le nombre de participants.`);
      return;
    }

    samplePrizes.forEach(prize => {
      PrizeManager.addPrize(prize);
    });
    loadPrizes();
    calculateMaxLots();
  };

  const resetAllWinners = () => {
    if (window.confirm('Réinitialiser tous les gagnants ?')) {
      PrizeManager.resetWinners();
      loadPrizes();
    }
  };

  const refreshParticipantCount = () => {
    calculateMaxLots();
  };

  const report = PrizeManager.generatePrizesReport();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* En-tête */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">🎁 Gestion des Lots</h1>
            <p className="text-gray-400 mt-2">Configurez les lots de votre tombola</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setShowAddForm(true)}
              disabled={prizes.length >= maxLots}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                prizes.length >= maxLots 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              ➕ Ajouter un Lot
            </button>
            <button
              onClick={addSamplePrizes}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold"
            >
              🧪 Lots Exemples
            </button>
            <button
              onClick={resetAllWinners}
              className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg font-semibold"
            >
              🔄 Reset Gagnants
            </button>
            <button
              onClick={refreshParticipantCount}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-semibold"
            >
              🔄 Actualiser
            </button>
          </div>
        </div>

        {/* ✅ NOUVELLE SECTION : STATISTIQUES PARTICIPANTS ET LOTS */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-blue-600 p-4 rounded-lg">
            <div className="text-2xl font-bold">{report.totalPrizes}</div>
            <div>Total Lots</div>
          </div>
          <div className="bg-green-600 p-4 rounded-lg">
            <div className="text-2xl font-bold">{report.activePrizes}</div>
            <div>Lots Actifs</div>
          </div>
          <div className="bg-purple-600 p-4 rounded-lg">
            <div className="text-2xl font-bold">{report.awardedPrizes}</div>
            <div>Lots Attribués</div>
          </div>
          <div className="bg-yellow-600 p-4 rounded-lg">
            <div className="text-2xl font-bold">€{report.totalValue}</div>
            <div>Valeur Totale</div>
          </div>
          {/* ✅ NOUVELLES STATS PARTICIPANTS */}
          <div className="bg-indigo-600 p-4 rounded-lg">
            <div className="text-2xl font-bold">{participantCount}</div>
            <div>Participants</div>
          </div>
          <div className="bg-pink-600 p-4 rounded-lg">
            <div className="text-2xl font-bold">{maxLots}</div>
            <div>Lots Max</div>
          </div>
        </div>

        {/* ✅ INDICATEUR DE PROGRESSION */}
        <div className="bg-gray-800 rounded-lg p-4 mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold">📊 Utilisation des lots</span>
            <span className="text-sm text-gray-400">
              {prizes.length} / {maxLots} lots utilisés
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-4">
            <div 
              className="bg-gradient-to-r from-green-500 to-blue-500 h-4 rounded-full transition-all duration-500"
              style={{ width: `${(prizes.length / maxLots) * 100}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-400 mt-2">
            {prizes.length >= maxLots ? (
              <span className="text-red-400">❌ Maximum atteint - Augmentez le nombre de participants pour ajouter plus de lots</span>
            ) : (
              <span>💡 Places disponibles: {maxLots - prizes.length} lot(s)</span>
            )}
          </div>
        </div>

        {/* ✅ TABLEAU DES SEUILS */}
        <div className="bg-gray-800 rounded-lg p-4 mb-8">
          <h3 className="font-semibold mb-3">📈 Seuils de lots par nombre de participants</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-sm">
            <div className={`text-center p-2 rounded ${participantCount >= 0 ? 'bg-green-500' : 'bg-gray-700'}`}>
              <div className="font-bold">3 lots</div>
              <div>≥ 0 participants</div>
            </div>
            <div className={`text-center p-2 rounded ${participantCount >= 50 ? 'bg-green-500' : 'bg-gray-700'}`}>
              <div className="font-bold">5 lots</div>
              <div>≥ 50 participants</div>
            </div>
            <div className={`text-center p-2 rounded ${participantCount >= 100 ? 'bg-green-500' : 'bg-gray-700'}`}>
              <div className="font-bold">7 lots</div>
              <div>≥ 100 participants</div>
            </div>
            <div className={`text-center p-2 rounded ${participantCount >= 150 ? 'bg-green-500' : 'bg-gray-700'}`}>
              <div className="font-bold">10 lots</div>
              <div>≥ 150 participants</div>
            </div>
            <div className={`text-center p-2 rounded ${participantCount >= 200 ? 'bg-green-500' : 'bg-gray-700'}`}>
              <div className="font-bold">12 lots</div>
              <div>≥ 200 participants</div>
            </div>
            <div className={`text-center p-2 rounded ${participantCount >= 300 ? 'bg-green-500' : 'bg-gray-700'}`}>
              <div className="font-bold">15 lots</div>
              <div>≥ 300 participants</div>
            </div>
          </div>
        </div>

        {/* Formulaire d'ajout */}
        {showAddForm && (
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">➕ Ajouter un Nouveau Lot</h3>
              <div className="text-sm text-gray-400">
                Lot {prizes.length + 1} sur {maxLots} maximum
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Emoji</label>
                <input
                  type="text"
                  value={newPrize.emoji}
                  onChange={(e) => setNewPrize({...newPrize, emoji: e.target.value})}
                  className="w-full p-3 bg-gray-700 rounded-lg"
                  placeholder="🎁"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Nom du Lot *</label>
                <input
                  type="text"
                  value={newPrize.name}
                  onChange={(e) => setNewPrize({...newPrize, name: e.target.value})}
                  className="w-full p-3 bg-gray-700 rounded-lg"
                  placeholder="Voiture Tesla"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Valeur *</label>
                <input
                  type="text"
                  value={newPrize.value}
                  onChange={(e) => setNewPrize({...newPrize, value: e.target.value})}
                  className="w-full p-3 bg-gray-700 rounded-lg"
                  placeholder="45,000€"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Image URL</label>
                <input
                  type="text"
                  value={newPrize.image}
                  onChange={(e) => setNewPrize({...newPrize, image: e.target.value})}
                  className="w-full p-3 bg-gray-700 rounded-lg"
                  placeholder="https://..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={newPrize.description}
                  onChange={(e) => setNewPrize({...newPrize, description: e.target.value})}
                  className="w-full p-3 bg-gray-700 rounded-lg"
                  rows="3"
                  placeholder="Description détaillée du lot..."
                />
              </div>
            </div>
            <div className="flex gap-4 mt-4">
              <button
                onClick={handleAddPrize}
                className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg font-semibold"
              >
                ✅ Ajouter
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded-lg font-semibold"
              >
                ❌ Annuler
              </button>
            </div>
          </div>
        )}

        {/* Reste du code inchangé */}
        {/* ... (le reste du composant reste identique) ... */}
      </div>
    </div>
  );
};

// Composant de formulaire d'édition (inchangé)
const EditPrizeForm = ({ prize, onSave, onCancel }) => {
  const [formData, setFormData] = useState({ ...prize });

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-2">Emoji</label>
        <input
          type="text"
          value={formData.emoji}
          onChange={(e) => setFormData({...formData, emoji: e.target.value})}
          className="w-full p-2 bg-gray-700 rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Nom</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          className="w-full p-2 bg-gray-700 rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Valeur</label>
        <input
          type="text"
          value={formData.value}
          onChange={(e) => setFormData({...formData, value: e.target.value})}
          className="w-full p-2 bg-gray-700 rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Image URL</label>
        <input
          type="text"
          value={formData.image}
          onChange={(e) => setFormData({...formData, image: e.target.value})}
          className="w-full p-2 bg-gray-700 rounded"
        />
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          className="w-full p-2 bg-gray-700 rounded"
          rows="2"
        />
      </div>
      <div className="md:col-span-2 flex gap-4">
        <button
          onClick={handleSave}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
        >
          ✅ Sauvegarder
        </button>
        <button
          onClick={onCancel}
          className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
        >
          ❌ Annuler
        </button>
      </div>
    </div>
  );
};

export default PrizeManagerComponent;
