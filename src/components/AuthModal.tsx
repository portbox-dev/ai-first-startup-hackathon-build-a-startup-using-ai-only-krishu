import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  LogIn, 
  UserPlus, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Key, 
  Lock, 
  Mail,
  Info
} from 'lucide-react';
import { useSupabaseAuth } from '../supabase/useSupabaseAuth';
import { isSupabaseConfigured } from '../supabase/client';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
  onNotification?: (msg: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
  onNotification,
}) => {
  const { user, signIn, signUp, isLoading: authLoading } = useSupabaseAuth();
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setAuthMode(initialMode);
      setError(null);
      setSuccessMsg(null);
      setTimeout(() => {
        emailInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, initialMode]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (authMode === 'signin') {
      const res = await signIn(email, password);
      if (!res.success) {
        setError(res.error || 'Failed to sign in. Please verify your credentials.');
      } else {
        setSuccessMsg('Signed in successfully! Connecting to your restaurant...');
        if (onNotification) onNotification('Signed in as restaurant owner');
        setTimeout(() => {
          onClose();
        }, 900);
      }
    } else {
      const res = await signUp(email, password);
      if (!res.success) {
        setError(res.error || 'Failed to create account.');
      } else {
        setSuccessMsg(res.message || 'Account created successfully!');
        if (onNotification) onNotification('Restaurant owner account created');
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div 
        className="w-full max-w-md bg-[#0c182f] border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#091122]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-400/20 border border-teal-400/40 text-teal-300 flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 id="auth-modal-title" className="text-sm font-bold text-white tracking-tight">
                Restaurant Owner Authentication
              </h3>
              <p className="text-[11px] text-slate-400">
                {isSupabaseConfigured ? 'Sign in to access your cloud-hosted menu' : 'Supabase Cloud Configuration'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {!isSupabaseConfigured ? (
            /* Unconfigured Supabase State - Clean restaurant owner message */
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-white block">Offline Prototype Mode</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    SmartMenu is operating in local storage mode on this device. You can create, edit, and preview dishes locally. Cloud accounts are not currently active for this instance.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
              >
                Continue in Local Mode
              </button>
            </div>
          ) : user ? (
            /* Already signed in state */
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/80 text-emerald-200 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold text-white block">You are already signed in</span>
                  <span className="text-[11px] text-slate-300">{user.email}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          ) : (
            /* Configured & Ready for Sign In / Sign Up */
            <>
              {/* Tab Switcher */}
              <div className="flex rounded-xl bg-slate-900/90 p-1 border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                    authMode === 'signin'
                      ? 'bg-teal-400 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                    authMode === 'signup'
                      ? 'bg-teal-400 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create Account</span>
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Owner Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      ref={emailInputRef}
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="owner@greenleafcafe.com"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 transition-colors"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2 animate-in fade-in duration-150">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed text-[11px]">{error}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in duration-150">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-[11px] font-semibold">{successMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-teal-400 hover:bg-teal-300 active:scale-[0.98] text-slate-950 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-teal-500/20 disabled:opacity-50"
                >
                  {authLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : authMode === 'signin' ? (
                    <LogIn className="w-4 h-4" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  <span>
                    {authLoading
                      ? 'Authenticating...'
                      : authMode === 'signin'
                      ? 'Sign In as Restaurant Owner'
                      : 'Create Owner Account'}
                  </span>
                </button>
              </form>

              {/* Mode switch helper link */}
              <div className="pt-2 text-center text-xs text-slate-400">
                {authMode === 'signin' ? (
                  <span>
                    Don&apos;t have an owner account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('signup');
                        setError(null);
                      }}
                      className="text-teal-400 hover:underline font-semibold"
                    >
                      Create one
                    </button>
                  </span>
                ) : (
                  <span>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('signin');
                        setError(null);
                      }}
                      className="text-teal-400 hover:underline font-semibold"
                    >
                      Sign in here
                    </button>
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
