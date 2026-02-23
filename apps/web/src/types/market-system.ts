/**
 * Core interfaces for the Event and Market creation system.
 * This blueprint acts as a safeguard to ensure logic consistency
 * across the new Service Layer Architecture.
 */

export type ResolutionMethod = 'manual_admin' | 'ai_oracle' | 'expert_panel' | 'community_vote';

export interface ResolutionConfig {
    method: ResolutionMethod;
    ai_keywords?: string[];
    confidence_threshold?: number;
    resolver_address?: string;
}

export type EventStatus = 'pending' | 'active' | 'resolved' | 'cancelled';
export type MarketStatus = 'pending' | 'active' | 'resolved' | 'cancelled';

export interface Event {
    id: string;
    title: string;
    slug?: string;
    description?: string;
    status: EventStatus;
    starts_at?: string;
    ends_at: string;
    category?: string;
    created_at?: string;
    updated_at?: string;
    total_volume?: number;
    question?: string;
    image_url?: string;
    created_by?: string;
}

export interface Market {
    id: string;
    event_id: string;
    question: string;
    description?: string;
    category?: string;
    status: MarketStatus;
    trading_closes_at: string;
    event_date?: string;
    resolution_source?: string;
    resolution_source_type?: string;
    resolution_data?: any;
    image_url?: string;
    creator_id?: string;
    created_at?: string;
    updated_at?: string;
    total_volume?: number;
}

/**
 * Service to handle Market-related operations ensuring transactional safety
 * and proper liquidity seeding.
 */
export interface IMarketService {
    /**
     * Creates a market and immediately seeds the initial orderbook
     * to provide instant liquidity.
     * 
     * @param eventId The ID of the event this market belongs to
     * @param marketData Data for the new market
     * @param initialLiquidity Amount of liquidity to seed
     */
    createMarketWithLiquidity(
        eventId: string,
        marketData: Partial<Market>,
        initialLiquidity: number
    ): Promise<Market>;

    /**
     * Seeds the initial order book with YES and NO limit orders.
     */
    initializeOrderbook(marketId: string): Promise<void>;
}

/**
 * Service to handle Event-related operations.
 */
export interface IEventService {
    createEvent(eventData: Partial<Event>): Promise<Event>;
}
