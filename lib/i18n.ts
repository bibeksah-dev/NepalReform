import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Initialize i18n
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    lng: 'en', // default language
    debug: false,
    supportedLngs: ['en', 'np'],
    
    interpolation: {
      escapeValue: false,
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },

    resources: {
      en: {
        manifesto: {}, // Will be loaded dynamically
        common: {} ,    // Will be loaded dynamically
        translation: {}
      },
      np: {
        manifesto: {}, // Will be loaded dynamically
        common: {},    // Will be loaded dynamically
        translation: {}
      }
    }
  });

// Function to load manifesto data
export async function loadManifestoData(language: string) {
  try {
    const response = await fetch(`/locales/${language}/manifesto.json`);
    const data = await response.json();
    
    i18n.addResourceBundle(language, 'manifesto', { items: data }, true, true);
    
    return data;
  } catch (error) {
    console.error(`Failed to load manifesto data for language: ${language}`, error);
    return [];
  }
}

// Function to load common translations
export async function loadCommonTranslations(language: string) {

  console.log("Loading common translations for language:", language);
  try {
    const response = await fetch(`/locales/${language}/common.json`);
    const data = await response.json();
    
    i18n.addResourceBundle(language, 'common', data, true, true);
    
    return data;
  } catch (error) {
    console.error(`Failed to load common translations for language: ${language}`, error);
    return {};
  }
}

// Function to load  translations
export async function loadTranslations(language: string) {
  console.log("Loading translations for language:", language);
  try {
    const response = await fetch(`/locales/${language}/translation.json`);
    const data = await response.json();
    
    i18n.addResourceBundle(language, 'translation', data, true, true);
    
    return data;
  } catch (error) {
    console.error(`Failed to load translations for language: ${language}`, error);
    return {};
  }
}

export default i18n;
