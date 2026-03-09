import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings, History, Lock, Phone, Globe, LogOut, X, Check, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { translations } from '../constants/translations';

const LANGUAGES = [
  'English', 'Chinese', 'Spanish', 'Vietnamese', 'Korean', 'African language'
];

interface UserSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  userHistory: { reports: any[], logins: { timestamp: string }[] } | null;
  onRefreshHistory: () => void;
  onVerify: () => void;
}

export const UserSettings: React.FC<UserSettingsProps> = ({ isOpen, onClose, userHistory, onRefreshHistory, onVerify }) => {
  const { user, logout, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'settings' | 'history'>('settings');
  const [language, setLanguage] = useState(user?.language || 'English');
  const [phone, setPhone] = useState(user?.phone || '');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const t = translations[user?.language || 'English'] || translations.English;

  useEffect(() => {
    if (user) {
      setLanguage(user.language);
      setPhone(user.phone || '');
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      onRefreshHistory();
    }
  }, [isOpen]);

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, phone })
      });

      if (res.ok) {
        setSuccess('Settings updated successfully');
        await refreshUser();
      } else {
        setError('Failed to update settings');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword })
      });

      if (res.ok) {
        setSuccess('Password reset successfully');
        setNewPassword('');
      } else {
        setError('Failed to reset password');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                  activeTab === 'settings' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Settings className="w-5 h-5" />
                <span className="font-medium">{t.settings}</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                  activeTab === 'history' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <History className="w-5 h-5" />
                <span className="font-medium">{t.history}</span>
              </button>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm rounded-lg flex items-center gap-2">
                <Check className="w-4 h-4" />
                {success}
              </div>
            )}

            {activeTab === 'settings' ? (
              <div className="space-y-8">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account</p>
                      <p className="text-sm font-medium text-slate-900">{user?.username}</p>
                      <p className="text-xs text-slate-500">{user?.email}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      user?.isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {user?.isVerified ? 'Verified' : 'Unverified'}
                    </div>
                  </div>
                  {!user?.isVerified && (
                    <button 
                      onClick={onVerify}
                      className="mt-4 w-full py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20"
                    >
                      {t.verifyEmail}
                    </button>
                  )}
                </div>

                <form onSubmit={handleUpdateSettings} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        {t.preferredLanguage}
                      </label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      >
                        {LANGUAGES.map(lang => (
                          <option key={lang} value={lang}>{lang}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {t.phoneNumber}
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50"
                  >
                    {t.saveSettings}
                  </button>
                </form>

                <div className="pt-8 border-t border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    {t.security}
                  </h3>
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">{t.newPassword}</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full max-w-md px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                        placeholder="Enter new password"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading || !newPassword}
                      className="px-6 py-2 bg-gray-900 text-white font-medium rounded-xl hover:bg-black transition-all disabled:opacity-50"
                    >
                      {t.resetPassword}
                    </button>
                  </form>
                </div>

                <div className="pt-8 border-t border-gray-100">
                  <button
                    onClick={() => { logout(); onClose(); }}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    {t.signOut}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.historicalReports}</h3>
                  {userHistory?.reports && userHistory.reports.length > 0 ? (
                    <div className="space-y-3">
                      {userHistory.reports.map(report => (
                        <div key={report.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="flex justify-between items-start mb-2">
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded uppercase tracking-wider">
                              {report.type}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(report.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-900 mb-1">{report.address}</p>
                          <p className="text-xs text-gray-500 line-clamp-2">{report.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">{t.noReports}</p>
                  )}
                </div>

                <div className="pt-8 border-t border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.loginHistory}</h3>
                  {userHistory?.logins && userHistory.logins.length > 0 ? (
                    <div className="space-y-2">
                      {userHistory.logins.map((login, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-sm text-gray-600">
                          <Check className="w-4 h-4 text-emerald-500" />
                          <span>Logged in on {new Date(login.timestamp).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">{t.noLoginHistory}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
