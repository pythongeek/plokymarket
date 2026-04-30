// @ts-nocheck
import { createClient } from '@/lib/supabase/server';

export interface MakerVolume {
    id: string;
    user_id: string;
    year_month: string;
    maker_volume: number;
    taker_volume: number;
    total_spread_contribution: number;
    resting_time_seconds: number;
    qualifying_volume: number;
    rebate_tier: number;
    rebate_rate: number;
    estimated_rebate: number;
    claimed_rebate: number;
    last_updated: string;
    created_at: string;
}

export interface MakerRebate {
    id: string;
    user_id: string;
    year_month: string;
    rebate_period_start: string;
    rebate_period_end: string;
    total_maker_volume: number;
    qualifying_volume: number;
    base_rebate_rate: number;
    spread_multiplier: number;
    final_rebate_rate: number;
    gross_rebate_amount: number;
    adjustment_factor: number;
    net_rebate_amount: number;
    claim_status: 'pending' | 'claimed' | 'processing' | 'paid' | 'expired';
    claimed_at: string | null;
    claimed_by_user_id: string | null;
    payment_method: 'USDC' | 'PLATFORM' | null;
    payment_tx_hash: string | null;
    payment_completed_at: string | null;
    tier_at_calculation: number;
    tier_benefits: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface RebateTier {
    id: number;
    tier_name: string;
    min_volume: number;
    max_volume: number | null;
    rebate_rate: number;
    min_spread: number;
    benefits: Record<string, any>;
    is_active: boolean;
}

export interface SpreadReward {
    id: string;
    user_id: string;
    market_id: string;
    calculation_date: string;
    avg_spread_7d: number;
    min_spread: number;
    max_spread: number;
    spread_percentile: number;
    spread_tier: 'elite' | 'tight' | 'standard' | 'wide';
    base_multiplier: number;
    size_multiplier: number;
    final_multiplier: number;
    meets_min_size: boolean;
    avg_order_size: number;
    bonus_amount: number;
    applied_to_rebate_id: string | null;
    created_at: string;
}

export interface RebateSummary {
    currentTier: RebateTier | null;
    currentVolume: MakerVolume | null;
    nextTier: RebateTier | null;
    volumeToNextTier: number | null;
    estimatedRebate: number;
    claimableRebates: MakerRebate[];
    historicalRebates: MakerRebate[];
    spreadRewards: SpreadReward[];
}

export class RebateService {
    /**
     * Get the current month's volume tracking for a user
     */
    async getCurrentVolume(userId: string): Promise<MakerVolume | null> {
        const supabase = await createClient();
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

        const { data, error } = await supabase
            .from('maker_volume_tracking')
            .select('*')
            .eq('user_id', userId)
            .eq('year_month', currentMonth)
            .single();

        if (error) {
            if (error.code !== 'PGRST116') {
                console.error('[RebateService] getCurrentVolume error:', error.message);
            }
            return null;
        }

        return data;
    }

    /**
     * Get all rebate tiers configuration
     */
    async getRebateTiers(): Promise<RebateTier[]> {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('rebate_tiers_config')
            .select('*')
            .eq('is_active', true)
            .order('id', { ascending: true });

        if (error) {
            console.error('[RebateService] getRebateTiers error:', error.message);
            return [];
        }

        return data || [];
    }

    /**
     * Get the current tier information for a user
     */
    async getCurrentTier(tierId: number): Promise<RebateTier | null> {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('rebate_tiers_config')
            .select('*')
            .eq('id', tierId)
            .single();

        if (error) {
            console.error('[RebateService] getCurrentTier error:', error.message);
            return null;
        }

        return data;
    }

    /**
     * Get claimable rebates (pending status)
     */
    async getClaimableRebates(userId: string): Promise<MakerRebate[]> {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('maker_rebates')
            .select('*')
            .eq('user_id', userId)
            .eq('claim_status', 'pending')
            .order('year_month', { ascending: false });

        if (error) {
            console.error('[RebateService] getClaimableRebates error:', error.message);
            return [];
        }

        return data || [];
    }

