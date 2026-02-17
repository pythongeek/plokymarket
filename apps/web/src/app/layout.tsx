import type { Metadata } from 'next';
import './globals.css';
import { I18nProvider } from '@/components/providers/I18nProvider';
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from '@/components/providers/AuthProvider';

export const metadata: Metadata = {
  title: 'Plokymarket - Prediction Marketplace',
  description: 'Bangladesh\'s first and only prediction marketplace',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn">
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <I18nProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
