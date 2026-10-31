'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/language-context';
import { BloodDonor, BloodGroup, BangladeshDivision } from '@/types';
import { SAMPLE_DONORS, BANGLADESH_DIVISIONS, DIVISION_NAMES_BN } from '@/data/sample-data';
import { api, DonorPublicResponse, BloodRequestPublicResponse } from '@/lib/api-client';
import {
  Droplets,
  Search,
  ShieldCheck,
  Heart,
  Phone,
  UserCheck,
  AlertCircle,
  Clock,
  RotateCcw,
  Hospital,
  Calendar,
  Loader2,
  CheckCircle,
  PlusCircle,
} from 'lucide-react';

interface BloodDonationProps {
  initialGroup?: BloodGroup | null;
  initialDivision?: string;
  initialSearch?: string;
  onOpenDonorRegister: (group?: BloodGroup) => void;
  onOpenBloodRequest: (group?: BloodGroup) => void;
  onRequestBloodInfo?: () => void;
  refreshTrigger?: number;
}

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export function BloodDonation({
  initialGroup = null,
  initialDivision = 'All',
  initialSearch = '',
  onOpenDonorRegister,
  onOpenBloodRequest,
  refreshTrigger = 0,
}: BloodDonationProps) {
  const { language, t } = useLanguage();

  // Active sub-tab: 'donors' or 'requests'
  const [activeTab, setActiveTab] = useState<'donors' | 'requests'>('donors');

  const isSearchGroup = initialSearch && BLOOD_GROUPS.includes(initialSearch.trim().toUpperCase() as BloodGroup);
  const [selectedGroup, setSelectedGroup] = useState<BloodGroup | 'All'>(
    initialGroup || (isSearchGroup ? (initialSearch.trim().toUpperCase() as BloodGroup) : 'All')
  );
  const [selectedDivision, setSelectedDivision] = useState<string>(initialDivision);
  const [areaSearch, setAreaSearch] = useState(isSearchGroup ? '' : initialSearch);

  // Live API States for Donors
  const [liveDonors, setLiveDonors] = useState<DonorPublicResponse[]>([]);
  const [isLoadingDonors, setIsLoadingDonors] = useState<boolean>(true);
  const [donorError, setDonorError] = useState<string | null>(null);

  // Live API States for Blood Requests
  const [liveRequests, setLiveRequests] = useState<BloodRequestPublicResponse[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState<boolean>(true);
  const [requestsError, setRequestsError] = useState<string | null>(null);

  // Contact Modal
  const [contactRequestModal, setContactRequestModal] = useState<BloodDonor | null>(null);
  const [selectedRequestModal, setSelectedRequestModal] = useState<BloodRequestPublicResponse | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // 1. Fetch live donors from API
  useEffect(() => {
    let isSubscribed = true;
    async function loadDonors() {
      try {
        const data = await api.donors.list({
          blood_group: selectedGroup !== 'All' ? selectedGroup : undefined,
          division: selectedDivision !== 'All' ? selectedDivision : undefined,
          upazila: areaSearch.trim() || undefined,
          is_available: true,
        });
        if (isSubscribed) {
          setLiveDonors(data);
          setDonorError(null);
          setIsLoadingDonors(false);
        }
      } catch {
        if (isSubscribed) {
          setDonorError(
            language === 'bn'
              ? 'সার্ভার থেকে রক্তদাতাদের তালিকা লোড করা সম্ভব হয়নি।'
              : 'Unable to load live donors from server.'
          );
          setIsLoadingDonors(false);
        }
      }
    }
    loadDonors();
    return () => {
      isSubscribed = false;
    };
  }, [selectedGroup, selectedDivision, areaSearch, language, refreshTrigger, retryCount]);

  // 2. Fetch live blood requests from API
  useEffect(() => {
    let isSubscribed = true;
    async function loadRequests() {
      try {
        const data = await api.bloodRequests.list({
          blood_group: selectedGroup !== 'All' ? selectedGroup : undefined,
          division: selectedDivision !== 'All' ? selectedDivision : undefined,
          upazila: areaSearch.trim() || undefined,
          request_status: 'all',
        });
        if (isSubscribed) {
          setLiveRequests(data);
          setRequestsError(null);
          setIsLoadingRequests(false);
        }
      } catch {
        if (isSubscribed) {
          setRequestsError(
            language === 'bn'
              ? 'সার্ভার থেকে রক্তের আবেদন লোড করা সম্ভব হয়নি।'
              : 'Unable to load blood requests from server.'
          );
          setIsLoadingRequests(false);
        }
      }
    }
    loadRequests();
    return () => {
      isSubscribed = false;
    };
  }, [selectedGroup, selectedDivision, areaSearch, language, refreshTrigger, retryCount]);

  // Sample data fallback filter
  const filteredSampleDonors = SAMPLE_DONORS.filter((donor) => {
    if (selectedGroup !== 'All' && donor.bloodGroup !== selectedGroup) return false;
    if (selectedDivision !== 'All' && donor.division !== selectedDivision) return false;
    if (areaSearch.trim()) {
      const q = areaSearch.toLowerCase();
      const matchArea = donor.area.toLowerCase().includes(q);
      const matchDistrict = donor.district.toLowerCase().includes(q);
      if (!matchArea && !matchDistrict) return false;
    }
    return true;
  });

  const handleResetFilters = () => {
    setSelectedGroup('All');
    setSelectedDivision('All');
    setAreaSearch('');
  };

  return (
    <section id="blood" className="py-16 bg-gradient-to-b from-slate-50 to-rose-50/30 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold mb-3">
              <Droplets className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
              <span>{language === 'bn' ? 'জীবন রক্ষাকারী উদ্যোগ' : 'Life-Saving Initiative'}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {t.blood.title}
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl">
              {t.blood.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onOpenDonorRegister(selectedGroup === 'All' ? 'O+' : selectedGroup)}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-rose-600/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Heart className="w-4 h-4 fill-white" />
              <span>{t.blood.registerBtn}</span>
            </button>

            <button
              onClick={() => onOpenBloodRequest(selectedGroup === 'All' ? 'O+' : selectedGroup)}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-colors flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-rose-400" />
              <span>{language === 'bn' ? 'জরুরি রক্তের আবেদন' : 'Post Blood Request'}</span>
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 mb-6 pb-2">
          <button
            onClick={() => setActiveTab('donors')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'donors'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>{language === 'bn' ? 'রক্তদাতা খুঁজুন' : 'Find Blood Donors'}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'donors' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {liveDonors.length + filteredSampleDonors.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'requests'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Droplets className="w-4 h-4 text-rose-400 fill-rose-400" />
            <span>{language === 'bn' ? 'জরুরি রক্তের আবেদন' : 'Emergency Blood Requests'}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'requests' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {liveRequests.length}
            </span>
          </button>
        </div>

        {/* Privacy & Consent Protection Banner */}
        <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center gap-3.5 shadow-2xs">
          <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-xs sm:text-sm space-y-0.5">
            <p className="font-bold text-amber-900">{t.blood.privacyBannerTitle}</p>
            <p className="text-amber-800 leading-relaxed">{t.blood.privacyBannerText}</p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-sm mb-8 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {t.blood.selectGroup}
              </span>
              {selectedGroup !== 'All' && (
                <button
                  onClick={() => setSelectedGroup('All')}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
                >
                  Clear Group
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedGroup('All')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedGroup === 'All'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {t.blood.allGroups}
              </button>
              {BLOOD_GROUPS.map((grp) => (
                <button
                  key={grp}
                  onClick={() => setSelectedGroup(grp)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedGroup === grp
                      ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-500/20'
                      : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200/60'
                  }`}
                >
                  {grp}
                </button>
              ))}
            </div>
          </div>

          {/* Division and Search Query */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {language === 'bn' ? 'বিভাগ নির্বাচন করুন' : 'Filter by Division'}
              </label>
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="All">{language === 'bn' ? 'সকল বিভাগ' : 'All Divisions'}</option>
                {BANGLADESH_DIVISIONS.map((div) => (
                  <option key={div} value={div}>
                    {language === 'bn' ? DIVISION_NAMES_BN[div] : div}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {language === 'bn' ? 'থানা বা এলাকা খুঁজুন' : 'Search Upazila or Area'}
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={areaSearch}
                  onChange={(e) => setAreaSearch(e.target.value)}
                  placeholder={language === 'bn' ? 'যেমন: ধানমন্ডি, মিরপুর...' : 'e.g. Dhanmondi, Mirpur...'}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* TAB 1: DONORS LIST */}
        {activeTab === 'donors' && (
          <div>
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2">
                <p className="text-xs sm:text-sm font-semibold text-slate-600">
                  <span className="font-black text-slate-900">
                    {liveDonors.length + filteredSampleDonors.length}
                  </span>{' '}
                  {t.blood.donorsFound}
                </p>
                {liveDonors.length > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {liveDonors.length} Live Registered
                  </span>
                )}
              </div>

              {(selectedGroup !== 'All' || selectedDivision !== 'All' || areaSearch) && (
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>

            {isLoadingDonors && (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin text-rose-600" />
                <span className="text-xs font-semibold">
                  {language === 'bn' ? 'রক্তদাতাদের তথ্য লোড হচ্ছে...' : 'Loading donor directory...'}
                </span>
              </div>
            )}

            {donorError && (
              <div className="p-4 mb-6 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{donorError}</span>
                </div>
                <button
                  onClick={() => {
                    setIsLoadingDonors(true);
                    setRetryCount((c) => c + 1);
                  }}
                  className="px-3 py-1 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            {!isLoadingDonors && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* 1. Live Backend Registered Donors */}
                {liveDonors.map((donor) => (
                  <div
                    key={donor.id}
                    className="bg-white rounded-2xl border-2 border-emerald-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black text-lg flex items-center justify-center shadow-xs">
                            {donor.blood_group}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                              <span>{donor.name}</span>
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 inline shrink-0" />
                            </h4>
                            <p className="text-xs text-slate-500 font-medium">
                              {donor.upazila || donor.area}, {donor.district}
                            </p>
                          </div>
                        </div>

                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                          {language === 'bn' ? 'নিবন্ধিত রক্তদাতা' : 'Registered Donor'}
                        </span>
                      </div>

                      <div className="py-2.5 px-3 bg-emerald-50/50 rounded-xl space-y-1.5 text-xs text-slate-600 border border-emerald-100 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <Heart className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{language === 'bn' ? 'মোট রক্তদান:' : 'Total Donations:'}</span>
                          </span>
                          <span className="font-bold text-slate-800">
                            {donor.total_donations} {t.blood.donations}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Status:</span>
                          </span>
                          <span className="font-bold text-emerald-700">
                            {donor.is_available ? t.blood.availableNow : 'Unavailable'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-emerald-200/60">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>Contact:</span>
                          </span>
                          <span className="font-mono font-semibold text-slate-800 tracking-wider">
                            {donor.phone_masked}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        setContactRequestModal({
                          id: donor.id,
                          name: donor.name,
                          bloodGroup: donor.blood_group,
                          division: donor.division as BangladeshDivision,
                          district: donor.district,
                          area: donor.upazila || donor.district,
                          phoneMasked: donor.phone_masked,
                          lastDonation: donor.last_donation_date || 'Recently Registered',
                          donationCount: donor.total_donations,
                          available: donor.is_available,
                          isDemo: false,
                        })
                      }
                      className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>{t.blood.requestContact}</span>
                    </button>
                  </div>
                ))}

                {/* 2. Sample/Demo Donors */}
                {filteredSampleDonors.map((donor) => (
                  <div
                    key={donor.id}
                    className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white font-black text-lg flex items-center justify-center shadow-xs">
                            {donor.bloodGroup}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">{donor.name}</h4>
                            <p className="text-xs text-slate-500 font-medium">
                              {donor.area}, {donor.district}
                            </p>
                          </div>
                        </div>

                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                          {t.blood.sampleBadge}
                        </span>
                      </div>

                      <div className="py-2.5 px-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600 border border-slate-100 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <Heart className="w-3.5 h-3.5 text-rose-500" />
                            <span>{language === 'bn' ? 'মোট রক্তদান:' : 'Total Donations:'}</span>
                          </span>
                          <span className="font-bold text-slate-800">
                            {donor.donationCount} {t.blood.donations}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{t.blood.lastDonated}:</span>
                          </span>
                          <span className="font-medium text-slate-700">{donor.lastDonation}</span>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>Contact:</span>
                          </span>
                          <span className="font-mono font-semibold text-slate-800 tracking-wider">
                            {donor.phoneMasked}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setContactRequestModal(donor)}
                      className="w-full py-2.5 px-4 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>{t.blood.requestContact}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!isLoadingDonors && liveDonors.length === 0 && filteredSampleDonors.length === 0 && (
              <div className="p-10 bg-white rounded-2xl border border-dashed border-slate-300 text-center space-y-3">
                <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                  <Droplets className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-800 text-base">
                  {language === 'bn' ? 'কোনো রক্তদাতা মেলেনি' : 'No Donors Found'}
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">{t.blood.noDonors}</p>
                <button
                  onClick={handleResetFilters}
                  className="mt-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: EMERGENCY BLOOD REQUESTS LIST */}
        {activeTab === 'requests' && (
          <div>
            <div className="flex items-center justify-between mb-4 px-1">
              <p className="text-xs sm:text-sm font-semibold text-slate-600">
                <span className="font-black text-slate-900">{liveRequests.length}</span>{' '}
                {language === 'bn' ? 'জরুরি রক্তের আবেদন পাওয়া গেছে' : 'Emergency Requests Listed'}
              </p>

              <button
                onClick={() => onOpenBloodRequest(selectedGroup !== 'All' ? selectedGroup : 'O+')}
                className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'নতুন আবেদন করুন' : 'Post New Request'}</span>
              </button>
            </div>

            {isLoadingRequests && (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin text-rose-600" />
                <span className="text-xs font-semibold">
                  {language === 'bn' ? 'রক্তের আবেদন লোড হচ্ছে...' : 'Loading blood requests...'}
                </span>
              </div>
            )}

            {requestsError && (
              <div className="p-4 mb-6 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{requestsError}</span>
                </div>
                <button
                  onClick={() => {
                    setIsLoadingRequests(true);
                    setRetryCount((c) => c + 1);
                  }}
                  className="px-3 py-1 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            {!isLoadingRequests && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {liveRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Bar of Request */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 text-white font-black text-xl flex items-center justify-center shadow-xs">
                            {req.blood_group}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-900 text-sm">{req.units_required} Bag Needed</h4>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                  req.request_status === 'pending'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                }`}
                              >
                                {req.request_status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium">
                              {req.upazila}, {req.district}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Request Details */}
                      <div className="py-2.5 px-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600 border border-slate-100 mb-4">
                        <div className="flex items-center gap-2 text-slate-700">
                          <Hospital className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-semibold truncate">{req.hospital_name}</span>
                        </div>

                        {req.medical_reason && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <span className="font-bold text-slate-500">Reason:</span>
                            <span className="truncate">{req.medical_reason}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            Needed By: <strong className="text-slate-800">{new Date(req.required_by).toLocaleDateString()}</strong>
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>Contact:</span>
                          </span>
                          <span className="font-mono font-semibold text-slate-800 tracking-wider">
                            {req.contact_phone_masked}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedRequestModal(req)}
                      className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Droplets className="w-3.5 h-3.5 fill-white" />
                      <span>{language === 'bn' ? 'রক্তদানের ইচ্ছা জানান' : 'Respond to Request'}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!isLoadingRequests && liveRequests.length === 0 && (
              <div className="p-10 bg-white rounded-2xl border border-dashed border-slate-300 text-center space-y-3">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                  <Droplets className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-800 text-base">
                  {language === 'bn' ? 'বর্তমানে কোনো জরুরি রক্তের আবেদন নেই' : 'No Active Blood Requests'}
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  {language === 'bn'
                    ? 'আপনার হাসপাতালে রক্তের প্রয়োজন হলে আপনি বিনামূল্যে জরুরি আবেদন পোস্ট করতে পারেন।'
                    : 'If a patient needs blood in a hospital, you can post an emergency request for voluntary donors.'}
                </p>
                <button
                  onClick={() => onOpenBloodRequest('O+')}
                  className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  {language === 'bn' ? 'জরুরি রক্তের আবেদন করুন' : 'Post Blood Request'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Modal: Contact Donor Protection Info */}
        {contactRequestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold">
                    {contactRequestModal.bloodGroup}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      {contactRequestModal.name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {contactRequestModal.area}, {contactRequestModal.division}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setContactRequestModal(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-2">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Privacy Protection Notice</span>
                </p>
                <p>
                  In compliance with Bangladesh voluntary donor safety guidelines, contact numbers are protected
                  ({contactRequestModal.phoneMasked}). Direct phone connections will be facilitated through double-consent verification.
                </p>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => setContactRequestModal(null)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer"
                >
                  Understood (Close)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Blood Request Response Info */}
        {selectedRequestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold">
                    {selectedRequestModal.blood_group}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      {selectedRequestModal.hospital_name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {selectedRequestModal.upazila}, {selectedRequestModal.district}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRequestModal(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 space-y-2">
                <p className="font-bold text-slate-900">Requester Contact Details:</p>
                <p>• Contact Name: {selectedRequestModal.contact_name}</p>
                <p>• Masked Phone: <span className="font-mono font-bold">{selectedRequestModal.contact_phone_masked}</span></p>
                <p>• Units Needed: {selectedRequestModal.units_required} Bag(s)</p>
                <p>• Required By: {new Date(selectedRequestModal.required_by).toLocaleString()}</p>
              </div>

              <p className="text-[11px] text-slate-500">
                {language === 'bn'
                  ? 'রোগী ও রক্তদাতার সুরক্ষার স্বার্থে মধ্যস্থতাকারীদের কোনো অর্থ প্রদান করবেন না।'
                  : 'For safety, never transfer money or pay middlemen for blood donation.'}
              </p>

              <div className="pt-2">
                <button
                  onClick={() => setSelectedRequestModal(null)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
