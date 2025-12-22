import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Track if translations have been loaded
let translationsLoaded = false;
let loadingPromise: Promise<void> | null = null;

// Initialize i18n synchronously with empty resources first
if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      fallbackLng: 'en',
      lng: 'en',
      debug: false,
      supportedLngs: ['en', 'np'],
      interpolation: { escapeValue: false },
      detection: {
        order: ['localStorage', 'navigator', 'htmlTag'],
        caches: ['localStorage'],
      },
      resources: {
        en: { common: {}, manifesto: {} },
        np: { common: {}, manifesto: {} }
      }
    });
}

// Function to load translations asynchronously in background
async function loadTranslations() {
  if (translationsLoaded) return;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      // Load both English and Nepali common translations
      const [enCommon, npCommon] = await Promise.all([
        fetch('/locales/en/common.json').then(r => r.json()),
        fetch('/locales/np/common.json').then(r => r.json())
      ]);

      // Add translations to existing i18n instance
      i18n.addResourceBundle('en', 'common', enCommon, true, true);
      i18n.addResourceBundle('np', 'common', npCommon, true, true);

      translationsLoaded = true;
    } catch (error) {
      console.error('Failed to load translations:', error);
    }
  })();

  return loadingPromise;
}

// Load translations immediately in background (for client-side)
if (typeof window !== 'undefined') {
  loadTranslations();
}

// Function to load summary manifesto data (for ManifestoCard)
export async function loadManifestoSummaryData(language: string) {
  try {
    const response = await fetch(`/locales/${language}/summary.json`);
    const data = await response.json();
    
    // Add to i18n resources for caching
    i18n.addResourceBundle(language, 'manifesto-summary', { items: data }, true, true);
    
    return data.manifestoData || data;
  } catch (error) {
    console.error(`Failed to load manifesto summary data for language: ${language}`, error);
    return [];
  }
}

// Function to load individual agenda detail data
export async function loadAgendaDetailData(language: string, agendaId: string) {
  try {
    const response = await fetch(`/locales/${language}/agenda/${agendaId}.json`);
    const data = await response.json();
    
    // Add to i18n resources for caching
    i18n.addResourceBundle(language, `agenda-${agendaId}`, data, true, true);
    
    return data;
  } catch (error) {
    console.error(`Failed to load agenda detail data for ${agendaId} in language: ${language}`, error);
    return null;
  }
}

// Function to load manifesto data (legacy support)
export async function loadManifestoData(language: string) {
  try {
    // Try to load from summary first (new structure)
    const summaryData = await loadManifestoSummaryData(language);
    if (summaryData && summaryData.length > 0) {
      return summaryData;
    }
    
    // Fallback to old structure if summary doesn't exist
    const response = await fetch(`/locales/${language}/manifesto.json`);
    const data = await response.json();
    
    i18n.addResourceBundle(language, 'manifesto', { items: data }, true, true);
    
    return data.manifestoData || data;
  } catch (error) {
    console.error(`Failed to load manifesto data for language: ${language}`, error);
    return [];
  }
}

// Function to load common translations (now just ensures initialization)
export async function loadCommonTranslations(language: string) {
  // Wait for initial translations to load
  await loadTranslations();
  
  // Return the translations from the bundle
  return i18n.getResourceBundle(language, 'common') || {};
}

// Check if translations are already loaded
export function isTranslationsLoaded(): boolean {
  return translationsLoaded;
}

// Export the loadTranslations function for use in the provider
export { loadTranslations };

export default i18n;
