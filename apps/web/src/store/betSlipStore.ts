import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BetSlipItem {
    id: string;
    marketId: string;
    marketTitle: string;
    outcome: string; // YES, NO, or custom outcome name
    side: 'buy' | 'sell';
    price: number;
    quantity: number;
    orderType: 'limit' | 'market';
}

interface BetSlipStore {
    items: BetSlipItem[];
    addItem: (item: Omit<BetSlipItem, 'id'>) => void;
    removeItem: (id: string) => void;
    updateItem: (id: string, patch: Partial<BetSlipItem>) => void;
    clearAll: () => void;
    getTotalCost: () => number;
}

export const useBetSlipStore = create<BetSlipStore>()(
    persist(
        (set, get) => ({
            items: [],
            addItem: (item) => {
                const id = Math.random().toString(36).substring(2, 9);
                set((state) => ({
                    items: [...state.items, { ...item, id }],
                }));
            },
            removeItem: (id) => set((state) => ({
                items: state.items.filter((i) => i.id !== id),
            })),
            updateItem: (id, patch) => set((state) => ({
                items: state.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
            })),
            clearAll: () => set({ items: [] }),
            getTotalCost: () => {
                return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
            },
        }),
        {
            name: 'bet-slip-storage',
        }
    )
);
