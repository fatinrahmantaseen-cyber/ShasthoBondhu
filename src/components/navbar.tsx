'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/language-context';
import {
  Activity,
  Heart,
  PhoneCall,
  Menu,
  X,
  Languages,
  User,
  Shield,
  Stethoscope,
  Building2,
  Pill,
  Droplets,
  AlertCircle,
} from 'lucide-react';

interface NavbarProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenHotlines: () => void;
}

export function Navbar({ onOpenAuth, onOpenHotlines }: NavbarProps) {
  const { language, t, toggleLanguage } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '#home', label: t.nav.home, icon: Activity },
    { href: '#doctors', label: t.nav.doctors, icon: Stethoscope },
    { href: '#hospitals', label: t.nav.hospitals, icon: Building2 },
    { href: '#pharmacies', label: t.nav.pharmacies, icon: Pill },
    { href: '#blood', label: t.nav.blood, icon: Droplets },
    { href: '#dengue', label: t.nav.dengue, icon: AlertCircle },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Top Emergency Ticker */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="truncate">
              {language === 'bn'
                ? 'জাতীয় স্বাস্থ্য হেল্পলাইন: ২৪/৭ বিনামূল্যে ডাক্তার পরামর্শ পেতে কল করুন ১৬২৬৩'
                : 'National Health Hotline: Free 24/7 doctor consultations available at 16263'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-blue-100">
            <button
              onClick={onOpenHotlines}
              className="hover:text-white transition-colors flex items-center gap-1 font-semibold underline underline-offset-2"
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.nav.hotlines} (999, 16263)</span>
            </button>
            <span className="text-blue-300/40">|</span>
            <span className="text-amber-300 font-medium flex items-center gap-1">
              <Shield className="w-3 h-3" />
              <span>Frontend Prototype</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand */}
          <a
            href="#home"
            className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl p-1"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Heart className="w-6 h-6 fill-white text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Shastho<span className="text-blue-600">Bondhu</span>
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {language === 'bn' ? 'স্বাস্থ্যবন্ধু' : 'BD'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium tracking-wide hidden sm:block">
                {language === 'bn' ? 'চিকিৎসা সেবা • রক্তদান • জীবন রক্ষা' : 'Find Care • Donate Blood • Save Lives'}
              </p>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50/60 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Actions & Controls */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-white text-slate-700 hover:text-blue-600 font-bold text-xs shadow-2xs transition-all cursor-pointer"
              aria-label="Toggle language between English and Bangla"
            >
              <Languages className="w-4 h-4 text-blue-600" />
              <span>{language === 'bn' ? 'English' : 'বাংলা'}</span>
            </button>

            {/* Emergency Hotline Button */}
            <button
              onClick={onOpenHotlines}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs transition-colors cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.nav.emergencyHelp}</span>
            </button>

            {/* Login / Register Placeholders */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3 py-2 text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                {t.nav.login}
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs shadow-blue-600/30 transition-all flex items-center gap-1"
              >
                <User className="w-3.5 h-3.5" />
                <span>{t.nav.register}</span>
              </button>
            </div>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={toggleLanguage}
              className="p-2 rounded-lg border border-slate-200 text-xs font-bold text-blue-600 flex items-center gap-1"
              aria-label="Toggle language"
            >
              <Languages className="w-4 h-4" />
              <span>{language === 'bn' ? 'EN' : 'বাং'}</span>
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 hover:text-blue-600 hover:bg-slate-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-2 duration-150">
          <div className="grid grid-cols-1 gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <Icon className="w-4 h-4 text-blue-500" />
                  <span>{link.label}</span>
                </a>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenHotlines();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-50 text-emerald-800 font-bold text-sm rounded-xl border border-emerald-200"
            >
              <PhoneCall className="w-4 h-4 text-emerald-600" />
              <span>{t.nav.emergencyHelp} (Hotline Directory)</span>
            </button>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth('login');
                }}
                className="py-2.5 text-center text-xs font-bold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50"
              >
                {t.nav.login}
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth('register');
                }}
                className="py-2.5 text-center text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-sm"
              >
                {t.nav.register}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

