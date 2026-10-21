'use client';

import React, { createContext, useContext, useState } from 'react';
import { Language } from '@/types';
import { translations } from '@/data/translations';

interface LanguageContextType {
  language: Language;
  t: typeof translations.en;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('shastho_lang') as Language | null;
        if (saved === 'en' || saved === 'bn') {
          return saved;
        }
      } catch {
        // LocalStorage access restricted or unavailable
      }
    }
    return 'bn';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('shastho_lang', lang);
      } catch {
        // Ignore
      }
    }
  };

  const toggleLanguage = () => {
    const nextLang = language === 'bn' ? 'en' : 'bn';
    setLanguage(nextLang);
  };

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, t, setLanguage, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
