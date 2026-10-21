'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/language-context';
import { Pharmacy } from '@/types';
import { SAMPLE_PHARMACIES, BANGLADESH_DIVISIONS, DIVISION_NAMES_BN } from '@/data/sample-data';
import {
  Pill,
  Search,
  MapPin,
  Clock,
  PhoneCall,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface PharmacyDirectoryProps {
  initialSearch?: string;
  initialDivision?: string;
}

export function PharmacyDirectory({
  initialSearch = '',
  initialDivision = 'All',
}: PharmacyDirectoryProps) {
  const { language, t } = useLanguage();
  const [search, setSearch] = useState(initialSearch);
  const [division, setDivision] = useState(initialDivision);
  const [only24Hours, setOnly24Hours] = useState(false);
  const [selectedPharmaModal, setSelectedPharmaModal] = useState<Pharmacy | null>(null);

  const filteredPharmacies = SAMPLE_PHARMACIES.filter((pharma) => {
    if (division !== 'All' && pharma.division !== division) return false;
    if (only24Hours && !pharma.isOpen24Hours) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchNameEn = pharma.nameEn.toLowerCase().includes(q);
      const matchNameBn = pharma.nameBn.toLowerCase().includes(q);
      const matchAddress = pharma.addressEn.toLowerCase().includes(q);
      const matchDistrict = pharma.districtEn.toLowerCase().includes(q);

      if (!matchNameEn && !matchNameBn && !matchAddress && !matchDistrict) {
        return false;
      }
    }
    return true;
  });

  const handleReset = () => {
    setSearch('');
    setDivision('All');
    setOnly24Hours(false);
  };

  return (
    <section id="pharmacies" className="py-16 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-3">
            <Pill className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'ওষুধ ও ফার্মেসি সন্ধান' : 'Dispensary & Medicine Stores'}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {t.pharmacy.title}
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
            {t.pharmacy.subtitle}
          </p>
        </div>

        {/* Mandatory Stock Notice Banner */}
        <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center gap-3.5 shadow-2xs">
          <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-700" />
          </div>
          <div className="text-xs sm:text-sm space-y-0.5">
            <p className="font-bold text-amber-900">{t.pharmacy.disclaimerTitle}</p>
            <p className="text-amber-800 leading-relaxed">{t.pharmacy.disclaimerText}</p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="p-4 sm:p-5 bg-slate-50/80 rounded-2xl border border-slate-200/80 mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Search Input */}
            <div className="md:col-span-2 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.pharmacy.searchPlaceholder}
                aria-label={t.pharmacy.searchPlaceholder}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Division */}
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <select
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                aria-label={t.hero.allDivisions}
                className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="All">{t.hero.allDivisions}</option>
                {BANGLADESH_DIVISIONS.map((div) => (
                  <option key={div} value={div}>
                    {language === 'bn' ? DIVISION_NAMES_BN[div] : div}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 24/7 Filter Toggle */}
          <div className="pt-2 border-t border-slate-200/60 flex items-center gap-3">
            <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={only24Hours}
                onChange={(e) => setOnly24Hours(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <span>{t.pharmacy.filter24Hours}</span>
            </label>
          </div>
        </div>

        {/* Results Count Header */}
        <div className="flex items-center justify-between mb-4 px-1">
          <p className="text-xs sm:text-sm font-semibold text-slate-600">
            <span className="font-bold text-slate-900">{filteredPharmacies.length}</span>{' '}
            {language === 'bn' ? 'টি ফার্মেসি তালিকাভুক্ত (নমুনা তথ্য)' : 'pharmacies listed (Demo Data)'}
          </p>
          {(search || division !== 'All' || only24Hours) && (
            <button
              onClick={handleReset}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Pharmacy Cards Grid */}
        {filteredPharmacies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPharmacies.map((pharma) => {
              const name = language === 'bn' ? pharma.nameBn : pharma.nameEn;
              const address = language === 'bn' ? pharma.addressBn : pharma.addressEn;
              const hours = language === 'bn' ? pharma.openingHoursBn : pharma.openingHoursEn;

              return (
                <div
                  key={pharma.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Badge & Timing */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      {pharma.isOpen24Hours ? (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                          <span>24/7 Emergency</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {t.pharmacy.standardHours}
                        </span>
                      )}

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                        {t.pharmacy.demoBadge}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug">
                      {name}
                    </h3>

                    <div className="mt-2 flex items-start gap-1.5 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{address}</span>
                    </div>

                    {/* Hours & Contact */}
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                      <div className="flex items-start gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-slate-800">Operating Hours:</p>
                          <p className="text-slate-500">{hours}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-slate-500">{t.pharmacy.contactInfo}</span>
                        <span className="font-mono font-semibold text-slate-800">
                          {pharma.phoneMasked}
                        </span>
                      </div>
                    </div>

                    {/* Services Tags */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {pharma.services.map((srv) => (
                        <span
                          key={srv}
                          className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-50/60 text-emerald-800 border border-emerald-100/60"
                        >
                          {srv}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Card Action */}
                  <div className="mt-5 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => setSelectedPharmaModal(pharma)}
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>{t.pharmacy.callPharmacy}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center space-y-3">
            <Pill className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="font-bold text-slate-800 text-base">
              {language === 'bn' ? 'কোনো ফার্মেসি খুঁজে পাওয়া যায়নি' : 'No Pharmacies Found'}
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">{t.pharmacy.noResults}</p>
            <button
              onClick={handleReset}
              className="mt-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs"
            >
              Reset Search
            </button>
          </div>
        )}

        {/* Demo Pharmacy Contact Modal */}
        {selectedPharmaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-base">
                    {language === 'bn' ? selectedPharmaModal.nameBn : selectedPharmaModal.nameEn}
                  </h4>
                  <p className="text-xs text-slate-500">{selectedPharmaModal.division} Division</p>
                </div>
                <button
                  onClick={() => setSelectedPharmaModal(null)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Prescription Medicine Verification</span>
                </p>
                <p>
                  This phone number is simulated demo data ({selectedPharmaModal.phoneMasked}). In
                  real scenarios, please bring a prescription stamped by a registered BMDC doctor
                  when collecting controlled prescription items.
                </p>
              </div>

              <button
                onClick={() => setSelectedPharmaModal(null)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs"
              >
                Close Window
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
