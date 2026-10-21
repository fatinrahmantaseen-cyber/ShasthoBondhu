'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/language-context';
import { BANGLADESH_DIVISIONS, DIVISION_NAMES_BN } from '@/data/sample-data';
import {
  Search,
  MapPin,
  Filter,
  ArrowRight,
  Droplets,
  Building2,
  PhoneCall,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';

interface HeroProps {
  onSearch: (query: string, division: string, category: string) => void;
  onOpenDonorRegister: () => void;
}

export function Hero({ onSearch, onOpenDonorRegister }: HeroProps) {
  const { language, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery, selectedDivision, selectedCategory);

    // Smooth scroll to the target section based on category
    let targetId = 'hospitals';
    if (selectedCategory === 'Doctors') targetId = 'doctors';
    if (selectedCategory === 'Hospitals') targetId = 'hospitals';
    if (selectedCategory === 'Pharmacies') targetId = 'pharmacies';
    if (selectedCategory === 'Blood') targetId = 'blood';

    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section id="home" className="relative bg-gradient-to-b from-blue-50/70 via-white to-slate-50/50 pt-8 pb-16 lg:pt-16 lg:pb-24 border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Pilot Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 border border-blue-200 text-blue-800 text-xs font-semibold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span>{t.hero.badge}</span>
          </div>
        </div>

        {/* Main Headings */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
            <span className="text-blue-600">{t.hero.titleHighlight}</span>{' '}
            <span>{t.hero.titleRest}</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            {t.hero.subtitle}
          </p>
        </div>

        {/* Unified Search Bar Box */}
        <div className="max-w-4xl mx-auto mb-10">
          <form
            onSubmit={handleSearchSubmit}
            className="p-3 sm:p-4 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/90 flex flex-col md:flex-row gap-3 items-stretch"
          >
            {/* Search Input */}
            <div className="flex-1 relative flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.hero.searchPlaceholder}
                aria-label={t.hero.searchPlaceholder}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-transparent hover:border-slate-200 focus:border-blue-500 focus:bg-white text-slate-800 placeholder-slate-400 text-sm focus:outline-none transition-all"
              />
            </div>

            {/* Division Selector */}
            <div className="w-full md:w-48 relative flex items-center border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 md:pl-2">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                aria-label={t.hero.allDivisions}
                className="w-full pl-9 pr-8 py-3 rounded-xl border border-transparent bg-transparent text-slate-700 text-sm font-medium focus:outline-none cursor-pointer"
              >
                <option value="All">{t.hero.allDivisions}</option>
                {BANGLADESH_DIVISIONS.map((div) => (
                  <option key={div} value={div}>
                    {language === 'bn' ? DIVISION_NAMES_BN[div] : div}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Selector */}
            <div className="w-full md:w-44 relative flex items-center border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 md:pl-2">
              <Filter className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-label={t.hero.allCategories}
                className="w-full pl-9 pr-8 py-3 rounded-xl border border-transparent bg-transparent text-slate-700 text-sm font-medium focus:outline-none cursor-pointer"
              >
                <option value="All">{t.hero.allCategories}</option>
                <option value="Hospitals">{t.hero.categoryHospitals}</option>
                <option value="Doctors">{t.hero.categoryDoctors}</option>
                <option value="Pharmacies">{t.hero.categoryPharmacies}</option>
                <option value="Blood">{t.hero.categoryBlood}</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-600/30 transition-all flex items-center justify-center gap-2 text-sm shrink-0 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>{t.hero.searchAction}</span>
            </button>
          </form>
        </div>

        {/* Call to Actions */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-14">
          <a
            href="#hospitals"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all hover:translate-y-[-1px]"
          >
            <Building2 className="w-4 h-4" />
            <span>{t.hero.ctaFindCare}</span>
            <ArrowRight className="w-4 h-4" />
          </a>

          <a
            href="#blood"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 font-bold text-sm shadow-xs transition-all hover:border-rose-300"
          >
            <Droplets className="w-4 h-4 text-rose-600 fill-rose-600" />
            <span>{t.hero.ctaRequestBlood}</span>
          </a>

          <button
            onClick={onOpenDonorRegister}
            className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm transition-colors cursor-pointer"
          >
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{t.blood.registerBtn}</span>
          </button>
        </div>

        {/* Trust Badges & Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <div className="p-4 bg-white/80 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{t.hero.statHotline}</p>
              <p className="text-xs text-slate-500">{t.hero.statHotlineDesc}</p>
            </div>
          </div>

          <div className="p-4 bg-white/80 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{t.hero.statDivisions}</p>
              <p className="text-xs text-slate-500">{t.hero.statDivisionsDesc}</p>
            </div>
          </div>

          <div className="p-4 bg-white/80 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{t.hero.statPrivacy}</p>
              <p className="text-xs text-slate-500">{t.hero.statPrivacyDesc}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
