import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
    // A list of all locales that are supported
    // Note: localePrefix is set to 'never' to remove /bn/, /en/ from URLs
    // The site will always use the default locale (Bangla)
    locales: ['bn', 'en'],
    
    // Default locale - Bangla for Bangladesh market
    defaultLocale: 'bn',
    
    // Disable locale prefix in URLs - site will use root path only
    localePrefix: 'never'
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter, getPathname } =
    createNavigation(routing);
