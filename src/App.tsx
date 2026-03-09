import { useState, useEffect, useCallback } from 'react';
import { useRainWatchData } from './services/api';
import RainMap from './components/Map';
import ReportForm from './components/ReportForm';
import Dashboard from './components/Dashboard';
import WeatherAlert from './components/WeatherAlert';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthModal } from './components/AuthModal';
import { UserSettings } from './components/UserSettings';
import { Plus, LayoutDashboard, Map as MapIcon, Settings, Droplets, Info, CloudRain, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { translations } from './constants/translations';

function AppContent() {
  const { complaints, recommendations, weather, submitComplaint, userHistory, fetchUserHistory } = useRainWatchData();
  const { user } = useAuth();
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [forceVerification, setForceVerification] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showPostStormModal, setShowPostStormModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'dashboard'>('map');

  const t = translations[user?.language || 'English'] || translations.English;

  // Refresh user history whenever the user logs in or changes
  useEffect(() => {
    if (user) {
      fetchUserHistory();
    }
  }, [user, fetchUserHistory]);

  // Also refresh history whenever the settings panel opens
  const handleOpenSettings = useCallback(() => {
    if (user) {
      fetchUserHistory();
    }
    setIsSettingsOpen(true);
  }, [user, fetchUserHistory]);

  const montgomeryCenter: [number, number] = [39.0458, -77.1975];

  const handleReportSubmit = async (data: any) => {
    // submitComplaint already handles: posting, immediate map update,
    // re-fetching full complaints list, and refreshing user history
    await submitComplaint(data);

    // Close the report form and show the success toast
    setIsReportOpen(false);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  // Simulate post-storm reminder after weather data loads
  useEffect(() => {
    if (weather && weather.current_weather.weathercode > 0) {
      const timer = setTimeout(() => setShowPostStormModal(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [weather]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-[1500] bg-white/80 backdrop-blur-md border-b border-black/5 px-4 md:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
            <Droplets className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-900 tracking-tight leading-none">RainWatch</h1>
            <p className="text-[10px] text-slate-400 font-medium">Montgomery County</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'map' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            {t.liveMap}
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'dashboard' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            {t.insights}
          </button>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <button
                onClick={handleOpenSettings}
                className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
              >
                <Settings className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 rounded-full bg-emerald-100 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
                <User className="w-5 h-5 text-emerald-600" />
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setAuthMode('login'); setIsAuthOpen(true); }}
                className="px-4 py-2 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-100 transition-all"
              >
                {t.signIn}
              </button>
              <button
                onClick={() => { setAuthMode('signup'); setIsAuthOpen(true); }}
                className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
              >
                {t.signUp}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
        {/* Left Column: Map & Alerts */}
        <div className="lg:col-span-8 flex flex-col gap-6 h-[calc(100vh-140px)]">
          <WeatherAlert weather={weather} />

          <div className="flex-1 relative">
            <RainMap
              complaints={complaints}
              recommendations={recommendations}
              center={montgomeryCenter}
            />

            {/* Floating Action Button */}
            <button
              onClick={() => setIsReportOpen(true)}
              className="absolute bottom-6 left-6 z-[1000] bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-blue-600/40 flex items-center gap-3 font-bold transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-5 h-5" />
              {t.reportIssue}
            </button>

            {/* Success Toast */}
            <AnimatePresence>
              {showSuccessToast && (
                <motion.div
                  initial={{ opacity: 0, y: 50, x: '-50%' }}
                  animate={{ opacity: 1, y: 0, x: '-50%' }}
                  exit={{ opacity: 0, y: 50, x: '-50%' }}
                  className="absolute bottom-24 left-1/2 z-[2000] bg-green-600 text-white px-6 py-3 rounded-2xl shadow-xl font-bold flex items-center gap-2"
                >
                  <Droplets className="w-4 h-4" />
                  {t.success}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Dashboard & Recs */}
        <aside className="lg:col-span-4 flex flex-col h-[calc(100vh-140px)]">
          <div className="bg-white rounded-3xl border border-black/5 shadow-sm p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900">{t.communityDashboard}</h2>
              <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                {t.liveUpdates}
              </div>
            </div>

            <Dashboard recommendations={recommendations} complaints={complaints} />

            <div className="mt-auto pt-6 border-t border-slate-100">
              <div className="bg-slate-50 p-4 rounded-2xl flex items-start gap-3">
                <Info className="w-4 h-4 text-slate-400 mt-0.5" />
                <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                  RainWatch uses a <span className="text-orange-500 font-bold">Micro-Terrain Runoff Module</span> to analyze elevation and slope alongside your reports for optimal water capture.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Report Form Modal */}
      <ReportForm
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        onSubmit={handleReportSubmit}
      />

      {/* Post-Storm Modal */}
      <AnimatePresence>
        {showPostStormModal && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm text-center border border-black/5"
            >
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CloudRain className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{t.stormPassed}</h3>
              <p className="text-sm text-slate-500 mb-6">{t.stormPassedDesc}</p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => { setShowPostStormModal(false); setIsReportOpen(true); }}
                  className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors"
                >
                  {t.reportNow}
                </button>
                <button
                  onClick={() => setShowPostStormModal(false)}
                  className="w-full text-slate-400 font-bold py-2 text-xs hover:text-slate-600 transition-colors"
                >
                  {t.maybeLater}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Auth & Settings Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => { setIsAuthOpen(false); setForceVerification(false); }}
        initialMode={authMode}
        forceVerification={forceVerification}
      />
      <UserSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        userHistory={userHistory}
        onRefreshHistory={fetchUserHistory}
        onVerify={() => {
          setIsSettingsOpen(false);
          setForceVerification(true);
          setIsAuthOpen(true);
        }}
      />

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[2000] bg-white/80 backdrop-blur-md border border-black/5 px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-4">
        <button onClick={() => setActiveTab('map')} className={`p-2 rounded-xl ${activeTab === 'map' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>
          <MapIcon className="w-5 h-5" />
        </button>
        <button onClick={() => setActiveTab('dashboard')} className={`p-2 rounded-xl ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>
          <LayoutDashboard className="w-5 h-5" />
        </button>
        <div className="w-px h-6 bg-slate-200"></div>
        <button onClick={() => setIsReportOpen(true)} className="p-2 rounded-xl bg-blue-600 text-white">
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
