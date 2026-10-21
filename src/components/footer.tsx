'use client';

import React from 'react';
import { useLanguage } from '@/context/language-context';
import {
  Heart,
  PhoneCall,
  ShieldCheck,
  AlertOctagon,
} from 'lucide-react';

interface FooterProps {
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
  onOpenHotlines: () => void;
}

export function Footer({ onOpenPrivacy, onOpenTerms, onOpenHotlines }: FooterProps) {
  const { language, t } = useLanguage();

  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Critical Emergency Guidance Advisory Callout */}
        <div className="mb-12 p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 shrink-0">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">
                {t.footer.guidanceNoticeTitle}
              </h4>
              <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                {t.footer.guidanceNoticeText}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenHotlines}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs sm:text-sm shrink-0 transition-colors flex items-center gap-2 shadow-lg shadow-red-600/30 cursor-pointer"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Call 16263 / 999</span>
          </button>
        </div>

        {/* 4 Columns Footer */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-teal-400 flex items-center justify-center text-white">
                <Heart className="w-5 h-5 fill-white" />
              </div>
              <span className="text-xl font-black text-white tracking-tight">
                Shastho<span className="text-blue-400">Bondhu</span>
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700 font-bold">
                {language === 'bn' ? 'স্বাস্থ্যবন্ধু' : 'BD'}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
              {t.footer.aboutText}
            </p>

            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Community-Centric Healthcare Assistance Platform</span>
            </div>
          </div>

          {/* Directory Links */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-white">
              {t.footer.quickLinks}
            </h5>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#doctors" className="hover:text-blue-400 transition-colors">
                  {t.nav.doctors}
                </a>
              </li>
              <li>
                <a href="#hospitals" className="hover:text-blue-400 transition-colors">
                  {t.nav.hospitals}
                </a>
              </li>
              <li>
                <a href="#pharmacies" className="hover:text-blue-400 transition-colors">
                  {t.nav.pharmacies}
                </a>
              </li>
              <li>
                <a href="#blood" className="hover:text-blue-400 transition-colors">
                  {t.nav.blood}
                </a>
              </li>
              <li>
                <a href="#dengue" className="hover:text-blue-400 transition-colors">
                  {t.nav.dengue}
                </a>
              </li>
            </ul>
          </div>

          {/* Hotlines */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-white">
              {t.footer.emergencyTitle}
            </h5>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="tel:16263" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <span className="font-bold text-white">16263</span> - Shastho Batayon
                </a>
              </li>
              <li>
                <a href="tel:999" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <span className="font-bold text-white">999</span> - National Emergency
                </a>
              </li>
              <li>
                <a href="tel:10655" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <span className="font-bold text-white">10655</span> - IEDCR Hotline
                </a>
              </li>
              <li>
                <a href="tel:333" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <span className="font-bold text-white">333</span> - Citizen Help Desk
                </a>
              </li>
            </ul>
          </div>

          {/* Legal / Policy */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-white">
              Compliance & Ethics
            </h5>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={onOpenPrivacy}
                  className="hover:text-blue-400 transition-colors text-left cursor-pointer"
                >
                  Privacy & Donor Protection
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenTerms}
                  className="hover:text-blue-400 transition-colors text-left cursor-pointer"
                >
                  Terms & Medical Disclaimer
                </button>
              </li>
              <li>
                <span className="text-slate-500 block">Non-Commercial Blood Policy</span>
              </li>
              <li>
                <span className="text-slate-500 block">DGHS Guidelines Compliant</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Prototype Disclaimer & Copyright Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 text-xs text-slate-500 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-center md:text-left leading-relaxed max-w-2xl">
            {t.footer.disclaimer}
          </p>
          <p className="text-slate-400 text-center md:text-right shrink-0">
            © 2026 {t.footer.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
