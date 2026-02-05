'use client';

import { ReactNode, useEffect, useState } from 'react';
import i18n from '@/i18n/config';
import { I18nextProvider } from 'react-i18next';

export function I18nProvider({ children }: { children: ReactNode }) {
    const [isInitialized, setIsInitialized] = useState(i18n.isInitialized);

    useEffect(() => {
        // Ensure i18n is initialized on client side
        if (i18n.isInitialized) {
            setIsInitialized(true);
        } else {
            i18n.on('initialized', () => {
                setIsInitialized(true);
            });
        }

        // Force re-render when language changes
        const handleLanguageChange = () => {
            // This forces a re-render of the provider
            setIsInitialized(true);
        };

        i18n.on('languageChanged', handleLanguageChange);

        return () => {
            i18n.off('languageChanged', handleLanguageChange);
        };
    }, []);

    // Show nothing while i18n initializes to prevent hydration mismatch
    if (!isInitialized) {
        return null;
    }

    return (
        <I18nextProvider i18n={i18n}>
            {children}
        </I18nextProvider>
    );
}
