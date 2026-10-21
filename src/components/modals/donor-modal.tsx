'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/language-context';
import { BloodGroup, BangladeshDivision } from '@/types';
import { BANGLADESH_DIVISIONS } from '@/data/sample-data';
import { X, HeartHandshake, ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react';

interface DonorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGroup?: BloodGroup;
}

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export function DonorModal({ isOpen, onClose, selectedGroup = 'O+' }: DonorModalProps) {
  const { t } = useLanguage();
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>(selectedGroup);
  const [fullName, setFullName] = useState('');
  const [division, setDivision] = useState<BangladeshDivision>('Dhaka');
  const [district, setDistrict] = useState('Dhaka');
  const [area, setArea] = useState('');
  const [phone, setPhone] = useState('');
  const [consent1, setConsent1] = useState(false);
  const [consent2, setConsent2] = useState(false);
  const [consent3, setConsent3] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent1 || !consent2 || !consent3) {
      alert('Please accept all consent items to proceed.');
      return;
    }
    setIsSuccess(true);
  };

  const handleReset = () => {
    setIsSuccess(false);
    setFullName('');
    setArea('');
    setPhone('');
    setConsent1(false);
    setConsent2(false);
    setConsent3(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="donor-modal-title"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-xs">
                <HeartHandshake className="w-6 h-6 text-rose-100" />
              </div>
              <div>
                <h3 id="donor-modal-title" className="text-xl font-bold tracking-tight">
                  {t.modals.donor.title}
                </h3>
                <p className="text-xs text-rose-100 mt-0.5">{t.modals.donor.subtitle}</p>
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
        <div className="bg-red-50 border-b border-red-200/80 px-6 py-3 flex items-start gap-3 text-xs text-red-900">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed font-medium">{t.modals.donor.prototypeNotice}</p>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {isSuccess ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold text-slate-800">
                Donor Registration Simulated Successfully
              </h4>
              <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed">
                {t.modals.donor.successMsg}
              </p>
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 text-left space-y-1">
                <p className="font-semibold">Simulated Record Summary:</p>
                <p>• Donor: {fullName || 'Demo Volunteer'}</p>
                <p>• Blood Group: {bloodGroup}</p>
                <p>• Location: {area || 'Local Area'}, {district}, {division}</p>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl shadow-md transition-colors text-sm"
              >
                {t.modals.auth.close}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    {t.modals.donor.fullName} *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t.modals.donor.fullNamePlaceholder}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    {t.modals.donor.bloodGroup} *
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-bold"
                  >
                    {BLOOD_GROUPS.map((grp) => (
                      <option key={grp} value={grp}>
                        {grp}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    {t.modals.donor.division} *
                  </label>
                  <select
                    value={division}
                    onChange={(e) => {
                      const div = e.target.value as BangladeshDivision;
                      setDivision(div);
                      setDistrict(div);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  >
                    {BANGLADESH_DIVISIONS.map((div) => (
                      <option key={div} value={div}>
                        {div}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    {t.modals.donor.district} *
                  </label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    {t.modals.donor.area} *
                  </label>
                  <input
                    type="text"
                    required
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder={t.modals.donor.areaPlaceholder}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t.modals.donor.phone} *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t.modals.donor.phonePlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                />
              </div>

              {/* Consent Box */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Voluntary Donor Charter & Consent</span>
                </div>

                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 leading-snug">
                  <input
                    type="checkbox"
                    required
                    checked={consent1}
                    onChange={(e) => setConsent1(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-red-600 focus:ring-red-500"
                  />
                  <span>{t.modals.donor.consent1}</span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 leading-snug">
                  <input
                    type="checkbox"
                    required
                    checked={consent2}
                    onChange={(e) => setConsent2(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-red-600 focus:ring-red-500"
                  />
                  <span>{t.modals.donor.consent2}</span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 leading-snug">
                  <input
                    type="checkbox"
                    required
                    checked={consent3}
                    onChange={(e) => setConsent3(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-red-600 focus:ring-red-500"
                  />
                  <span>{t.modals.donor.consent3}</span>
                </label>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-1/3 py-2.5 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-xl text-sm transition-colors"
                >
                  {t.modals.donor.cancelBtn}
                </button>
                <button
                  type="submit"
                  disabled={!consent1 || !consent2 || !consent3}
                  className="w-2/3 py-3 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-md shadow-red-500/20 text-sm transition-all"
                >
                  {t.modals.donor.submitBtn}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
