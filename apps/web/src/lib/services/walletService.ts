import { createClient } from '@/lib/supabase/server';

export interface Wallet {
    id?: string;
    user_id: string;
    balance: number;
    locked_balance: number;
    available_balance: number;
    currency: string;
}

export interface Transaction {
    id: string;
    user_id: string;
    transaction_type: 'deposit' | 'withdrawal' | 'trade' | 'settlement' | 'fee' | 'dispute_bond';
    amount: number;
    currency: string;
    status: string;
    description: string;
    created_at: string;
    metadata?: any;
}

export class WalletService {
    async getWallet(userId: string): Promise<Wallet | null> {
        const supabase = await createClient();

        const { data: wallet, error } = await supabase
            .from('wallets')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code !== 'PGRST116') { // PGRST116 is 'no rows returned'
                console.error('[WalletService] getWallet error:', error.message);
            }
            return null;
        }

        if (!wallet) return null;

        return {
            ...wallet,
            locked_balance: wallet.locked_balance ?? 0,
            available_balance: wallet.balance - (wallet.locked_balance ?? 0),
            currency: 'BDT' // Default currency as per migrations
        };
    }

    async getTransactions(userId: string, limit = 50): Promise<Transaction[]> {
        const supabase = await createClient();

        const { data: transactions, error } = await supabase
            .from('wallet_transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('[WalletService] getTransactions error:', error.message);
        }

        return (transactions as Transaction[]) || [];
    }

    async getBalance(userId: string): Promise<{ balance: number; locked: number; available: number }> {
        const wallet = await this.getWallet(userId);

        if (!wallet) {
            return { balance: 0, locked: 0, available: 0 };
        }

        return {
            balance: wallet.balance,
            locked: wallet.locked_balance,
            available: wallet.available_balance
        };
    }
}

export const walletService = new WalletService();
