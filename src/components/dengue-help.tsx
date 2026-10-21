'use client';

import React from 'react';
import { useLanguage } from '@/context/language-context';
import { OFFICIAL_HOTLINES } from '@/data/sample-data';
import {
  AlertTriangle,
  ShieldAlert,
  Droplet,
  CheckCircle2,
  PhoneCall,
  Activity,
  HeartPulse,
  Info,
} from 'lucide-react';

interface DengueHelpProps {
  onOpenHotlines: () => void;
}

export function DengueHelp({ onOpenHotlines }: DengueHelpProps) {
  const { language, t } = useLanguage();

  const preventionCards = [
    {
      title: t.dengue.prevention1Title,
      desc: t.dengue.prevention1Desc,
      icon: Droplet,
      tag: 'Water Safety',
    },
    {
      title: t.dengue.prevention2Title,
      desc: t.dengue.prevention2Desc,
      icon: ShieldAlert,
      tag: 'Net Protection',
    },
    {
      title: t.dengue.prevention3Title,
      desc: t.dengue.prevention3Desc,
      icon: HeartPulse,
      tag: 'Personal Care',
    },
    {
      title: t.dengue.prevention4Title,
      desc: t.dengue.prevention4Desc,
      icon: Activity,
      tag: 'Vector Control',
    },
  ];

  return (
    <section id="dengue" className="py-16 bg-slate-50 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold mb-3">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'জাতীয় স্বাস্থ্য সচেতনতা' : 'National Health Advisory'}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {t.dengue.title}
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
            {t.dengue.subtitle}
          </p>
        </div>

        {/* Clear Medical Disclaimer Notice */}
        <div className="mb-10 p-4 sm:p-5 rounded-2xl bg-white border border-amber-300 shadow-sm flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div className="text-xs sm:text-sm text-slate-700 space-y-1">
            <p className="font-bold text-slate-900">Official Non-Diagnostic Medical Notice</p>
            <p className="leading-relaxed text-slate-600">{t.dengue.bannerNotice}</p>
          </div>
        </div>

        {/* CRITICAL EMERGENCY WARNING SIGNS (RED ALERT) */}
        <div className="mb-12 rounded-3xl bg-gradient-to-br from-red-600 via-rose-600 to-red-700 text-white p-6 sm:p-8 shadow-xl shadow-red-600/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-xs text-white">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                  {t.dengue.warningTitle}
                </h3>
                <p className="text-xs sm:text-sm text-red-100 mt-1">
                  {t.dengue.warningSubtitle}
                </p>
              </div>
            </div>

            <button
              onClick={onOpenHotlines}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-red-700 hover:bg-red-50 font-black text-xs sm:text-sm shadow-md transition-all shrink-0 cursor-pointer"
            >
              <PhoneCall className="w-4 h-4 text-red-600" />
              <span>{language === 'bn' ? 'জরুরি অ্যাম্বুলেন্স (৯৯৯ / ১৬২৬৩)' : 'Emergency Help (999 / 16263)'}</span>
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {t.dengue.warningSigns.map((sign, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 flex items-start gap-2.5 text-xs sm:text-sm"
              >
                <span className="w-5 h-5 rounded-full bg-white text-red-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  !
                </span>
                <span className="font-medium text-white leading-snug">{sign}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-white/20 text-xs text-red-100 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-200" />
            <p className="font-semibold text-amber-100">{t.dengue.warningAlert}</p>
          </div>
        </div>

        {/* Symptoms vs Prevention 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Common Symptoms Checklist */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
                <HeartPulse className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  {t.dengue.symptomsTitle}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{t.dengue.symptomsSubtitle}</p>
              </div>
            </div>

            <div className="space-y-3">
              {t.dengue.symptomList.map((sym, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3 text-xs sm:text-sm text-slate-700"
                >
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span className="font-medium">{sym}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
              {language === 'bn'
                ? 'লক্ষণ শুরুর সাথে সাথে বিশ্রাম নিন, পর্যাপ্ত ওআরএস (ORS) ও তরল পান করুন এবং রক্তের সিবিসি (CBC) ও এনএস-১ (NS1) অ্যান্টিজেন টেস্টের জন্য চিকিৎসকের পরামর্শ নিন।'
                : 'Hydrate continuously with oral rehydration solutions (ORS), get ample bed rest, and consult a doctor for complete blood count (CBC) and NS1 antigen testing.'}
            </div>
          </div>

          {/* Prevention Pillars */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  {t.dengue.preventionTitle}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === 'bn' ? 'এডিস মশার প্রজনন ধ্বংস করুন' : 'Eliminate Aedes Breeding Grounds'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {preventionCards.map((prev, idx) => {
                const Icon = prev.icon;
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                        {prev.tag}
                      </span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">{prev.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{prev.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Official Emergency Contact Cards */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg sm:text-xl font-black">{t.dengue.hotlinesTitle}</h3>
              <p className="text-xs sm:text-sm text-blue-200 mt-0.5">
                {language === 'bn'
                  ? 'ডেঙ্গু পরামর্শ ও হাসপাতালে ভর্তির সহযোগিতার জন্য সরকারি যোগাযোগ'
                  : 'Direct government numbers for dengue consultation and casualty referral.'}
              </p>
            </div>
            <button
              onClick={onOpenHotlines}
              className="text-xs font-bold text-cyan-300 hover:text-white underline underline-offset-4"
            >
              View Full Hotline Directory →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {OFFICIAL_HOTLINES.map((hotline) => {
              const name = language === 'bn' ? hotline.nameBn : hotline.nameEn;
              const tag = language === 'bn' ? hotline.tagBn : hotline.tagEn;

              return (
                <a
                  key={hotline.id}
                  href={`tel:${hotline.number}`}
                  className="p-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 transition-colors flex items-center justify-between group"
                >
                  <div>
                    <span className="text-xs font-bold text-cyan-300 block">{tag}</span>
                    <span className="text-base font-bold text-white group-hover:text-cyan-200 transition-colors">
                      {name}
                    </span>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
