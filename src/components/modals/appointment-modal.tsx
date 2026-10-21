'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/language-context';
import { Doctor } from '@/types';
import { X, Calendar, UserCheck, AlertCircle, CheckCircle2, Clock, MapPin } from 'lucide-react';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: Doctor | null;
}

export function AppointmentModal({ isOpen, onClose, doctor }: AppointmentModalProps) {
  const { language, t } = useLanguage();
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [date, setDate] = useState('');
  const [shift, setShift] = useState('Evening');
  const [symptom, setSymptom] = useState('');
  const [isBooked, setIsBooked] = useState(false);

  if (!isOpen || !doctor) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsBooked(true);
  };

  const handleReset = () => {
    setIsBooked(false);
    setPatientName('');
    setPatientPhone('');
    setDate('');
    setSymptom('');
    onClose();
  };

  const doctorName = language === 'bn' ? doctor.nameBn : doctor.nameEn;
  const doctorSpecialty = language === 'bn' ? doctor.specialtyBn : doctor.specialtyEn;
  const chamber = language === 'bn' ? doctor.chamberBn : doctor.chamberEn;
  const hours = language === 'bn' ? doctor.visitingHoursBn : doctor.visitingHoursEn;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="appointment-modal-title"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-sky-600 to-teal-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-xs">
                <Calendar className="w-6 h-6 text-sky-100" />
              </div>
              <div>
                <h3 id="appointment-modal-title" className="text-xl font-bold tracking-tight">
                  {t.modals.appointment.title}
                </h3>
                <p className="text-xs text-sky-100 mt-0.5">{t.modals.appointment.subtitle}</p>
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
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="font-medium leading-relaxed">{t.modals.appointment.prototypeNotice}</p>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* Doctor Brief Card */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 mb-5">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-base">{doctorName}</h4>
                <p className="text-xs font-semibold text-blue-600 mt-0.5">{doctorSpecialty}</p>
              </div>
              <span className="px-2 py-0.5 text-[11px] font-bold bg-blue-100 text-blue-700 rounded-md">
                {t.doctors.demoBadge}
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{chamber}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{hours}</span>
              </div>
            </div>
          </div>

          {isBooked ? (
            <div className="py-4 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-slate-800">
                Chamber Appointment Demo Confirmed
              </h4>
              <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed">
                {t.modals.appointment.successMsg}
              </p>
              <div className="p-3 bg-blue-50 text-blue-900 rounded-xl text-xs text-left space-y-1">
                <p className="font-bold">Summary (Demo):</p>
                <p>• Patient: {patientName || 'Demo Patient'}</p>
                <p>• Date: {date || 'Tomorrow'}</p>
                <p>• Doctor: {doctorName}</p>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-sm transition-colors text-sm"
              >
                {t.modals.appointment.cancelBtn}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t.modals.appointment.patientName} *
                </label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="e.g. Mohammad Asif"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t.modals.appointment.patientPhone} *
                </label>
                <input
                  type="tel"
                  required
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    {t.modals.appointment.preferredDate} *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    {t.modals.appointment.preferredShift}
                  </label>
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                  >
                    <option value="Evening">Evening Chamber (৫:০০ - ৯:০০ PM)</option>
                    <option value="Morning">Morning Chamber (১০:০০ - ১:০০ PM)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t.modals.appointment.symptomBrief}
                </label>
                <textarea
                  rows={2}
                  value={symptom}
                  onChange={(e) => setSymptom(e.target.value)}
                  placeholder="e.g. Fever for 3 days, joint pain, needing consultation..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-1/3 py-2.5 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-xl text-sm transition-colors"
                >
                  {t.modals.appointment.cancelBtn}
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md shadow-blue-500/20 text-sm transition-all flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  {t.modals.appointment.confirmBtn}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
