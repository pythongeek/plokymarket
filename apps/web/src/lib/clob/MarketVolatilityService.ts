import { createClient } from '@supabase/supabase-js';

export interface TickConfig {
    minTick: bigint;
    maxTick: bigint;
    currentTick: bigint;
}

export class MarketVolatilityService {
    private static _supabase: any = null;

    private static get supabase() {
        if (!this._supabase) {
            this._supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
                process.env.SUPABASE_SERVICE_ROLE_KEY || 'service-role-key'
            );
        }
        return this._supabase;
    }

    /**
     * Calculates the annualized realized volatility based on 24h trade history.
     * Uses the standard deviation of log returns.
     */
    static async calculate24hRealizedVolatility(marketId: string): Promise<number> {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const { data: trades, error } = await this.supabase
            .from('trades')
            .select('price')
            .eq('market_id', marketId)
            .gte('created_at', twentyFourHoursAgo)
            .order('created_at', { ascending: true });

        if (error || !trades || trades.length < 2) {
            return 0.02; // Default 2% volatility if insufficient data
        }

        const prices = trades.map((t: { price: any }) => Number(t.price));
        const logReturns: number[] = [];

        for (let i = 1; i < prices.length; i++) {
            logReturns.push(Math.log(prices[i] / prices[i - 1]));
        }

        const mean = logReturns.reduce((a, b) => a + b, 0) / logReturns.length;
        const variance = logReturns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / logReturns.length;
        const dailyStdDev = Math.sqrt(variance);

        // Annualize (sqrt(365) for crypto/continuous, sqrt(252) for stocks)
        // Platform is continuous, so using 365.
        return dailyStdDev * Math.sqrt(365);
    }

    /**
     * Implementation of the adaptive tick sizing logic.
     * Target: 100 ticks within 2σ of daily volatility.
     */
    static calculateAdaptiveTickSize(
        volatility: number,
        currentPrice: bigint,
        minTick: bigint,
        maxTick: bigint
    ): bigint {
        const dailyVol = volatility / Math.sqrt(365);

        // twoSigmaRange = currentPrice * (dailyVol * 2)
        // Using 1e6 scaling for precision in math
        const twoSigmaRange = (currentPrice * BigInt(Math.floor(dailyVol * 2 * 1000000))) / 1000000n;

        // Target 100 ticks within that range
        const targetTick = twoSigmaRange / 100n;

        if (targetTick < minTick) return minTick;
        if (targetTick > maxTick) return maxTick;

        // Round to nearest human-readable increment? 
        // For now, let's keep it as targetTick but bounded.
        return targetTick;
    }

    /**
     * Checks if emergency widening is required.
     * Trigged if current volatility > 50% above the 24h mean.
     */
    static isEmergencyWideningRequired(currentVol: number, meanVol: number): boolean {
        return currentVol > meanVol * 1.5;
    }
}
