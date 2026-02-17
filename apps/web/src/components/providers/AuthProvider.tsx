'use client';

import { useEffect } from 'react';
import { useStore } from '@/store/useStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const initializeAuth = useStore((state) => state.initializeAuth);

    useEffect(() => {
        initializeAuth();
    }, [initializeAuth]);

    return <>{children}</>;
}
