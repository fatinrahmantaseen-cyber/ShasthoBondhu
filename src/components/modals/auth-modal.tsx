'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/language-context';
import { X, ShieldAlert, CheckCircle2, UserCheck, Lock } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const { t } = useLanguage();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [submitted, setSubmitted] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    setIdentifier('');
    setPassword('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs">
                <Lock className="w-5 h-5 text-blue-200" />
              </div>
              <div>
                <h3 id="auth-modal-title" className="text-xl font-bold tracking-tight">
                  {mode === 'login' ? t.modals.auth.signInBtn : t.modals.auth.registerBtn}
                </h3>
                <p className="text-xs text-blue-100 mt-0.5">{t.modals.auth.subtitle}</p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Prototype Warning Banner */}
        <div className="bg-amber-50 border-b border-amber-200/80 px-6 py-3 flex items-start gap-3 text-xs text-amber-900">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p>{t.modals.auth.notice}</p>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {submitted ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-slate-800">
                {mode === 'login' ? 'Demo Login Verified' : 'Demo Registration Acknowledged'}
              </h4>
              <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed">
                {t.modals.auth.successDemo}
              </p>
              <button
                type="button"
                onClick={handleReset}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-sm transition-colors text-sm"
              >
                {t.modals.auth.close}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t.modals.auth.emailLabel}
                </label>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={t.modals.auth.emailPlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    {t.modals.auth.passwordLabel}
                  </label>
                  {mode === 'login' && (
                    <span className="text-xs text-blue-600 cursor-pointer hover:underline">
                      {t.modals.auth.forgotPass}
                    </span>
                  )}
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.modals.auth.passwordPlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <UserCheck className="w-4 h-4" />
                  {mode === 'login' ? t.modals.auth.signInBtn : t.modals.auth.registerBtn}
                </button>
              </div>

              <div className="text-center pt-2 text-xs text-slate-600">
                {mode === 'login' ? (
                  <span>
                    {t.modals.auth.noAccount}{' '}
                    <button
                      type="button"
                      onClick={() => setMode('register')}
                      className="font-bold text-blue-600 hover:underline ml-1"
                    >
                      {t.nav.register}
                    </button>
                  </span>
                ) : (
                  <span>
                    {t.modals.auth.haveAccount}{' '}
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="font-bold text-blue-600 hover:underline ml-1"
                    >
                      {t.nav.login}
                    </button>
                  </span>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

