'use client';

import React, { useState } from 'react';
import { LanguageProvider, useLanguage } from '@/context/language-context';
import { Navbar } from '@/components/navbar';
import { Hero } from '@/components/hero';
import { CategoryGrid } from '@/components/category-grid';
import { BloodDonation } from '@/components/blood-donation';
import { HospitalDirectory } from '@/components/hospital-directory';
import { DoctorDirectory } from '@/components/doctor-directory';
import { PharmacyDirectory } from '@/components/pharmacy-directory';
import { DengueHelp } from '@/components/dengue-help';
import { Footer } from '@/components/footer';

import { AuthModal } from '@/components/modals/auth-modal';
import { DonorModal } from '@/components/modals/donor-modal';
import { AppointmentModal } from '@/components/modals/appointment-modal';
import { HotlineModal } from '@/components/modals/hotline-modal';
import { LegalModal } from '@/components/modals/legal-modal';

import { Doctor, BloodGroup } from '@/types';
import { ShieldAlert } from 'lucide-react';

function ShasthoBondhuApp() {
  const { t } = useLanguage();

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const [donorModalOpen, setDonorModalOpen] = useState(false);
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<BloodGroup | undefined>(undefined);

  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  const [hotlinesModalOpen, setHotlinesModalOpen] = useState(false);

  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalType, setLegalType] = useState<'privacy' | 'terms'>('privacy');

  // Shared Hero search query to synchronize with directories
  const [heroSearchQuery, setHeroSearchQuery] = useState('');
  const [heroDivision, setHeroDivision] = useState('All');

  const handleHeroSearch = (query: string, division: string) => {
    setHeroSearchQuery(query);
    setHeroDivision(division);
  };

  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleOpenDonorRegister = (group?: BloodGroup) => {
    setSelectedBloodGroup(group);
    setDonorModalOpen(true);
  };

  const handleOpenDoctorAppointment = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setAppointmentModalOpen(true);
  };

  const handleOpenLegal = (type: 'privacy' | 'terms') => {
    setLegalType(type);
    setLegalModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Prototype Top Banner */}
      <div className="bg-amber-500 text-slate-950 text-[11px] sm:text-xs font-bold py-1.5 px-4 text-center border-b border-amber-600 flex items-center justify-center gap-2">
        <ShieldAlert className="w-3.5 h-3.5 text-slate-950 shrink-0" />
        <span className="truncate">{t.demoNotice}</span>
      </div>

      {/* Navigation */}
      <Navbar
        onOpenAuth={handleOpenAuth}
        onOpenHotlines={() => setHotlinesModalOpen(true)}
      />

      {/* Main Content Body */}
      <main className="flex-1">
        {/* Hero Section */}
        <Hero
          onSearch={handleHeroSearch}
          onOpenDonorRegister={() => handleOpenDonorRegister('O+')}
        />

        {/* 6 Category Quick Cards */}
        <CategoryGrid onOpenHotlines={() => setHotlinesModalOpen(true)} />

        {/* Blood Donation Section */}
        <BloodDonation
          initialGroup={null}
          onOpenDonorRegister={handleOpenDonorRegister}
          onRequestBloodInfo={() => handleOpenLegal('privacy')}
        />

        {/* Hospital Directory Preview */}
        <HospitalDirectory
          initialSearch={heroSearchQuery}
          initialDivision={heroDivision}
        />

        {/* Doctor Directory Preview */}
        <DoctorDirectory
          initialSearch={heroSearchQuery}
          initialDivision={heroDivision}
          onSelectDoctorForAppointment={handleOpenDoctorAppointment}
        />

        {/* Pharmacy Directory Preview */}
        <PharmacyDirectory
          initialSearch={heroSearchQuery}
          initialDivision={heroDivision}
        />

        {/* Dengue Help & Emergency Notice */}
        <DengueHelp onOpenHotlines={() => setHotlinesModalOpen(true)} />
      </main>

      {/* Footer */}
      <Footer
        onOpenPrivacy={() => handleOpenLegal('privacy')}
        onOpenTerms={() => handleOpenLegal('terms')}
        onOpenHotlines={() => setHotlinesModalOpen(true)}
      />

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />

      <DonorModal
        isOpen={donorModalOpen}
        onClose={() => setDonorModalOpen(false)}
        selectedGroup={selectedBloodGroup || 'O+'}
      />

      <AppointmentModal
        isOpen={appointmentModalOpen}
        onClose={() => setAppointmentModalOpen(false)}
        doctor={selectedDoctor}
      />

      <HotlineModal
        isOpen={hotlinesModalOpen}
        onClose={() => setHotlinesModalOpen(false)}
      />

      <LegalModal
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        type={legalType}
      />
    </div>
  );
}

export default function Home() {
  return (
    <LanguageProvider>
      <ShasthoBondhuApp />
    </LanguageProvider>
  );
}
