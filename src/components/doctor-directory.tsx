'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/language-context';
import { Doctor } from '@/types';
import { SAMPLE_DOCTORS, BANGLADESH_DIVISIONS } from '@/data/sample-data';
import {
  Stethoscope,
  Search,
  MapPin,
  Clock,
  Calendar,
  RotateCcw,
  Banknote,
  GraduationCap,
} from 'lucide-react';

interface DoctorDirectoryProps {
  initialSearch?: string;
  initialDivision?: string;
  onSelectDoctorForAppointment: (doc: Doctor) => void;
}

export function DoctorDirectory({
  initialSearch = '',
  initialDivision = 'All',
  onSelectDoctorForAppointment,
}: DoctorDirectoryProps) {
  const { language, t } = useLanguage();
  const [search, setSearch] = useState(initialSearch);
  const [division, setDivision] = useState(initialDivision);
  const [specialtyFilter, setSpecialtyFilter] = useState('All');

  const specialties = [
    { key: 'All', labelEn: 'All Specialties', labelBn: 'সকল বিশেষজ্ঞ' },
    { key: 'medicine', labelEn: 'Medicine & Dengue', labelBn: 'মেডিসিন ও ডেঙ্গু' },
    { key: 'cardiology', labelEn: 'Cardiology', labelBn: 'হৃদরোগ' },
    { key: 'pediatrics', labelEn: 'Child Care', labelBn: 'শিশু রোগ' },
    { key: 'gynecology', labelEn: 'Gynecology', labelBn: 'স্ত্রী রোগ' },
    { key: 'orthopedics', labelEn: 'Orthopedics', labelBn: 'অর্থোপেডিক' },
    { key: 'neurology', labelEn: 'Neurology', labelBn: 'নিউরোমেডিসিন' },
  ];

  const filteredDoctors = SAMPLE_DOCTORS.filter((doc) => {
    if (division !== 'All' && doc.division !== division) return false;
    if (specialtyFilter !== 'All' && doc.specialtyKey !== specialtyFilter) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchNameEn = doc.nameEn.toLowerCase().includes(q);
      const matchNameBn = doc.nameBn.toLowerCase().includes(q);
      const matchSpecialtyEn = doc.specialtyEn.toLowerCase().includes(q);
      const matchChamber = doc.chamberEn.toLowerCase().includes(q);
      const matchHospital = doc.hospitalEn.toLowerCase().includes(q);

      if (!matchNameEn && !matchNameBn && !matchSpecialtyEn && !matchChamber && !matchHospital) {
        return false;
      }
    }
    return true;
  });

  const handleReset = () => {
    setSearch('');
    setDivision('All');
    setSpecialtyFilter('All');
  };

  return (
    <section id="doctors" className="py-16 bg-slate-50/60 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold mb-3">
            <Stethoscope className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'চিকিৎসক পরামর্শ' : 'Physician Consultations'}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {t.doctors.title}
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
            {t.doctors.subtitle}
          </p>
        </div>

        {/* Search & Filters */}
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/90 shadow-sm mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Search Box */}
            <div className="md:col-span-2 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.doctors.searchPlaceholder}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Division */}
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <select
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="All">{t.hero.allDivisions}</option>
                {BANGLADESH_DIVISIONS.map((div) => (
                  <option key={div} value={div}>
                    {div}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Specialty Filters */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-600 mr-1">Specialties:</span>
            {specialties.map((spec) => {
              const active = specialtyFilter === spec.key;
              const label = language === 'bn' ? spec.labelBn : spec.labelEn;
              return (
                <button
                  key={spec.key}
                  onClick={() => setSpecialtyFilter(spec.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Count Header */}
        <div className="flex items-center justify-between mb-4 px-1">
          <p className="text-xs sm:text-sm font-semibold text-slate-600">
            <span className="font-bold text-slate-900">{filteredDoctors.length}</span>{' '}
            {language === 'bn' ? 'জন বিশেষজ্ঞ চিকিৎসক প্রদর্শিত (নমুনা তথ্য)' : 'doctors listed (Demo Data)'}
          </p>
          {(search || division !== 'All' || specialtyFilter !== 'All') && (
            <button
              onClick={handleReset}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Doctor Cards Grid */}
        {filteredDoctors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map((doc) => {
              const name = language === 'bn' ? doc.nameBn : doc.nameEn;
              const degree = language === 'bn' ? doc.degreeBn : doc.degreeEn;
              const specialty = language === 'bn' ? doc.specialtyBn : doc.specialtyEn;
              const chamber = language === 'bn' ? doc.chamberBn : doc.chamberEn;
              const hours = language === 'bn' ? doc.visitingHoursBn : doc.visitingHoursEn;

              return (
                <div
                  key={doc.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                        {specialty}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                        {t.doctors.demoBadge}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug">
                      {name}
                    </h3>

                    <div className="mt-1 flex items-start gap-1.5 text-xs text-slate-600">
                      <GraduationCap className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                      <span className="leading-snug">{degree}</span>
                    </div>

                    {/* Chamber Details */}
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                      <div className="flex items-start gap-2 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-slate-800">{t.doctors.chamberLocation}</p>
                          <p className="text-slate-500">{chamber}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-slate-800">{t.doctors.consultationHours}</p>
                          <p className="text-slate-500">{hours}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-slate-600 pt-1">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{t.doctors.consultationFee}</span>
                        </span>
                        <span className="font-bold text-emerald-700">
                          {doc.consultationFeeDemo}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Booking Action */}
                  <div className="mt-5 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => onSelectDoctorForAppointment(doc)}
                      className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{t.doctors.bookAppointment}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-10 bg-white rounded-2xl border border-dashed border-slate-300 text-center space-y-3">
            <Stethoscope className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="font-bold text-slate-800 text-base">
              {language === 'bn' ? 'কোনো ডাক্তার খুঁজে পাওয়া যায়নি' : 'No Doctors Found'}
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">{t.doctors.noResults}</p>
            <button
              onClick={handleReset}
              className="mt-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
            >
              Reset Search
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
