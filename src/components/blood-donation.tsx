'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/language-context';
import { BloodDonor, BloodGroup } from '@/types';
import { SAMPLE_DONORS, BANGLADESH_DIVISIONS } from '@/data/sample-data';
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
} from 'lucide-react';

interface BloodDonationProps {
  initialGroup?: BloodGroup | null;
  onOpenDonorRegister: (group?: BloodGroup) => void;
  onRequestBloodInfo: () => void;
}

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export function BloodDonation({
  initialGroup = null,
  onOpenDonorRegister,
  onRequestBloodInfo,
}: BloodDonationProps) {
  const { language, t } = useLanguage();
  const [selectedGroup, setSelectedGroup] = useState<BloodGroup | 'All'>(
    initialGroup || 'All'
  );
  const [selectedDivision, setSelectedDivision] = useState<string>('All');
  const [areaSearch, setAreaSearch] = useState('');
  const [contactRequestModal, setContactRequestModal] = useState<BloodDonor | null>(null);

  // Filter logic
  const filteredDonors = SAMPLE_DONORS.filter((donor) => {
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
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
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
              onClick={onRequestBloodInfo}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
            >
              <span>{t.blood.requestBtn}</span>
            </button>
          </div>
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

        {/* Blood Group Selection Filter Pills */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-sm mb-8 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {t.blood.selectGroup}
              </span>
              {selectedGroup !== 'All' && (
                <button
                  onClick={() => setSelectedGroup('All')}
                  className="text-xs text-rose-600 font-semibold hover:underline"
                >
                  Show All ({SAMPLE_DONORS.length})
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedGroup('All')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  selectedGroup === 'All'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {t.blood.allGroups}
              </button>

              {BLOOD_GROUPS.map((grp) => {
                const isSelected = selectedGroup === grp;
                return (
                  <button
                    key={grp}
                    onClick={() => setSelectedGroup(grp)}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold tracking-tight transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-600 ring-offset-2'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-100'
                    }`}
                  >
                    {grp}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location Filters */}
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Division */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                {t.blood.filterDivision}
              </label>
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
              >
                <option value="All">{t.hero.allDivisions}</option>
                {BANGLADESH_DIVISIONS.map((div) => (
                  <option key={div} value={div}>
                    {div}
                  </option>
                ))}
              </select>
            </div>

            {/* Area / District Search */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                {language === 'bn' ? 'এলাকা বা জেলা অনুসন্ধান:' : 'Search by Area or District:'}
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={areaSearch}
                  onChange={(e) => setAreaSearch(e.target.value)}
                  placeholder={t.blood.searchAreaPlaceholder}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Donors List Header */}
        <div className="flex items-center justify-between mb-4 px-1">
          <p className="text-xs sm:text-sm font-semibold text-slate-600">
            <span className="font-black text-slate-900">{filteredDonors.length}</span>{' '}
            {t.blood.donorsFound}
          </p>
          {(selectedGroup !== 'All' || selectedDivision !== 'All' || areaSearch) && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Donor Cards Grid */}
        {filteredDonors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDonors.map((donor) => (
              <div
                key={donor.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar of card */}
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

                  {/* Donor Info Stats */}
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

                {/* Card Action */}
                <div>
                  <button
                    onClick={() => setContactRequestModal(donor)}
                    className="w-full py-2.5 px-4 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{t.blood.requestContact}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
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
              className="mt-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Demo Contact Request Modal */}
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
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
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
                  In compliance with donor safety regulations, this contact is simulated demo data
                  ({contactRequestModal.phoneMasked}). In the upcoming production release, donors
                  will receive an instant automated notification to approve incoming emergency calls.
                </p>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => setContactRequestModal(null)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs"
                >
                  Understood (Close)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
