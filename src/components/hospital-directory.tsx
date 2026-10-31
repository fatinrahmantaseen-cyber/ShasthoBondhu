'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/language-context';
import { SAMPLE_HOSPITALS, BANGLADESH_DIVISIONS, DIVISION_NAMES_BN } from '@/data/sample-data';
import { api, HospitalResponse } from '@/lib/api-client';
import {
  Building2,
  Search,
  MapPin,
  PhoneCall,
  AlertCircle,
  RotateCcw,
  CheckCircle,
  Loader2,
} from 'lucide-react';

interface HospitalDirectoryProps {
  initialSearch?: string;
  initialDivision?: string;
}

interface DisplayHospital {
  id: string;
  nameEn: string;
  nameBn: string;
  division: string;
  districtEn: string;
  districtBn: string;
  addressEn: string;
  addressBn: string;
  contactEn: string;
  contactBn: string;
  type: string;
  services: string[];
  emergencyHotline?: string | null;
  bedStatusDemo: string;
  isDemo: boolean;
  verificationStatus: string;
}

export function HospitalDirectory({
  initialSearch = '',
  initialDivision = 'All',
}: HospitalDirectoryProps) {
  const { language, t } = useLanguage();
  const [search, setSearch] = useState(initialSearch);
  const [division, setDivision] = useState(initialDivision);
  const [selectedService, setSelectedService] = useState('All');
  const [selectedHospitalForModal, setSelectedHospitalForModal] = useState<DisplayHospital | null>(null);

  // Live API States
  const [liveHospitals, setLiveHospitals] = useState<HospitalResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Available service filter tags
  const serviceFilters = ['All', '24/7 Emergency', 'ICU', 'Dialysis Unit', 'CCU', 'NICU'];

  useEffect(() => {
    let isSubscribed = true;
    async function loadHospitals() {
      try {
        const data = await api.hospitals.list({
          division: division !== 'All' ? division : undefined,
          service: selectedService !== 'All' ? selectedService : undefined,
          search: search.trim() || undefined,
        });
        if (isSubscribed) {
          setLiveHospitals(data);
          setIsLoading(false);
        }
      } catch {
        if (isSubscribed) {
          setLiveHospitals([]);
          setIsLoading(false);
        }
      }
    }

    loadHospitals();
    return () => {
      isSubscribed = false;
    };
  }, [division, selectedService, search]);

  // Map live API records
  const liveDisplay: DisplayHospital[] = liveHospitals.map((h) => ({
    id: h.id,
    nameEn: h.name,
    nameBn: h.name_bn || h.name,
    division: h.division,
    districtEn: h.district,
    districtBn: h.district,
    addressEn: h.address,
    addressBn: h.address_bn || h.address,
    contactEn: h.public_contact,
    contactBn: h.public_contact,
    type: h.classification,
    services: h.available_services || [],
    emergencyHotline: h.emergency_hotline,
    bedStatusDemo: 'Call for Bed Info',
    isDemo: h.is_demo,
    verificationStatus: h.verification_status,
  }));

  // Filter sample demo data
  const demoDisplay: DisplayHospital[] = SAMPLE_HOSPITALS.filter((hosp) => {
    if (division !== 'All' && hosp.division !== division) return false;
    if (selectedService !== 'All' && !hosp.services.includes(selectedService)) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchNameEn = hosp.nameEn.toLowerCase().includes(q);
      const matchNameBn = hosp.nameBn.toLowerCase().includes(q);
      const matchDistrictEn = hosp.districtEn.toLowerCase().includes(q);
      const matchAddress = hosp.addressEn.toLowerCase().includes(q);
      const matchServices = hosp.services.some((s) => s.toLowerCase().includes(q));

      if (!matchNameEn && !matchNameBn && !matchDistrictEn && !matchAddress && !matchServices) {
        return false;
      }
    }
    return true;
  }).map((s) => ({
    id: s.id,
    nameEn: s.nameEn,
    nameBn: s.nameBn,
    division: s.division,
    districtEn: s.districtEn,
    districtBn: s.districtBn,
    addressEn: s.addressEn,
    addressBn: s.addressBn,
    contactEn: s.contactEn,
    contactBn: s.contactBn,
    type: s.type,
    services: s.services,
    emergencyHotline: s.emergencyHotline,
    bedStatusDemo: s.bedStatusDemo,
    isDemo: true,
    verificationStatus: 'unverified',
  }));

  // Combine live registered records first, followed by demo data
  const filteredHospitals: DisplayHospital[] = [...liveDisplay, ...demoDisplay];

  const handleReset = () => {
    setSearch('');
    setDivision('All');
    setSelectedService('All');
  };

  return (
    <section id="hospitals" className="py-16 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold mb-3">
            <Building2 className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'স্বাস্থ্য অবকাঠামো' : 'Healthcare Facilities'}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {t.hospitals.title}
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
            {t.hospitals.subtitle}
          </p>
        </div>

        {/* Demo Notice Alert */}
        <div className="mb-8 p-3.5 sm:p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 text-blue-900 text-xs sm:text-sm flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p>{t.hospitals.demoNotice}</p>
        </div>

        {/* Search & Filter Controls */}
        <div className="p-4 sm:p-5 bg-slate-50/80 rounded-2xl border border-slate-200/80 mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Search Input */}
            <div className="md:col-span-2 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.hospitals.searchPlaceholder}
                aria-label={t.hospitals.searchPlaceholder}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Division Filter */}
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <select
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                aria-label={t.hero.allDivisions}
                className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
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

          {/* Service Pills */}
          <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-600 mr-1">Services:</span>
            {serviceFilters.map((srv) => {
              const active = selectedService === srv;
              return (
                <button
                  key={srv}
                  onClick={() => setSelectedService(srv)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {srv === 'All' ? t.hospitals.filterAll : srv}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Count Header */}
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            <p className="text-xs sm:text-sm font-semibold text-slate-600">
              <span className="font-bold text-slate-900">{filteredHospitals.length}</span>{' '}
              {t.hospitals.foundCount}
              {liveHospitals.length > 0 && (
                <span className="ml-2 font-normal text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-xs border border-emerald-200">
                  {liveHospitals.length} {language === 'bn' ? 'যাচাইকৃত হাসপাতাল' : 'verified facilities'}
                </span>
              )}
            </p>
            {isLoading && <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />}
          </div>
          {(search || division !== 'All' || selectedService !== 'All') && (
            <button
              onClick={handleReset}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Hospital Cards Grid */}
        {filteredHospitals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHospitals.map((hospital) => {
              const name = language === 'bn' ? hospital.nameBn : hospital.nameEn;
              const address = language === 'bn' ? hospital.addressBn : hospital.addressEn;
              const contact = language === 'bn' ? hospital.contactBn : hospital.contactEn;

              return (
                <div
                  key={hospital.id}
                  className={`bg-white rounded-2xl border p-5 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between ${
                    hospital.isDemo
                      ? 'border-slate-200/90'
                      : hospital.verificationStatus === 'verified'
                      ? 'border-emerald-300 ring-1 ring-emerald-100'
                      : 'border-amber-300 ring-1 ring-amber-100'
                  }`}
                >
                  <div>
                    {/* Header with Type & Live/Demo badge */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                        {hospital.type} Facility
                      </span>
                      {hospital.isDemo ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                          Demo Data
                        </span>
                      ) : hospital.verificationStatus === 'verified' ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>Verified Facility</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 shrink-0 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          <span>Verification Pending</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug">
                      {name}
                    </h3>

                    <div className="mt-2 flex items-start gap-1.5 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{address}</span>
                    </div>

                    {/* Services Tags */}
                    {hospital.services.length > 0 && (
                      <div className="mt-4">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          {t.hospitals.keyServices}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {hospital.services.map((srv) => (
                            <span
                              key={srv}
                              className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700"
                            >
                              {srv}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bed Info & Contact */}
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-slate-500">{t.hospitals.emergencyCasualty}</span>
                        <span className="font-semibold text-slate-900 font-mono">{contact}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-slate-500">{t.hospitals.bedStatusTitle}</span>
                        <span className="text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded">
                          {hospital.bedStatusDemo}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Action */}
                  <div className="mt-5 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => setSelectedHospitalForModal(hospital)}
                      className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>{t.hospitals.contactHospital}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center space-y-3">
            <Building2 className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="font-bold text-slate-800 text-base">
              {language === 'bn' ? 'কোনো হাসপাতাল খুঁজে পাওয়া যায়নি' : 'No Hospitals Found'}
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">{t.hospitals.noResults}</p>
            <button
              onClick={handleReset}
              className="mt-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
            >
              Reset Search
            </button>
          </div>
        )}

        {/* Hospital Detail Modal */}
        {selectedHospitalForModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-base">
                    {language === 'bn'
                      ? selectedHospitalForModal.nameBn
                      : selectedHospitalForModal.nameEn}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {selectedHospitalForModal.division} Division • {selectedHospitalForModal.type}{' '}
                    Facility
                  </p>
                </div>
                <button
                  onClick={() => setSelectedHospitalForModal(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {selectedHospitalForModal.isDemo ? (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Important Facility Notice</span>
                  </p>
                  <p>
                    This hospital listing is a demo entry for prototype evaluation. In a medical
                    emergency, dial government health hotline <strong>16263</strong> or national
                    emergency <strong>999</strong> for official real-time casualty routing.
                  </p>
                </div>
              ) : selectedHospitalForModal.verificationStatus === 'verified' ? (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Verified Healthcare Facility</span>
                  </p>
                  <p>
                    Record Status: <strong>Verified Facility</strong>. Verified against regulatory healthcare records. For emergency routing, contact the facility desk directly or call national health hotline{' '}
                    <strong>16263</strong>.
                  </p>
                </div>
              ) : (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Facility Verification Pending</span>
                  </p>
                  <p>
                    Record Status: <strong>Unverified Listing</strong>. This facility has been submitted to the platform but has not yet completed official regulatory verification.
                  </p>
                </div>
              )}

              <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p>
                  <strong>Address:</strong>{' '}
                  {language === 'bn'
                    ? selectedHospitalForModal.addressBn
                    : selectedHospitalForModal.addressEn}
                </p>
                <p>
                  <strong>Contact Desk:</strong> {selectedHospitalForModal.contactEn}
                </p>
                {selectedHospitalForModal.emergencyHotline && (
                  <p>
                    <strong>Emergency Hotline:</strong>{' '}
                    <span className="font-mono text-red-600 font-bold">
                      {selectedHospitalForModal.emergencyHotline}
                    </span>
                  </p>
                )}
                {selectedHospitalForModal.services.length > 0 && (
                  <p>
                    <strong>Key Facilities:</strong>{' '}
                    {selectedHospitalForModal.services.join(', ')}
                  </p>
                )}
              </div>

              <button
                onClick={() => setSelectedHospitalForModal(null)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs cursor-pointer"
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
