// src/i18n/useTranslations.ts
// Lightweight translation accessor.
// Usage in a component:
//   const t = useTranslations('trade');
//   return <button>{t('buy')}</button>;

import { useRouter } from 'next/router';
import type { Locale } from './config';
import bn from './messages/bn.json';
import en from './messages/en.json';

// Map locale codes to their message objects
const messages: Record<Locale, typeof bn> = { bn, en };

type Messages = typeof bn;
type Namespace = keyof Messages;
type Key<N extends Namespace> = keyof Messages[N];

export function useTranslations<N extends Namespace>(namespace: N) {
    const { locale } = useRouter();
    const safeLocale = (locale as Locale) ?? 'bn';
    const namespaceMessages = messages[safeLocale][namespace];

    // Returns the translation string for a given key within the namespace.
    // Falls back to the 'bn' default if the locale messages are missing.
    return function t(key: Key<N>): string {
        return (namespaceMessages as Record<string, string>)[key as string]
            ?? (messages['bn'][namespace] as Record<string, string>)[key as string]
            ?? String(key);
    };
}
