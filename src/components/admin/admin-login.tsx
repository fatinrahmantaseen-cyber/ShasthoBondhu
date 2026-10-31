'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api-client';
import { setAdminSession, AdminSession } from '@/lib/admin-auth';
import { ShieldCheck, Lock, User, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: (session: AdminSession) => void;
}

export function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent duplicate submission while already processing
    if (loading) return;

    if (!username.trim()) {
      setErrorMessage('Please enter your administrator username.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your administrator password.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await api.admin.login({
        username: username.trim(),
        password,
      });

      const session = setAdminSession(res.access_token, username.trim(), res.expires_in);
      onLoginSuccess(session);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setErrorMessage('Invalid administrator credentials.');
        } else if (err.status === 429) {
          setErrorMessage('Too many failed login attempts. Locked out for rate-limit protection. Please try again later.');
        } else if (err.status === 503) {
          setErrorMessage('Administrator authentication is not configured on this server.');
        } else {
          setErrorMessage(err.message || 'An error occurred during authentication.');
        }
      } else {
        setErrorMessage('Unable to connect to administrative authentication server.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4"
      suppressHydrationWarning
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 p-8 text-white text-center">
          <div className="w-14 h-14 bg-white/10 rounded-2xl backdrop-blur-md flex items-center justify-center mx-auto mb-4 border border-white/20 shadow-inner">
            <ShieldCheck className="w-8 h-8 text-blue-200" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            Shastho<span className="text-blue-300">Bondhu</span> Admin
          </h1>
          <p className="text-xs text-blue-200 mt-1 font-medium">
            স্বাস্থ্যবন্ধু প্রশাসনিক যাচাইকরণ এবং নিয়ন্ত্রণ ড্যাশবোর্ড
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/60 text-blue-200 border border-blue-400/30 text-[11px] font-semibold">
            <span>Authorized Personnel Only</span>
          </div>
        </div>

        {/* Login Form */}
        <div className="p-8">
          {errorMessage && (
            <div
              id="admin-login-error"
              role="alert"
              aria-live="polite"
              className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-sm"
            >
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Authentication Failed</p>
                <p className="text-xs mt-0.5 text-rose-700 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label
                htmlFor="admin-username"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2"
              >
                Administrator Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="admin-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  autoComplete="username"
                  disabled={loading}
                  aria-invalid={!!errorMessage}
                  aria-describedby={errorMessage ? 'admin-login-error' : undefined}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2"
              >
                Administrator Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  autoComplete="current-password"
                  disabled={loading}
                  aria-invalid={!!errorMessage}
                  aria-describedby={errorMessage ? 'admin-login-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={loading}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none focus:text-blue-600 transition-colors cursor-pointer disabled:cursor-not-allowed"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={0}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Access Dashboard</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <Link
              href="/"
              className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
            >
              &larr; Return to ShasthoBondhu Public Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