    /**
     * Get historical rebates
     */
    async getHistoricalRebates(userId: string, limit = 12): Promise<MakerRebate[]> {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('maker_rebates')
            .select('*')
            .eq('user_id', userId)
            .in('claim_status', ['claimed', 'processing', 'paid'])
            .order('year_month', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('[RebateService] getHistoricalRebates error:', error.message);
            return [];
        }

        return data || [];
    }

    /**
     * Get spread rewards for a user
     */
    async getSpreadRewards(userId: string, limit = 30): Promise<SpreadReward[]> {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('spread_rewards')
            .select('*')
            .eq('user_id', userId)
            .order('calculation_date', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('[RebateService] getSpreadRewards error:', error.message);
            return [];
        }

        return data || [];
    }

    /**
     * Get full rebate summary for a user
     */
    async getRebateSummary(userId: string): Promise<RebateSummary> {
        const [currentVolume, tiers, claimableRebates, historicalRebates, spreadRewards] = await Promise.all([
            this.getCurrentVolume(userId),
            this.getRebateTiers(),
            this.getClaimableRebates(userId),
            this.getHistoricalRebates(userId),
            this.getSpreadRewards(userId)
        ]);

        let currentTier: RebateTier | null = null;
        let nextTier: RebateTier | null = null;
        let volumeToNextTier: number | null = null;

        if (currentVolume && tiers.length > 0) {
            currentTier = tiers.find(t => t.id === currentVolume.rebate_tier) || null;

            // Find next tier
            const currentTierIndex = tiers.findIndex(t => t.id === currentVolume.rebate_tier);
            if (currentTierIndex >= 0 && currentTierIndex < tiers.length - 1) {
                nextTier = tiers[currentTierIndex + 1];
                if (nextTier) {
                    volumeToNextTier = nextTier.min_volume - currentVolume.maker_volume;
                }
            }
        }

        const estimatedRebate = currentVolume?.estimated_rebate || 0;

        return {
            currentTier,
            currentVolume,
            nextTier,
            volumeToNextTier,
            estimatedRebate,
            claimableRebates,
            historicalRebates,
            spreadRewards
        };
    }

    /**
     * Get a specific rebate by ID
     */
    async getRebateById(rebateId: string, userId: string): Promise<MakerRebate | null> {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('maker_rebates')
            .select('*')
            .eq('id', rebateId)
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code !== 'PGRST116') {
                console.error('[RebateService] getRebateById error:', error.message);
            }
            return null;
        }

        return data;
    }

    /**
     * Claim a rebate
     */
    async claimRebate(rebateId: string, userId: string, paymentMethod: 'USDC' | 'PLATFORM' = 'PLATFORM'): Promise<{ success: boolean; error?: string }> {
        const supabase = await createClient();

        try {
            const { data, error } = await supabase.rpc('claim_rebate', {
                p_rebate_id: rebateId,
                p_user_id: userId,
                p_payment_method: paymentMethod
            });

            if (error) {
                console.error('[RebateService] claimRebate RPC error:', error.message);
                return { success: false, error: error.message };
            }

            return { success: true };
        } catch (err: any) {
            console.error('[RebateService] claimRebate error:', err);
            return { success: false, error: err.message || 'Failed to claim rebate' };
        }
    }

    /**
     * Get maker volume history for a user
     */
    async getVolumeHistory(userId: string, months = 6): Promise<MakerVolume[]> {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('maker_volume_tracking')
            .select('*')
            .eq('user_id', userId)
            .order('year_month', { ascending: false })
            .limit(months);

        if (error) {
            console.error('[RebateService] getVolumeHistory error:', error.message);
            return [];
        }

        return data || [];
    }

    /**
     * Get market spread for a specific market
     */
    async getMarketSpread(marketId: string): Promise<number | null> {
        const supabase = await createClient();

        try {
            const { data, error } = await supabase.rpc('calculate_market_spread', {
                p_market_id: marketId
            });

            if (error) {
                console.error('[RebateService] getMarketSpread error:', error.message);
                return null;
            }

            return data;
        } catch (err) {
            console.error('[RebateService] getMarketSpread error:', err);
            return null;
        }
    }
}

export const rebateService = new RebateService();
