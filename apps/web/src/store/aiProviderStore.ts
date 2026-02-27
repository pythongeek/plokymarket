import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ProviderMode = 'vertex' | 'kimi' | 'combine' | 'race' | 'auto';

interface AIProviderState {
    mode: ProviderMode;
    vertexHealth: number;    // 0-100 health score
    kimiHealth: number;
    activeProvider: 'vertex' | 'kimi' | 'both';
    vertexFailureRate: number;
    kimiFailureRate: number;
    lastRotation: string | null;

    setMode: (mode: ProviderMode) => void;
    recordSuccess: (provider: 'vertex' | 'kimi') => void;
    recordFailure: (provider: 'vertex' | 'kimi') => void;
    autoRotate: () => void;
}

export const useAIProviderStore = create<AIProviderState>()(
    persist(
        (set, get) => ({
            mode: 'combine',
            vertexHealth: 100,
            kimiHealth: 100,
            activeProvider: 'both',
            vertexFailureRate: 0,
            kimiFailureRate: 0,
            lastRotation: null,

            setMode: (mode) => {
                set({ mode });
                get().autoRotate();
            },

            recordSuccess: (provider) => {
                const key = provider === 'vertex' ? 'vertexHealth' : 'kimiHealth';
                set((s) => ({ [key]: Math.min(100, s[key] + 5) }));
            },

            recordFailure: (provider) => {
                const key = provider === 'vertex' ? 'vertexHealth' : 'kimiHealth';
                const failKey = provider === 'vertex' ? 'vertexFailureRate' : 'kimiFailureRate';
                set((s) => ({
                    [key]: Math.max(0, s[key] - 20),
                    [failKey]: s[failKey] + 0.1,
                }));
                get().autoRotate();
            },

            autoRotate: () => {
                const { vertexFailureRate, kimiFailureRate, mode } = get();

                // If mode is forced, activeProvider follows mode
                if (mode === 'vertex') {
                    set({ activeProvider: 'vertex' });
                    return;
                }
                if (mode === 'kimi') {
                    set({ activeProvider: 'kimi' });
                    return;
                }

                // Auto-fallback: if Vertex fails >10%, switch primary to Kimi
                if (vertexFailureRate > 0.1 && kimiFailureRate <= 0.1) {
                    set({ activeProvider: 'kimi', lastRotation: new Date().toISOString() });
                } else if (kimiFailureRate > 0.1 && vertexFailureRate <= 0.1) {
                    set({ activeProvider: 'vertex', lastRotation: new Date().toISOString() });
                } else {
                    set({ activeProvider: 'both' });
                }
            },
        }),
        { name: 'ai-provider-store' }
    )
);
