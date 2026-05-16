import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ClientProviders } from '@/components/providers/ClientProviders';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { PWAInstallPrompt } from '@/components/pwa';
import GoogleOAuthCallback from '@/components/auth/GoogleOAuthCallback';
import { HeaderWrapper } from '@/components/layout/HeaderWrapper';

export const metadata: Metadata = {
  title: 'Plokymarket - Prediction Marketplace',
  description: 'বাংলাদেশের প্রথম এবং একমাত্র প্রেডিকশন মার্কেটপ্লেস। খেলাধুলা, রাজনীতি, অর্থনীতি এবং আরও অনেক বিষয়ে ভবিষ্যতবাণী করুন এবং জয়ী হোন।',
  keywords: ['prediction market', 'polymarket', 'bangladesh', 'forex', 'sports betting', 'prediction', 'binary options', 'বাংলাদেশ', 'প্রেডিকশন'],
  authors: [{ name: 'Plokymarket' }],
  creator: 'Plokymarket',
  publisher: 'Plokymarket',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://plokymarket.com'),
  alternates: {
    canonical: '/',
    languages: {
      'bn': '/',
      'en': '/en',
    },
  },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'Plokymarket',
    title: 'Plokymarket - Prediction Marketplace',
    description: 'বাংলাদেশের প্রথম এবং একমাত্র প্রেডিকশন মার্কেটপ্লেস। খেলাধুলা, রাজনীতি, অর্থনীতি এবং আরও অনেক বিষয়ে ভবিষ্যতবাণী করুন।',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Plokymarket - Bangladesh Prediction Marketplace',
      },
    ],
    locale: 'bn_BD',
    alternateLocale: ['en_US'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Plokymarket - Prediction Marketplace',
    description: 'বাংলাদেশের প্রথম এবং একমাত্র প্রেডিকশন মার্কেটপ্লেস।',
    images: ['/og-image.png'],
    creator: '@plokymarket',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#8B5CF6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use default locale (Bangla) - no more /bn/ or /en/ in URLs
  const locale = routing.defaultLocale;

  // Providing all messages to the client
  // side is set to false to enable parallel loading
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://polymarketbd.com" />
        <link rel="dns-prefetch" href="https://polymarketbd.com" />
        {(process.env.NODE_ENV === "development" || process.env.VERCEL_ENV === "preview") && (
          // eslint-disable-next-line @next/next/no-sync-scripts
          <script
            data-recording-token="VveqfkUtMLGIWPhY9x57voUBCes5QuGPMavcjPp1"
            data-is-production-environment="false"
            src="https://snippet.meticulous.ai/v1/meticulous.js"
          />
        )}
      </head>
      <body>
        <ClientProviders>
          <GoogleOAuthCallback />
          <NextIntlClientProvider messages={messages}>
            <HeaderWrapper />
            {children}
          </NextIntlClientProvider>
        </ClientProviders>
        <PWAInstallPrompt />
      </body>
    </html>
  );
}
