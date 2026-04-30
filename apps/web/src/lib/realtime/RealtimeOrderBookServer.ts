// @ts-nocheck
/**
 * RealtimeOrderBookServer - Server-side manager for real-time orderbook updates
 * 
 * This class:
 * - Manages Supabase Realtime channels per market
 * - Hydrates engines from DB on channel subscribe
 * - Broadcasts orderbook deltas using MarketDataPublisher
 * - Handles postgres_changes for order/trade sync
 */

import { createClient } from '@supabase/supabase-js';
import { OrderBookRealtimeEngine, orderBookRealtimeEngine } from './OrderBookRealtimeEngine';
import { SupabaseClient } from '@supabase/supabase-js';

interface ServerConfig {
    supabaseUrl: string;
    serviceRoleKey: string;
}

export class RealtimeOrderBookServer {
    private static instance: RealtimeOrderBookServer;
    
    private adminClient: SupabaseClient | null = null;
    private engine: OrderBookRealtimeEngine;
    private activeChannels: Map<string, any> = new Map();

    private constructor() {
        this.engine = orderBookRealtimeEngine;
    }

    public static getInstance(): RealtimeOrderBookServer {
        if (!RealtimeOrderBookServer.instance) {
            RealtimeOrderBookServer.instance = new RealtimeOrderBookServer();
        }
        return RealtimeOrderBookServer.instance;
    }

    /**
     * Initialize the server with Supabase credentials
     */
    public async initialize(config: ServerConfig): Promise<void> {
        if (this.adminClient) return;

        this.adminClient = createClient(config.supabaseUrl, config.serviceRoleKey, {
            auth: { persistSession: false }
        });

        // Initialize the realtime engine
        await this.engine.initialize();

        console.log('[RealtimeOrderBookServer] Initialized');
    }

    /**
     * Handle a new channel subscription for a market
     * Called when a client subscribes to 'market:{marketId}'
     */
    public async onChannelSubscribe(marketId: string, channel: any): Promise<void> {
        // Check if we already have an active channel for this market
        let existingChannel = this.activeChannels.get(marketId);
        
        if (!existingChannel) {
            // First subscriber for this market - need to hydrate and setup
            await this.setupMarketChannel(marketId);
            existingChannel = this.activeChannels.get(marketId);
        }

        if (existingChannel) {
            // Track subscriber on the channel
            existingChannel.subscribers = (existingChannel.subscribers || 0) + 1;
        }

        console.log(`[RealtimeOrderBookServer] Channel subscribed to ${marketId}`);
    }

    /**
     * Handle channel unsubscribe
     */
    public async onChannelUnsubscribe(marketId: string, channel: any): Promise<void> {
        const existingChannel = this.activeChannels.get(marketId);
        
        if (existingChannel) {
            existingChannel.subscribers = Math.max(0, (existingChannel.subscribers || 1) - 1);
            
            // If no more subscribers, cleanup
            if (existingChannel.subscribers === 0) {
                await this.cleanupMarketChannel(marketId);
            }
        }

        console.log(`[RealtimeOrderBookServer] Channel unsubscribed from ${marketId}`);
    }

