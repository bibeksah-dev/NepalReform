"use client";

import React, { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n, { loadManifestoData, loadCommonTranslations, loadTranslations } from '@/lib/i18n';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {

      const savedLang = typeof window !== "undefined" ? localStorage.getItem("i18nextLng") : null;
  if (savedLang && i18n.language !== savedLang) {
    i18n.changeLanguage(savedLang);
  }
    // Load both manifesto data and common translations for the current language on mount
    const initializeTranslations = async () => {
      const currentLang = i18n.language || 'en';
      await Promise.all([
        loadManifestoData(currentLang),
        loadCommonTranslations(currentLang),
        loadTranslations(currentLang)
      ]);
    };

    initializeTranslations();

    // Listen for language changes
    const handleLanguageChange = (lng: string) => {
      Promise.all([
        loadManifestoData(lng),
        loadCommonTranslations(lng),
        loadTranslations(lng)
      ]);
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
}
