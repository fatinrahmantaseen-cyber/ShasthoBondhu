'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/language-context';
import { BloodGroup, BangladeshDivision } from '@/types';
import { BANGLADESH_DIVISIONS, DIVISION_NAMES_BN } from '@/data/sample-data';
import { api, ApiError, DonorPublicResponse } from '@/lib/api-client';
import { X, HeartHandshake, ShieldCheck, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface DonorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGroup?: BloodGroup;
  onDonorRegistered?: (donor: DonorPublicResponse) => void;
}

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export function DonorModal({
  isOpen,
  onClose,
  selectedGroup = 'O+',
  onDonorRegistered,
}: DonorModalProps) {
  const { language, t } = useLanguage();
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>(selectedGroup);
  const [fullName, setFullName] = useState('');
  const [division, setDivision] = useState<BangladeshDivision>('Dhaka');
  const [district, setDistrict] = useState('Dhaka');
  const [area, setArea] = useState('');
  const [phone, setPhone] = useState('');
  const [consent1, setConsent1] = useState(false);
  const [consent2, setConsent2] = useState(false);
  const [consent3, setConsent3] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [registeredDonor, setRegisteredDonor] = useState<DonorPublicResponse | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Bangladeshi phone validation
    const cleanPhone = phone.replace(/[\s-]/g, '');
    const bdPhoneRegex = /^(?:\+?880|0)?1[3-9]\d{8}$/;
    if (!bdPhoneRegex.test(cleanPhone)) {
      setErrorMessage(
        language === 'bn'
          ? 'অনুগ্রহ করে একটি সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর প্রদান করুন (যেমন: 01700000000)।'
          : 'Please enter a valid 11-digit Bangladeshi mobile number (e.g. 01700000000).'
      );
      return;
    }

    if (!consent1 || !consent2 || !consent3) {
      setErrorMessage(
        language === 'bn'
          ? 'রক্তদাতা হিসেবে নিবন্ধনের জন্য অনুগ্রহ করে ৩টি সম্মতি শর্ত পূরণ করুন।'
          : 'Please accept all 3 voluntary consent declarations to proceed.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const trimmedArea = area.trim();
      const parts = trimmedArea.split(',');
      const deducedUpazila = parts[0].trim() || district.trim();
      const specificArea = parts.length > 1 ? parts.slice(1).join(',').trim() : trimmedArea;

      const response = await api.donors.create({
        name: fullName.trim(),
        blood_group: bloodGroup,
        division,
        district: district.trim(),
        upazila: deducedUpazila,
        area: specificArea || undefined,
        phone: cleanPhone,
        consent_given: true,
      });

      setRegisteredDonor(response);
      setIsSuccess(true);
      if (onDonorRegistered) {
        onDonorRegistered(response);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(
          language === 'bn'
            ? 'সার্ভারে সংযোগ করা সম্ভব হয়নি। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।'
            : 'Unable to connect to healthcare server. Please try again later.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSuccess(false);
    setRegisteredDonor(null);
    setErrorMessage('');
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
              className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Security & Privacy Banner */}
        <div className="bg-slate-50 border-b border-slate-200/80 px-6 py-3 flex items-start gap-3 text-xs text-slate-700">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed font-medium">
            {language === 'bn'
              ? 'নিরাপত্তা বার্তা: আপনার ফোন নম্বর ব্যাকএন্ডে স্বয়ংক্রিয়ভাবে এনক্রিপ্ট করে সংরক্ষণ করা হবে এবং সর্বসাধারণের কাছে শুধু মাস্ক করা ফরম্যাটে প্রদর্শিত হবে।'
              : 'Privacy Note: Your phone number is encrypted at rest and will only appear in masked format (+880 17**-***482) to the public.'}
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {isSuccess ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold text-slate-800">
                {language === 'bn'
                  ? 'রক্তদাতা হিসেবে সফলভাবে নিবন্ধিত হয়েছেন!'
                  : 'Donor Registered Successfully!'}
              </h4>
              <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed">
                {t.modals.donor.successMsg}
              </p>
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 text-left space-y-1">
                <p className="font-semibold">
                  {language === 'bn' ? 'নিবন্ধিত তথ্য সারসংক্ষেপ:' : 'Registration Record Summary:'}
                </p>
                <p>• Donor: {registeredDonor?.name || fullName}</p>
                <p>• Blood Group: {registeredDonor?.blood_group || bloodGroup}</p>
                <p>
                  • Location: {registeredDonor?.upazila || area}, {registeredDonor?.district || district},{' '}
                  {registeredDonor?.division || division}
                </p>
                <p>
                  • Contact (Protected):{' '}
                  <span className="font-mono font-bold text-slate-900">
                    {registeredDonor?.phone_masked}
                  </span>
                </p>
              </div>
              <p className="text-[11px] text-slate-500 italic">
                {language === 'bn'
                  ? '* দ্রষ্টব্য: এটি একটি স্বেচ্ছাসেবী নিবন্ধন। কোনো প্রকার রক্তের কেনাবেচা আইনত দণ্ডনীয়।'
                  : '* Note: This is a voluntary donor registry. Commercial trading of blood is strictly illegal.'}
              </p>
              <button
                type="button"
                onClick={handleReset}
                className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl shadow-md transition-colors text-sm cursor-pointer"
              >
                {t.modals.auth.close}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span className="font-medium">{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    {t.modals.donor.fullName} *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isSubmitting}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t.modals.donor.fullNamePlaceholder}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    {t.modals.donor.bloodGroup} *
                  </label>
                  <select
                    value={bloodGroup}
                    disabled={isSubmitting}
                    onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-bold disabled:bg-slate-100"
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
                    disabled={isSubmitting}
                    onChange={(e) => {
                      const div = e.target.value as BangladeshDivision;
                      setDivision(div);
                      setDistrict(div);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm disabled:bg-slate-100"
                  >
                    {BANGLADESH_DIVISIONS.map((div) => (
                      <option key={div} value={div}>
                        {language === 'bn' ? DIVISION_NAMES_BN[div] : div}
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
                    disabled={isSubmitting}
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    {t.modals.donor.area} *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isSubmitting}
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder={t.modals.donor.areaPlaceholder}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm disabled:bg-slate-100"
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
                  disabled={isSubmitting}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t.modals.donor.phonePlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm disabled:bg-slate-100"
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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
                  disabled={isSubmitting}
                  onClick={handleReset}
                  className="w-1/3 py-2.5 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-xl text-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {t.modals.donor.cancelBtn}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !consent1 || !consent2 || !consent3}
                  className="w-2/3 py-3 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-md shadow-red-500/20 text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{language === 'bn' ? 'নিবন্ধন হচ্ছে...' : 'Registering...'}</span>
                    </>
                  ) : (
                    <span>{t.modals.donor.submitBtn}</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
