'use client';

import React, { useState, useEffect } from 'react';
import {
  getAdminSession,
  clearAdminSession,
  AdminSession,
} from '@/lib/admin-auth';
import { AdminLogin } from '@/components/admin/admin-login';
import { AdminHeader } from '@/components/admin/admin-header';
import { VerificationQueue } from '@/components/admin/verification-queue';
import { AuditLogTable } from '@/components/admin/audit-log-table';
import {
  Building2,
  Stethoscope,
  Pill,
  History,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

type AdminTab = 'hospitals' | 'doctors' | 'pharmacies' | 'audit';

export default function AdminDashboardPage() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('hospitals');

  useEffect(() => {
    // Check session on client mount
    const existing = getAdminSession();
    queueMicrotask(() => {
      setSession(existing);
      setCheckingAuth(false);
    });
  }, []);

  const handleLoginSuccess = (newSession: AdminSession) => {
    setSession(newSession);
  };

  const handleLogout = () => {
    clearAdminSession();
    setSession(null);
  };

  // Initial session verification loader
  if (checkingAuth) {
    return (
      <div
        className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white"
        suppressHydrationWarning
      >
        <Loader2 className="w-8 h-8 animate-spin text-blue-400 mb-3" />
        <p className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
          Verifying administrative credentials...
        </p>
      </div>
    );
  }

  // If unauthenticated, present dedicated Admin Login screen
  if (!session) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 font-sans">
      <AdminHeader session={session} onLogout={handleLogout} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Admin Dashboard Welcome Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-blue-200 border border-white/20 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
              <span>Healthcare Directory Governance</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Healthcare Directory Verification
            </h1>
            <p className="text-sm text-blue-100 max-w-2xl leading-relaxed">
              যাচাইকরণ ড্যাশবোর্ড: হাসপাতাল, বিশেষজ্ঞ চিকিৎসক এবং ফার্মেসি নিবন্ধনের তথ্য যাচাই করে অনুমোদন বা প্রত্যাখ্যান করুন। জনসম্মুখে কেবল অনুমোদিত তথ্যই দৃশ্যমান হবে।
            </p>
          </div>
          {/* Subtle background glow effect */}
          <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
          {(
            [
              { id: 'hospitals', label: 'Hospital Submissions', icon: Building2 },
              { id: 'doctors', label: 'Doctor Submissions', icon: Stethoscope },
              { id: 'pharmacies', label: 'Pharmacy Submissions', icon: Pill },
              { id: 'audit', label: 'Audit Trail Ledger', icon: History },
            ] as const
          ).map((tab) => {
            const active = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  active
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Tab Queue Content */}
        <div className="pt-2">
          {activeTab === 'hospitals' && (
            <VerificationQueue
              key="hospitals"
              entityType="hospital"
              token={session.token}
              onUnauthorized={handleLogout}
            />
          )}

          {activeTab === 'doctors' && (
            <VerificationQueue
              key="doctors"
              entityType="doctor"
              token={session.token}
              onUnauthorized={handleLogout}
            />
          )}

          {activeTab === 'pharmacies' && (
            <VerificationQueue
              key="pharmacies"
              entityType="pharmacy"
              token={session.token}
              onUnauthorized={handleLogout}
            />
          )}

          {activeTab === 'audit' && (
            <AuditLogTable
              token={session.token}
              onUnauthorized={handleLogout}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 py-6 text-center text-xs text-slate-500 bg-white">
        <p className="font-semibold text-slate-700">
          ShasthoBondhu (স্বাস্থ্যবন্ধু) Administrator Governance Console
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          All administrative decisions are securely hashed and immutably recorded in the database audit log.
        </p>
      </footer>
    </div>
  );
}
