'use client';

import React, { ReactNode, Suspense } from 'react';
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { I18nProvider } from "@/components/providers/I18nProvider";
import { AuthProvider } from './AuthProvider';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { GlobalErrorBoundary } from '@/components/GlobalErrorBoundary';

export function ClientProviders({ children }: { children: ReactNode }) {
    return (
        <GlobalErrorBoundary>
            <NuqsAdapter>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="light"
                    enableSystem
                    disableTransitionOnChange
                >
                    <AuthProvider>
                        <I18nProvider>
                            <Suspense fallback={null}>
                                {children}
                            </Suspense>
                            <Toaster position="top-center" expand={true} richColors />
                        </I18nProvider>
                    </AuthProvider>
                </ThemeProvider>
            </NuqsAdapter>
        </GlobalErrorBoundary>
    );
}
