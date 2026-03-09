import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, User, Lock, Loader2, Mail, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { translations } from '../constants/translations';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
  forceVerification?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login', forceVerification = false }) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [needsVerification, setNeedsVerification] = useState(forceVerification);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const { user, login } = useAuth();

  const t = translations[user?.language || 'English'] || translations.English;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (needsVerification) {
      try {
        const res = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: verificationCode })
        });
        const data = await res.json();
        if (res.ok) {
          // Refresh user state to show as verified
          const meRes = await fetch('/api/auth/me');
          const meData = await meRes.json();
          login(meData);
          onClose();
        } else {
          setError(data.error || 'Verification failed');
        }
      } catch (err) {
        setError('Connection error');
      } finally {
        setLoading(false);
      }
      return;
    }

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });

      const data = await res.json();
      if (res.ok) {
        if (data.needsVerification) {
          setNeedsVerification(true);
          if (data.demoCode) setDemoCode(data.demoCode);
          setError('Please enter the verification code sent to your email.');
        } else {
          login(data);
          if (!data.isVerified) {
             setNeedsVerification(true);
             setError('Your email is not verified. Please enter the verification code.');
          } else {
            onClose();
          }
        }
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResending(true);
    setError('');
    try {
      const res = await fetch('/api/auth/resend-code', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        if (data.demoCode) setDemoCode(data.demoCode);
        setError('A new verification code has been generated.');
      } else {
        setError(data.error || 'Failed to resend code');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setResending(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setIsLogin(initialMode === 'login');
      setNeedsVerification(forceVerification);
      setError(forceVerification ? 'Please enter the verification code sent to your email.' : '');
    }
  }, [isOpen, initialMode, forceVerification]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {needsVerification ? t.verifyEmail : (isLogin ? t.welcomeBack : t.createAccount)}
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className={`p-3 border text-sm rounded-lg ${error.includes('verification code') ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-red-50 border-red-100 text-red-600'}`}>
                  {error}
                </div>
              )}

              {needsVerification ? (
                <div className="space-y-4">
                  {demoCode && (
                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-center">
                      <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Demo Mode Code</p>
                      <p className="text-3xl font-mono font-bold text-emerald-700 tracking-[0.5em]">{demoCode}</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">{t.verificationCode}</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                      placeholder="Enter 6-digit code"
                      required
                    />
                  </div>
                </div>
              </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      {isLogin ? t.usernameOrEmail : t.username}
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                        placeholder={isLogin ? t.usernameOrEmail : t.username}
                        required
                      />
                    </div>
                  </div>

                  {!isLogin && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">{t.emailAddress}</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                          placeholder="your@email.com"
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">{t.password}</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  needsVerification ? t.verify : (isLogin ? t.signIn : t.signUp)
                )}
              </button>
            </form>

            {needsVerification && (
              <div className="mt-6 text-center">
                <button
                  onClick={handleResendCode}
                  disabled={resending}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium disabled:opacity-50"
                >
                  {resending ? 'Resending...' : 'Resend verification code'}
                </button>
              </div>
            )}

            {!needsVerification && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  {isLogin ? t.dontHaveAccount : t.alreadyHaveAccount}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
