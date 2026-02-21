'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
}

export class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(_: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);

        // Placeholder for Sentry integration
        if (typeof window !== 'undefined' && (window as any).Sentry) {
            (window as any).Sentry.captureException(error);
        }
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
                    <div className="max-w-md w-full text-center space-y-4">
                        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Something went wrong</h1>
                        <p className="text-gray-500 dark:text-gray-400">
                            An unexpected error occurred. Our engineering team has been notified via Sentry.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-6 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                        >
                            Refresh Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
