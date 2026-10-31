'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/language-context';
import { BloodGroup, BangladeshDivision } from '@/types';
import { BANGLADESH_DIVISIONS, DIVISION_NAMES_BN } from '@/data/sample-data';
import { api, ApiError, BloodRequestPublicResponse } from '@/lib/api-client';
import { X, Droplets, CheckCircle2, AlertCircle, Loader2, Hospital, Calendar, ShieldAlert } from 'lucide-react';

interface BloodRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGroup?: BloodGroup;
  onRequestCreated?: (request: BloodRequestPublicResponse) => void;
}

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export function BloodRequestModal({
  isOpen,
  onClose,
  selectedGroup = 'O+',
  onRequestCreated,
}: BloodRequestModalProps) {
  const { language } = useLanguage();
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>(selectedGroup);
  const [unitsRequired, setUnitsRequired] = useState(1);
  const [hospitalName, setHospitalName] = useState('');
  const [division, setDivision] = useState<BangladeshDivision>('Dhaka');
  const [district, setDistrict] = useState('Dhaka');
  const [upazila, setUpazila] = useState('');
  const [requiredDate, setRequiredDate] = useState('');
  const [medicalReason, setMedicalReason] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdRequest, setCreatedRequest] = useState<BloodRequestPublicResponse | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Phone validation
    const cleanPhone = contactPhone.replace(/[\s-]/g, '');
    const bdPhoneRegex = /^(?:\+?880|0)?1[3-9]\d{8}$/;
    if (!bdPhoneRegex.test(cleanPhone)) {
      setErrorMessage(
        language === 'bn'
          ? 'অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 01700000000)।'
          : 'Please enter a valid 11-digit Bangladeshi mobile number (e.g. 01700000000).'
      );
      return;
    }

    // Required by date validation
    if (!requiredDate) {
      setErrorMessage(
        language === 'bn'
          ? 'অনুগ্রহ করে কখন রক্ত প্রয়োজন তা নির্ধারণ করুন।'
          : 'Please specify the date and time when blood is required.'
      );
      return;
    }

    const reqDateTime = new Date(requiredDate);
    if (isNaN(reqDateTime.getTime()) || reqDateTime <= new Date()) {
      setErrorMessage(
        language === 'bn'
          ? 'রক্তের প্রয়োজন হওয়ার সময় ভবিষ্যতের কোনো সময় হতে হবে।'
          : 'Required-by date and time must be set in the future.'
      );
      return;
    }

    if (unitsRequired < 1 || unitsRequired > 20) {
      setErrorMessage(
        language === 'bn'
          ? 'রক্তের পরিমাণ ১ থেকে ২০ ব্যাগের মধ্যে হতে হবে।'
          : 'Required units must be between 1 and 20 bags.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.bloodRequests.create({
        blood_group: bloodGroup,
        division,
        district: district.trim(),
        upazila: upazila.trim() || district.trim(),
        units_required: unitsRequired,
        required_by: reqDateTime.toISOString(),
        hospital_name: hospitalName.trim(),
        medical_reason: medicalReason.trim() || undefined,
        additional_notes: additionalNotes.trim() || undefined,
        contact_name: contactName.trim(),
        contact_phone: cleanPhone,
      });

      setCreatedRequest(response);
      setIsSuccess(true);
      if (onRequestCreated) {
        onRequestCreated(response);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(
          language === 'bn'
            ? 'সার্ভারে আবেদন জমা দিতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
            : 'Failed to submit blood request. Please check your connection and try again.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSuccess(false);
    setCreatedRequest(null);
    setErrorMessage('');
    setHospitalName('');
    setUpazila('');
    setMedicalReason('');
    setAdditionalNotes('');
    setContactName('');
    setContactPhone('');
    setUnitsRequired(1);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="blood-request-modal-title"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-xs">
                <Droplets className="w-6 h-6 text-rose-100 fill-rose-100" />
              </div>
              <div>
                <h3 id="blood-request-modal-title" className="text-xl font-bold tracking-tight">
                  {language === 'bn' ? 'জরুরি রক্তের আবেদন' : 'Post Emergency Blood Request'}
                </h3>
                <p className="text-xs text-rose-100 mt-0.5">
                  {language === 'bn'
                    ? 'হাসপাতালে জরুরি রক্তের জন্য স্বেচ্ছাসেবী রক্তদাতাদের সহায়তা চান'
                    : 'Request voluntary donors for patients in hospitals'}
                </p>
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

        {/* Notice */}
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center gap-2.5 text-xs text-amber-900">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            {language === 'bn'
              ? 'রক্ত বিক্রি বা কেনাবেচা সম্পূর্ণ বেআইনি। এই প্ল্যাটফর্ম সম্পূর্ণ বিনামূল্যে স্বেচ্ছাসেবী উদ্যোগ।'
              : 'Commercial trade of blood is illegal. ShasthoBondhu is strictly a voluntary assistance network.'}
          </span>
        </div>

        {/* Content */}
        <div className="p-6">
          {isSuccess ? (
            <div className="py-4 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold text-slate-800">
                {language === 'bn' ? 'রক্তের আবেদন সফলভাবে পোস্ট হয়েছে' : 'Blood Request Posted Successfully'}
              </h4>
              <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed">
                {language === 'bn'
                  ? 'আপনার রক্তের আবেদনটি সার্বজনীন তালিকায় যুক্ত হয়েছে। রক্তদাতারা যোগাযোগ করার সময় সুরক্ষার স্বার্থে যোগাযোগ নম্বরটি যাচাই করা হবে।'
                  : 'Your request has been published. For safety and privacy, donor inquiries require confirmation.'}
              </p>
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 text-left space-y-1.5">
                <p className="font-bold text-emerald-950">
                  {language === 'bn' ? 'আবেদন বিবরণ:' : 'Request Summary:'}
                </p>
                <p>• Blood Needed: <span className="font-black text-rose-600">{createdRequest?.blood_group}</span> ({createdRequest?.units_required} Bag)</p>
                <p>• Hospital: {createdRequest?.hospital_name}</p>
                <p>• Location: {createdRequest?.upazila}, {createdRequest?.district}, {createdRequest?.division}</p>
                <p>• Status: <span className="uppercase font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">{createdRequest?.request_status}</span></p>
                <p>• Contact (Masked): <span className="font-mono font-bold">{createdRequest?.contact_phone_masked}</span></p>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl text-sm transition-colors cursor-pointer"
              >
                {language === 'bn' ? 'ঠিক আছে (বন্ধ করুন)' : 'Done (Close)'}
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
                    {language === 'bn' ? 'প্রয়োজনীয় রক্তের গ্রুপ *' : 'Blood Group Needed *'}
                  </label>
                  <select
                    value={bloodGroup}
                    disabled={isSubmitting}
                    onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 bg-white font-black text-base focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-slate-100"
                  >
                    {BLOOD_GROUPS.map((grp) => (
                      <option key={grp} value={grp}>
                        {grp}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    {language === 'bn' ? 'রক্তের পরিমাণ (ব্যাগ) *' : 'Units Required (Bags) *'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    required
                    disabled={isSubmitting}
                    value={unitsRequired}
                    onChange={(e) => setUnitsRequired(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-red-500 text-sm disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Hospital className="w-3.5 h-3.5 text-slate-500" />
                  <span>{language === 'bn' ? 'হাসপাতাল / ক্লিনিকের নাম *' : 'Hospital / Clinic Name *'}</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={isSubmitting}
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  placeholder={language === 'bn' ? 'যেমন: ঢাকা মেডিকেল কলেজ হাসপাতাল' : 'e.g. Dhaka Medical College Hospital'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm disabled:bg-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    {language === 'bn' ? 'বিভাগ *' : 'Division *'}
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
                    {language === 'bn' ? 'জেলা *' : 'District *'}
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
                    {language === 'bn' ? 'উপজেলা / থানা *' : 'Upazila / Thana *'}
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isSubmitting}
                    value={upazila}
                    onChange={(e) => setUpazila(e.target.value)}
                    placeholder={language === 'bn' ? 'যেমন: ধানমন্ডি' : 'e.g. Dhanmondi'}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{language === 'bn' ? 'কখন প্রয়োজন (তারিখ ও সময়) *' : 'Required By (Date & Time) *'}</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    disabled={isSubmitting}
                    value={requiredDate}
                    onChange={(e) => setRequiredDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    {language === 'bn' ? 'রোগের কারণ / ক্ষেত্র' : 'Medical Reason'}
                  </label>
                  <input
                    type="text"
                    disabled={isSubmitting}
                    value={medicalReason}
                    onChange={(e) => setMedicalReason(e.target.value)}
                    placeholder={language === 'bn' ? 'যেমন: সার্জারি / ডেঙ্গু প্লাটিলেট' : 'e.g. Surgery / Dengue Platelets'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    {language === 'bn' ? 'যোগাযোগকারীর নাম *' : 'Contact Person Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isSubmitting}
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder={language === 'bn' ? 'যেমন: রোগীর আত্মীয়' : 'e.g. Patient Relative'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    {language === 'bn' ? 'জরুরি মোবাইল নম্বর *' : 'Contact Phone *'}
                  </label>
                  <input
                    type="tel"
                    required
                    disabled={isSubmitting}
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="01700000000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  {language === 'bn' ? 'অতিরিক্ত নির্দেশনা (ঐচ্ছিক)' : 'Additional Notes (Optional)'}
                </label>
                <textarea
                  rows={2}
                  disabled={isSubmitting}
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder={language === 'bn' ? 'যেমন: রোগী কেবিন নম্বর ও রক্তের ব্যাগ প্রস্তুতের জন্য বিশেষ নির্দেশনা' : 'e.g. Ward/Cabin number or specific medical notes'}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm disabled:bg-slate-100"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleReset}
                  className="w-1/3 py-2.5 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-xl text-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 py-3 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-md shadow-red-500/20 text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{language === 'bn' ? 'জমা হচ্ছে...' : 'Submitting...'}</span>
                    </>
                  ) : (
                    <span>{language === 'bn' ? 'আবেদন প্রকাশ করুন' : 'Post Blood Request'}</span>
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
