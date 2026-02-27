'use client';

import { ReactNode, useEffect, useState } from 'react';
import i18n from '@/i18n/config';
import { I18nextProvider } from 'react-i18next';

export function I18nProvider({ children }: { children: ReactNode }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (typeof window !== 'undefined' && !i18n.isInitialized) {
            i18n.init();
        }
    }, []);

    if (!mounted) {
        return <>{children}</>;
    }

    return (
        <I18nextProvider i18n={i18n}>
            {children}
        </I18nextProvider>
    );
}
