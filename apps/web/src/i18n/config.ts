import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import bn from './locales/bn.json';
import en from './locales/en.json';
import hi from './locales/hi.json';

i18n
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

export default i18n;
