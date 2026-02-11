
import { createClient } from '@/lib/supabase/server';

export class SettlementEngine {
    constructor() { }

    /**
     * Processes the settlement for a resolved market.
     * Calls the atomic settle_market DB function which:
     * - Credits winners ($1.00 per winning share minus fees)
     * - Creates settlement claims
     * - Unlocks LP liquidity
     * - Cancels remaining open orders
     * - Updates market status to 'settled'
     */
    async processMarket(marketId: string, winningOutcome: string): Promise<{
        totalClaims: number;
        totalPayout: number;
        totalFees: number;
        batchId: string;
    }> {
        console.log(`[SettlementEngine] Processing market ${marketId} for outcome "${winningOutcome}"`);

        const supabase = await createClient();

        // Call the atomic DB function
        const { data, error } = await supabase.rpc('settle_market', {
            p_market_id: marketId,
        });

        if (error) {
            console.error(`[SettlementEngine] Settlement failed for market ${marketId}:`, error);
            throw new Error(`Settlement failed: ${error.message}`);
        }

        const result = data as any;

        console.log(`[SettlementEngine] Settlement completed:`, {
            marketId,
            totalClaims: result.total_claims,
            totalPayout: result.total_payout,
            totalFees: result.total_fees,
            batchId: result.batch_id,
        });

        return {
            totalClaims: result.total_claims,
            totalPayout: result.total_payout,
            totalFees: result.total_fees,
            batchId: result.batch_id,
        };
    }

    /**
     * Get settlement status for a market
     */
    async getSettlementStatus(marketId: string) {
        const supabase = await createClient();

        const [claimsResult, batchResult] = await Promise.all([
            supabase
                .from('settlement_claims')
                .select('*')
                .eq('market_id', marketId),
            supabase
                .from('settlement_batches')
                .select('*')
                .eq('market_id', marketId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single(),
        ]);

        return {
            claims: claimsResult.data || [],
            batch: batchResult.data,
        };
    }
}
