'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { en } from './locales/en';
import { he } from './locales/he';

export type Language = 'en' | 'he';

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, variables?: Record<string, any>) => any;
  isRtl: boolean;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

const locales = { en, he };

function getNestedValue(obj: any, path: string): any {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return current;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load from localStorage on client-side mount
    const saved = localStorage.getItem('bubble_index_lang') as Language;
    if (saved === 'en' || saved === 'he') {
      setLanguageState(saved);
    } else {
      // Auto-detect if user is from Israel or has Hebrew set as browser language
      try {
        const isIsraelTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone === 'Asia/Jerusalem';
        const hasHebrewLang = typeof navigator !== 'undefined' && (
          navigator.language?.startsWith('he') || 
          navigator.languages?.some(lang => lang.startsWith('he'))
        );
        if (isIsraelTimezone || hasHebrewLang) {
          setLanguageState('he');
        }
      } catch (e) {
        console.error('Error auto-detecting language preference:', e);
      }
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('bubble_index_lang', lang);
    }
  };

  useEffect(() => {
    if (mounted && typeof document !== 'undefined') {
      document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
    }
  }, [language, mounted]);

  const isRtl = language === 'he';

  const t = (key: string, variables?: Record<string, any>): any => {
    const dict = locales[language];
    let val = getNestedValue(dict, key);

    // Fallback to English dict if not found in active dict
    if (val === undefined && language !== 'en') {
      val = getNestedValue(locales.en, key);
    }

    if (val === undefined) {
      return key;
    }

    if (typeof val === 'string' && variables) {
      let str = val;
      Object.entries(variables).forEach(([k, v]) => {
        str = str.replace(new RegExp(`{${k}}`, 'g'), String(v));
      });
      return str;
    }

    return val;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRtl }}>
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
