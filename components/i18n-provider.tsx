"use client";

import React, { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n, { loadManifestoData, loadTranslations, isTranslationsLoaded } from '@/lib/i18n';

// Minimal loading skeleton that won't cause layout shift
function TranslationLoadingFallback() {
  return (
    <div
      className="min-h-screen bg-background"
      style={{ visibility: 'hidden' }}
      aria-hidden="true"
    >
      {/* Invisible placeholder to prevent layout shift */}
    </div>
  );
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(() => {
    // Check if already loaded (for fast subsequent renders)
    if (typeof window !== 'undefined') {
      return isTranslationsLoaded();
    }
    return false;
  });

  useEffect(() => {
    let mounted = true;

    // Load translations and wait for completion
    loadTranslations()
      .then(() => {
        if (mounted) {
          setIsReady(true);
        }
      })
      .catch(err => {
        console.error('Failed to load translations:', err);
        // Still render even if translations fail to load
        if (mounted) {
          setIsReady(true);
        }
      });

    // Listen for language changes
    const handleLanguageChange = (lng: string) => {
      loadManifestoData(lng).catch(err => {
        console.error('Failed to load manifesto data:', err);
      });
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      mounted = false;
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  // Don't render children until translations are loaded
  if (!isReady) {
    return (
      <I18nextProvider i18n={i18n}>
        <TranslationLoadingFallback />
      </I18nextProvider>
    );
  }

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
}
