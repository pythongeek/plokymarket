import { createClient } from '@supabase/supabase-js';
import { Market, IMarketService } from '@/types/market-system';

/**
 * Supabase Admin client generator for backend operations.
 * Bypasses RLS for system-level actions like seeding liquidity.
 */
const getSupabaseAdmin = () => {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;

    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        }
    });
};

/**
 * Service to handle Market-related operations and atomic order placement.
 * Connects directly to the Domain Matching Engine and Database.
 */
export class MarketService implements IMarketService {
    /**
     * Required step: Creates a market and immediately seeds the initial orderbook.
     * This is the entry point for the "One-Shot" market creation flow.
     */
    async createMarketWithLiquidity(
        eventId: string,
        marketData: Partial<Market>,
        initialLiquidity: number
    ): Promise<Market> {
        console.log(`[MarketService] Creating market for event ${eventId} with ${initialLiquidity} liquidity...`);

        try {
            // 1. Create the market in the database
            const { data: newMarket, error: marketError } = await getSupabaseAdmin()
                .from('markets')
                .insert({
                    ...marketData,
                    event_id: eventId,
                    status: marketData.status || 'active',
                })
                .select()
                .single();

            if (marketError) {
                console.error('[MarketService] Error creating market:', marketError);
                throw new Error(`Failed to create market: ${marketError.message}`);
            }

            console.log(`[MarketService] Market created: ${newMarket.id} (${newMarket.status})`);

            // 1.5: Sync resolution_config into resolution_systems table
            const resConfig = marketData.resolution_data?.resolution_config;
            if (resConfig) {
                const primaryMethod = resConfig.method || 'manual_admin';
                const aiKeywords = resConfig.ai_keywords || [];
                const confidenceThreshold = resConfig.confidence_threshold || 85;

                const { error: resSysError } = await getSupabaseAdmin()
                    .from('resolution_systems')
                    .insert({
                        event_id: eventId, // FIXED: Use the eventId parameter, not market.id
                        primary_method: primaryMethod,
                        ai_keywords: aiKeywords,
                        confidence_threshold: confidenceThreshold,
                        status: 'pending'
                    });

                if (resSysError) {
                    console.error('[MarketService] Failed to create resolution_systems entry:', resSysError);
                    // Continuing since market was successfully created, but logging the error.
                }
            }

            // 2. Automically initialize orderbook if status is active
            if (newMarket.status === 'active') {
                await this.initializeOrderbook(newMarket.id);
            }

            return newMarket as Market;
        } catch (err: any) {
            console.error('[MarketService] createMarketWithLiquidity failed:', err);
            throw err;
        }
    }

    /**
     * Seeds the initial order book with YES and NO limit orders to ensure instant tradability.
     * Strategy: Place YES at 0.48 and NO at 0.48 (Buy Bids).
     * Total Seeding: 200 units (100 YES, 100 NO).
     */
    public async initializeOrderbook(marketId: string, initialLiquidity: number = 100): Promise<void> {
        console.log(`[MarketService] Initializing ${initialLiquidity * 2} seed orders for market ${marketId}...`);

        try {
            // Fetch a system/admin user to act as the AMM
            const { data: users, error: userError } = await getSupabaseAdmin()
                .from('user_profiles')
                .select('id')
                .eq('is_admin', true)
                .limit(1);

            let systemUserId: string | undefined;

            if (userError || !users || users.length === 0) {
                console.warn('[MarketService] No admin user found in user_profiles. Checking auth.users...');
                const { data: authUsers } = await (getSupabaseAdmin().from('user_profiles').select('id').limit(1) as any);
                systemUserId = authUsers?.[0]?.id;
            } else {
                systemUserId = users[0].id;
            }

            if (!systemUserId) {
                throw new Error('System user not found for liquidity seeding.');
            }

            // Strategy: 0.48 YES Bid, 0.48 NO Bid (Total 0.96, 4% Platform Spread)
            const initialOrders = [
                {
                    market_id: marketId,
                    user_id: systemUserId,
                    side: 'buy',
                    outcome: 'YES',
                    price: 0.48,
                    quantity: initialLiquidity,
                    filled_quantity: 0,
                    status: 'open',
                    order_type: 'limit'
                },
                {
                    market_id: marketId,
                    user_id: systemUserId,
                    side: 'buy',
                    outcome: 'NO',
                    price: 0.48,
                    quantity: initialLiquidity,
                    filled_quantity: 0,
                    status: 'open',
                    order_type: 'limit'
                }
            ];

            const { error: seedError } = await getSupabaseAdmin()
                .from('orders')
                .insert(initialOrders);

            if (seedError) {
                console.error('[MarketService] Seeding failed:', seedError);
                // Non-fatal for the creation flow, but logged as critical error
            } else {
                console.log(`[MarketService] Seeding COMPLETE: ${initialLiquidity} YES @ 0.48, ${initialLiquidity} NO @ 0.48 (${initialLiquidity * 2} units total)`);
            }
        } catch (err: any) {
            console.error('[MarketService] Unexpected seeding error:', err);
        }
    }

    /**
     * Updates an existing market and captures state transitions to active.
     */
    async updateMarketState(marketId: string, updates: Partial<Market>): Promise<Market> {
        try {
            const { data: oldMarket } = await getSupabaseAdmin()
                .from('markets')
                .select('status')
                .eq('id', marketId)
                .single();

            const { data: updatedMarket, error } = await getSupabaseAdmin()
                .from('markets')
                .update(updates)
                .eq('id', marketId)
                .select()
                .single();

            if (error) throw new Error(error.message);

            // Trigger seeding on activation
            if (oldMarket?.status !== 'active' && updatedMarket.status === 'active') {
                await this.initializeOrderbook(marketId);
            }

            return updatedMarket as Market;
        } catch (err: any) {
            console.error("[MarketService] Failed to update market status:", err);
            throw err;
        }
    }
}

export const marketService = new MarketService();
