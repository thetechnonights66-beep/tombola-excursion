import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import BuyTickets from './components/BuyTickets';
import AdminPanel from './components/AdminPanel';
import Confirmation from './components/Confirmation';
import MyTickets from './components/MyTickets';
import AdminLogin from './components/AdminLogin';
import LiveDraw from './components/LiveDraw';
import PrizeManager from './components/PrizeManager';
import ReferralAdminPanel from './components/ReferralAdminPanel';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import AdminSecurity from './components/AdminSecurity';
import DataProtectionPanel from './components/DataProtectionPanel'; // ✅ IMPORT AJOUTÉ
import Footer from './components/Footer';
import { AnalyticsService } from './utils/analyticsService';

function App() {
  // ✅ INITIALISATION ANALYTICS AU DÉMARRAGE
  useEffect(() => {
    // Initialiser le service analytics
    AnalyticsService.init();
    
    // Démarrer une nouvelle session
    const sessionId = AnalyticsService.trackSession();
    AnalyticsService.setCurrentSessionId(sessionId);
    
    // Track page view initiale
    AnalyticsService.trackPageView('/');
    
    console.log('📊 Analytics initialisés - Session:', sessionId);
  }, []);

  return (
    <Router>
      <div className="App">
        {/* Navigation principale */}
        <nav className="bg-white shadow-lg">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex justify-between items-center py-4">
              <a 
                href="#/" 
                className="text-2xl font-bold text-purple-600 hover:text-purple-700 transition-colors"
                onClick={() => AnalyticsService.trackEvent('navigation', 'click', 'logo')}
              >
                🎪 Tombola
              </a>
              <div className="flex gap-4">
                <a 
                  href="#/" 
                  className="text-gray-700 hover:text-purple-600 transition-colors"
                  onClick={() => AnalyticsService.trackEvent('navigation', 'click', 'home')}
                >
                  Accueil
                </a>
                <a 
                  href="#/buy" 
                  className="text-gray-700 hover:text-purple-600 transition-colors"
                  onClick={() => AnalyticsService.trackEvent('navigation', 'click', 'buy_tickets')}
                >
                  Acheter
                </a>
                <a 
                  href="#/my-tickets" 
                  className="text-gray-700 hover:text-purple-600 transition-colors"
                  onClick={() => AnalyticsService.trackEvent('navigation', 'click', 'my_tickets')}
                >
                  Mes Tickets
                </a>
                <a 
                  href="#/live" 
                  className="text-green-600 hover:text-green-700 font-bold transition-colors"
                  onClick={() => AnalyticsService.trackEvent('navigation', 'click', 'live_draw')}
                >
                  📺 En Direct
                </a>
              </div>
            </div>
          </div>
        </nav>

        {/* Routes de l'application */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/buy" element={<BuyTickets />} />
          <Route path="/confirmation" element={<Confirmation />} />
          <Route path="/my-tickets" element={<MyTickets />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin-security" element={<AdminSecurity />} />
          <Route path="/data-protection" element={<DataProtectionPanel />} /> {/* ✅ NOUVELLE ROUTE AJOUTÉE */}
          <Route path="/live" element={<LiveDraw />} />
          <Route path="/prize-manager" element={<PrizeManager />} />
          <Route path="/referral-admin" element={<ReferralAdminPanel />} />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
        </Routes>

        {/* ✅ UTILISATION DU FOOTER SÉCURISÉ */}
        <Footer />
      </div>
    </Router>
  );
}

export default App;