    /**
     * Setup channel for a market - hydrate engine and start publishing
     */
    private async setupMarketChannel(marketId: string): Promise<void> {
        if (!this.adminClient) {
            throw new Error('[RealtimeOrderBookServer] Not initialized');
        }

        const supabase = this.adminClient;

        // Create the realtime channel
        const channel = supabase.channel(`market:${marketId}`, {
            config: {
                broadcast: { self: false }, // Don't echo messages back to sender
                presence: { key: marketId }
            }
        });

        // Hydrate the engine from DB
        const engine = await this.engine.hydrateEngine(marketId);
        const publisher = this.engine.getPublisher(marketId);

        if (!publisher) {
            throw new Error(`[RealtimeOrderBookServer] Publisher not found for ${marketId}`);
        }

        // Setup broadcast handlers for ACK
        channel.on('broadcast', { event: 'market:ack' }, ({ payload }: any) => {
            if (payload?.seq) {
                // Handle ACK - could track in publisher
                console.debug(`[RealtimeOrderBookServer] ACK received for seq ${payload.seq}`);
            }
        });

        // Subscribe to the channel
        await channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                console.log(`[RealtimeOrderBookServer] Channel subscribed: market:${marketId}`);
                
                // Start the publisher
                publisher.start();
                
                // Send initial snapshot
                await this.sendSnapshot(marketId, channel);
            } else if (status === 'CHANNEL_ERROR') {
                console.error(`[RealtimeOrderBookServer] Channel error for ${marketId}`);
            }
        });

        this.activeChannels.set(marketId, {
            channel,
            publisher,
            engine,
            subscribers: 1
        });
    }

    /**
     * Send initial snapshot to newly subscribed client
     */
    private async sendSnapshot(marketId: string, channel: any): Promise<void> {
        try {
            const snapshot = await this.engine.getSnapshot(marketId);
            
            channel.send({
                type: 'broadcast',
                event: 'market:snapshot',
                payload: {
                    marketId,
                    bids: snapshot.bids,
                    asks: snapshot.asks,
                    timestamp: snapshot.timestamp
                }
            });
        } catch (err) {
            console.error(`[RealtimeOrderBookServer] Error sending snapshot for ${marketId}:`, err);
        }
    }

    /**
     * Cleanup channel for a market
     */
    private async cleanupMarketChannel(marketId: string): Promise<void> {
        const marketChannel = this.activeChannels.get(marketId);
        
        if (marketChannel) {
            marketChannel.publisher.stop();
            await marketChannel.channel.unsubscribe();
            this.activeChannels.delete(marketId);
            
            // Unsubscribe from the realtime engine
            this.engine.unsubscribe(marketId, marketChannel.channel);
        }

        console.log(`[RealtimeOrderBookServer] Cleaned up channel for ${marketId}`);
    }

    /**
     * Broadcast order update to all subscribers of a market
     * Called after match_order RPC or direct order mutation
     */
    public async broadcastOrderUpdate(marketId: string, order: any): Promise<void> {
        const marketChannel = this.activeChannels.get(marketId);
        
        if (!marketChannel) {
            console.warn(`[RealtimeOrderBookServer] No active channel for ${marketId}`);
            return;
        }

        // Update the engine
        await this.engine.handleOrderUpdate(marketId, order);
    }

    /**
     * Broadcast trade update to all subscribers of a market
     */
    public async broadcastTradeUpdate(marketId: string, trade: any): Promise<void> {
        const marketChannel = this.activeChannels.get(marketId);
        
        if (!marketChannel) {
            console.warn(`[RealtimeOrderBookServer] No active channel for ${marketId}`);
            return;
        }

        // Update the engine
        await this.engine.handleTradeUpdate(marketId, trade);
    }

    /**
     * Get channel for a specific market (for testing/admin)
     */
    public getChannel(marketId: string): any {
        return this.activeChannels.get(marketId)?.channel || null;
    }

    /**
     * Get publisher for a specific market
     */
    public getPublisher(marketId: string): any {
        return this.activeChannels.get(marketId)?.publisher || null;
    }

    /**
     * Check if a market has active subscribers
     */
    public hasSubscribers(marketId: string): boolean {
        const marketChannel = this.activeChannels.get(marketId);
        return (marketChannel?.subscribers || 0) > 0;
    }

    /**
     * Get list of markets with active subscriptions
     */
    public getActiveMarkets(): string[] {
        return Array.from(this.activeChannels.keys()).filter(
            marketId => (this.activeChannels.get(marketId)?.subscribers || 0) > 0
        );
    }

    /**
     * Shutdown server and cleanup all resources
     */
    public async shutdown(): Promise<void> {
        // Cleanup all active channels
        for (const [marketId] of this.activeChannels) {
            await this.cleanupMarketChannel(marketId);
        }

        // Shutdown engine
        await this.engine.shutdown();

        this.adminClient = null;
        console.log('[RealtimeOrderBookServer] Shutdown complete');
    }
}

// Export singleton accessor
export const realtimeOrderBookServer = RealtimeOrderBookServer.getInstance();
