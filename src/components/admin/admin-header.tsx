'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, Shield, LogOut, ExternalLink } from 'lucide-react';
import { AdminSession } from '@/lib/admin-auth';

interface AdminHeaderProps {
  session: AdminSession;
  onLogout: () => void;
}

export function AdminHeader({ session, onLogout }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-30 w-full bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="flex items-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-xl p-1"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Heart className="w-5 h-5 fill-white text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg sm:text-xl font-black text-white tracking-tight">
                    Shastho<span className="text-blue-400">Bondhu</span>
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-black tracking-wider uppercase bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    Admin
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
                  যাচাইকরণ এবং অনুমোদন প্ল্যাটফর্ম
                </p>
              </div>
            </Link>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/"
              target="_blank"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition-colors"
            >
              <span>Public Portal</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>

            {/* Admin identity badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-950/60 border border-blue-800/60 text-xs text-blue-200">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-semibold">{session.username}</span>
            </div>

            {/* Logout button */}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 transition-colors cursor-pointer"
              title="End session and log out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
