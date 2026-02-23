import i18nextInstance from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import bn from './locales/bn.json';
import en from './locales/en.json';
import hi from './locales/hi.json';

i18nextInstance
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            bn: { translation: bn },
            en: { translation: en },
            hi: { translation: hi }
        },
        lng: 'bn', // Default to Bangla
        fallbackLng: 'bn',
        detection: {
            // Only use localStorage to remember user's manual selection
            // Don't detect from browser as we want Bangla by default
            order: ['localStorage'],
            lookupLocalStorage: 'i18nextLng',
            caches: ['localStorage'],
        },
        interpolation: {
            escapeValue: false
        }
    });

export default i18nextInstance;

// Defines supported locales for the application.
// 'bn' (Bangla) is the default locale for Bangladesh-first targeting.
// Add new locales to the 'locales' array and 'localeLabels' record to extend support.

export const i18n = {
    defaultLocale: 'bn', // Bangla is the primary/default language
    locales: ['bn', 'en'], // All supported locales; order matters for fallback logic
} as const;

// Derive the Locale union type directly from the config to keep them in sync.
// This means: type Locale = 'bn' | 'en'
export type Locale = (typeof i18n)['locales'][number];

// Human-readable labels for locale switcher UI components.
// Key: locale code. Value: native language name shown to users.
export const localeLabels: Record<Locale, string> = {
    bn: 'বাংলা',   // Bangla label in Bangla script
    en: 'English', // English label in English
};
