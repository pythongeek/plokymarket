/**
 * ============================================================
 * UNIFIED EVENT TYPES
 * Bridges database schema with UI requirements
 * ============================================================
 * 
 * This file provides a unified type system that:
 * 1. Extends the raw Supabase database row type
 * 2. Adds UI-friendly field aliases (endDate, startDate, etc.)
 * 3. Adds computed fields (is_active, markets, etc.)
 * 4. Provides mapping functions for type safety
 */

import { Database } from './database.types';

// ============================================================
// RAW DATABASE TYPES
// ============================================================

/** Raw event from Supabase database - auto-generated from schema */
export type RawEvent = Database['public']['Tables']['events']['Row'];

/** Alias for RawEvent - Database Event */
export type DBEvent = RawEvent;

/** Raw market from Supabase database */
export type RawMarket = Database['public']['Tables']['markets']['Row'];

// ============================================================
// UNIFIED EVENT TYPE
// ============================================================

/**
 * UnifiedEvent extends the raw database row with UI-friendly aliases
 * and computed fields. This is the primary type for UI components.
 * 
 * Note: We use type intersection to avoid name conflicts with RawEvent
 */
export type UnifiedEvent = RawEvent & {
    // ─────────────────────────────────────────────────────────
    // UI ALIASES - Field names that UI components expect
    // ─────────────────────────────────────────────────────────

    /** Alias for ends_at */
    endDate?: string | null;

    /** Alias for starts_at */
    startDate?: string | null;

    /** Alias for resolves_at */
    resolutionDate?: string | null;

    // ─────────────────────────────────────────────────────────
    // COMPUTED/DERIVED FIELDS - Not in DB, computed at runtime
    // ─────────────────────────────────────────────────────────

    /** Whether the event is currently active for trading */
    is_active?: boolean;

    /** Associated markets (when using join queries) */
    markets?: RawMarket[] | null;

    /** Market count (from RPC or computed) */
    market_count?: number | null;

    /** Resolver reference (from RPC or joined data) */
    resolver_reference?: string | null;

    /** Formatted status for display */
    statusCategory?: string;

    /** Volume formatted for display */
    volumeFormatted?: string;

    /** Time remaining until end */
    timeRemaining?: string;

    // ─────────────────────────────────────────────────────────
    // COMPATIBILITY FIELDS - For backward compatibility
    // ─────────────────────────────────────────────────────────

    /** Alias for total_volume for components expecting this field */
    volume?: number;

    /** Trading status enum (for components expecting this) */
    trading_status?: RawEvent['status'];

    /** Creator username (if joined with user_profiles) */
    creator_username?: string | null;

    /** Category name (if joined with categories) */
    category_name?: string | null;
};

// ============================================================
// UNIFIED MARKET TYPE
// ============================================================

/**
 * UnifiedMarket extends the raw database row with UI-friendly aliases
 */
export type UnifiedMarket = RawMarket & {
    // UI Aliases
    endDate?: string | null;
    startDate?: string | null;
    resolutionDate?: string | null;

    // Computed fields
    is_active?: boolean;

    // Price display helpers - map from DB field names
    yesPrice?: number | null;
    noPrice?: number | null;
};

// ============================================================
// TYPE MAPPING FUNCTIONS
// ============================================================

/**
 * Maps a raw database event to a UnifiedEvent with defaults for nullable fields
 * and computed UI-friendly properties
 */
export function toUnifiedEvent(raw: RawEvent): UnifiedEvent {
    const now = new Date().toISOString();
    const endsAt = raw.ends_at ?? raw.resolves_at ?? null;
    const startsAt = raw.starts_at ?? null;

    // Determine if active based on status and dates
    const isActive = raw.status === 'active' &&
        (!endsAt || new Date(endsAt) > new Date(now));

    // Calculate time remaining
    let timeRemaining: string | undefined;
    if (endsAt && new Date(endsAt) > new Date(now)) {
        const diff = new Date(endsAt).getTime() - new Date(now).getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) {
            timeRemaining = `${days}d ${hours}h`;
        } else if (hours > 0) {
            timeRemaining = `${hours}h ${minutes}m`;
        } else {
            timeRemaining = `${minutes}m`;
        }
    }

    // Format volume for display
    const volumeFormatted = raw.total_volume !== null
        ? formatVolume(raw.total_volume)
        : '৳0';

    return {
        ...raw,
        // UI Aliases
        endDate: endsAt,
        startDate: startsAt,
        resolutionDate: raw.resolves_at ?? raw.resolved_at ?? null,

        // Computed fields
        is_active: isActive,
        markets: null,
        market_count: null,
        resolver_reference: null,
        statusCategory: raw.status,
        volumeFormatted,
        timeRemaining,

        // Add is_trending computed from volume threshold
        is_trending: raw.is_trending ?? (raw.total_volume ?? 0) > 1000,

        // Volume alias for backward compatibility
        volume: raw.total_volume ?? 0,

        // Trading status compatibility
        trading_status: raw.status as any,
    };
}

/**
 * Helper function to format volume numbers for Bangladeshi Taka (BDT)
 */
function formatVolume(volume: number): string {
    if (volume >= 10000000) {
        return `৳${(volume / 10000000).toFixed(1)}Cr`;
    } else if (volume >= 100000) {
        return `৳${(volume / 100000).toFixed(1)}L`;
    } else if (volume >= 1000) {
        return `৳${(volume / 1000).toFixed(1)}K`;
    }
    return `৳${volume}`;
}

/**
 * Maps an array of raw events to UnifiedEvent
 */
export function toUnifiedEvents(rawEvents: RawEvent[]): UnifiedEvent[] {
    return rawEvents.map(toUnifiedEvent);
}

// ============================================================
// GENERIC TYPE MAPPER / ADAPTER
// Automatically fills missing fields with null/defaults
// ============================================================

/**
 * Generic Event-like type for mapping
 */
interface EventLike {
    id?: string;
    title?: string;
    name?: string;
    question?: string;
    description?: string;
    slug?: string;
    category?: string;
    subcategory?: string;
    tags?: string[];
    image_url?: string;
    status?: string;
    trading_closes_at?: string;
    ends_at?: string;
    starts_at?: string;
    resolves_at?: string;
    created_at?: string;
    updated_at?: string;
    created_by?: string;
    is_featured?: boolean;
    total_volume?: number;
    [key: string]: unknown;
}

/**
 * AI-powered Type Mapper: Automatically converts any Event-like object to UnifiedEvent
 * by filling missing fields with null or default values
 * Uses type assertion for flexibility with different event schemas
 */
export function mapToUnifiedEvent<T extends EventLike>(event: T): UnifiedEvent {
    const now = new Date().toISOString();
    const endsAt = event.ends_at ?? event.trading_closes_at ?? null;
    const startsAt = event.starts_at ?? null;

    // Determine if active based on status and dates
    const isActive = event.status === 'active' &&
        (!endsAt || new Date(endsAt) > new Date(now));

    // Calculate time remaining
    let timeRemaining: string | undefined;
    if (endsAt && new Date(endsAt) > new Date(now)) {
        const diff = new Date(endsAt).getTime() - new Date(now).getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) {
            timeRemaining = `${days}d ${hours}h`;
        } else if (hours > 0) {
            timeRemaining = `${hours}h ${minutes}m`;
        } else {
            timeRemaining = `${minutes}m`;
        }
    }

    // Format volume for display
    const volumeFormatted = event.total_volume !== undefined
        ? formatVolume(event.total_volume)
        : '৳0';

    // Build the mapped event object
    const mappedEvent = {
        // Required fields - use event values or defaults
        id: event.id ?? `temp-${Date.now()}`,
        slug: event.slug ?? event.id ?? `temp-${Date.now()}`,

        // Core Identity
        name: event.name ?? event.title ?? 'Untitled Event',
        title: event.title ?? event.name ?? 'Untitled Event',
        question: event.question ?? '',
        description: event.description ?? null,
        ticker: null,

        // Category & Metadata
        category: event.category ?? 'general',
        subcategory: event.subcategory ?? null,
        tags: event.tags ?? [],

        // Visual Assets
        image_url: event.image_url ?? null,
        thumbnail_url: null,
        banner_url: null,

        // Status & Visibility
        status: (event.status as UnifiedEvent['status']) ?? 'pending',
        is_verified: false,
        is_featured: event.is_featured ?? false,
        is_trending: false,

        // Answer Options
        answer1: 'হ্যাঁ (Yes)',
        answer2: 'না (No)',
        answer_type: 'binary',

        // Time Management
        starts_at: startsAt ?? now,
        ends_at: endsAt,
        trading_opens_at: null,
        trading_closes_at: event.trading_closes_at ?? endsAt,
        resolved_at: null,
        closed_time: null,

        // Resolution Configuration
        resolution_method: 'manual',
        resolution_delay: 24,
        resolution_delay_hours: 24,
        resolution_source: null,
        resolved_outcome: null,
        resolved_by: null,
        winning_token: null,

        // Pause Control
        trading_status: 'trading' as const,
        pause_reason: null,
        paused_at: null,
        paused_by: null,

        // Volume & Liquidity
        total_volume: event.total_volume ?? 0,
        liquidity: 0,

        // Creator & Dates
        created_by: event.created_by ?? null,
        created_at: event.created_at ?? now,
        updated_at: event.updated_at ?? now,

        // AI Fields
        ai_confidence_threshold: null,
        ai_keywords: null,
        ai_sources: null,

        // UI Aliases
        endDate: endsAt,
        startDate: startsAt,
        resolutionDate: event.resolves_at ?? null,

        // Computed fields
        is_active: isActive,
        markets: null,
        market_count: null,
        resolver_reference: null,
        statusCategory: event.status ?? 'pending',
        volumeFormatted,
        timeRemaining,

        // Volume alias for backward compatibility
        volume: event.total_volume ?? 0,

        // Creator username (if available)
        creator_username: null,
        category_name: null,
    };

    // Return as UnifiedEvent using type assertion
    return mappedEvent as unknown as UnifiedEvent;
}

/**
 * Maps an array of any Event-like objects to UnifiedEvent[]
 */
export function mapToUnifiedEvents<T extends EventLike>(events: T[]): UnifiedEvent[] {
    return events.map(mapToUnifiedEvent);
}

/**
 * Maps a raw market to UnifiedMarket
 */
export function toUnifiedMarket(raw: RawMarket): UnifiedMarket {
    const now = new Date().toISOString();
    const endsAt = raw.trading_closes_at ?? raw.event_date ?? null;
    const isActive = raw.status === 'active' &&
        (!endsAt || new Date(endsAt) > new Date(now));

    return {
        ...raw,
        endDate: endsAt,
        startDate: raw.event_date,
        resolutionDate: null,
        is_active: isActive,
        // Markets table uses 'no_price' not 'current_no_price'
        yesPrice: raw.best_bid ?? null,
        noPrice: raw.no_price ?? null,
    };
}

// ============================================================
// TYPE GUARDS
// ============================================================

/**
 * Type guard to check if an object is a valid UnifiedEvent
 */
export function isUnifiedEvent(obj: unknown): obj is UnifiedEvent {
    if (!obj || typeof obj !== 'object') return false;
    const event = obj as Record<string, unknown>;
    return typeof event.id === 'string' && typeof event.status === 'string';
}

/**
 * Type guard to check if an object is a valid RawEvent from Supabase
 */
export function isRawEvent(obj: unknown): obj is RawEvent {
    if (!obj || typeof obj !== 'object') return false;
    const event = obj as Record<string, unknown>;
    return typeof event.id === 'string' && typeof event.title === 'string';
}

// ============================================================
// DEFAULT VALUES
// ============================================================

/**
 * Creates a default empty event for form initialization
 */
export function createEmptyEvent(): Partial<UnifiedEvent> {
    return {
        id: '',
        title: '',
        slug: '',
        question: '',
        description: '',
        category: '',
        status: 'draft',
        ends_at: null,
        starts_at: null,
        trading_opens_at: null,
        trading_closes_at: null,

        // Computed defaults
        is_active: false,
        total_volume: 0,
        current_liquidity: 0,

        // Aliases
        endDate: null,
        startDate: null,
        resolutionDate: null,
    };
}

// ============================================================
// UNIFIED WORKFLOW TYPES
// ============================================================

/**
 * UnifiedWorkflow extends VerificationWorkflow with UI-friendly fields
 * and computed properties.
 */
export type UnifiedWorkflow = import('./database').VerificationWorkflow & {
    // UI Computed fields
    isActive?: boolean;
    statusLabel?: string;
    lastRunFormatted?: string;
    nextRunFormatted?: string;
    executionCount?: number;
    successRate?: number;
};

/**
 * UnifiedWorkflowExecution extends WorkflowExecution with UI-friendly fields
 */
export type UnifiedWorkflowExecution = import('./database').WorkflowExecution & {
    // UI Computed fields
    duration?: number; // in seconds
    statusColor?: string;
    statusLabel?: string;
    resultSummary?: string;
    formattedStartTime?: string;
    formattedEndTime?: string;
};

/**
 * UnifiedWorkflowStats extends WorkflowStats with formatted display fields
 */
export type UnifiedWorkflowStats = import('./database').WorkflowStats & {
    // UI Formatted fields
    totalExecutionsFormatted?: string;
    successRateFormatted?: string;
    averageExecutionTimeFormatted?: string;
};

// ============================================================
// UNIFIED PLATFORM SETTINGS
// ============================================================

/**
 * UnifiedPlatformSettings extends PlatformSettings with typed value
 */
export type UnifiedPlatformSettings = import('./database').PlatformSettings & {
    // Computed/typed fields
    valueAsBoolean?: boolean;
    valueAsString?: string;
    valueAsNumber?: number;
    isPaused?: boolean;
};

// ============================================================
// TYPE MAPPING FUNCTIONS
// ============================================================

/**
 * Maps raw workflow to UnifiedWorkflow
 */
export function toUnifiedWorkflow(raw: import('./database').VerificationWorkflow): UnifiedWorkflow {
    return {
        ...raw,
        isActive: raw.is_active,
        statusLabel: raw.is_active ? 'Active' : 'Inactive',
    };
}

/**
 * Maps raw workflow execution to UnifiedWorkflowExecution
 */
export function toUnifiedWorkflowExecution(raw: import('./database').WorkflowExecution): UnifiedWorkflowExecution {
    let duration: number | undefined;
    if (raw.started_at && raw.completed_at) {
        duration = (new Date(raw.completed_at).getTime() - new Date(raw.started_at).getTime()) / 1000;
    }

    let statusColor = 'gray';
    switch (raw.status) {
        case 'completed': statusColor = 'green'; break;
        case 'failed': statusColor = 'red'; break;
        case 'running': statusColor = 'blue'; break;
        case 'pending': statusColor = 'yellow'; break;
        case 'escalated': statusColor = 'orange'; break;
    }

    return {
        ...raw,
        duration,
        statusColor,
        statusLabel: raw.status,
    };
}

// ============================================================
// RE-EXPORTS FOR CONVENIENCE
// ============================================================

// Export Database type for use in other modules
export type { Database } from './database.types';

// Re-export database types that are used as base for unified types
export type {
    VerificationWorkflow,
    WorkflowExecution,
    WorkflowSchedule,
    WorkflowStats,
    WorkflowAnalyticsDaily,
    PlatformSettings
} from './database';

// ============================================================
// BACKWARD COMPATIBILITY ALIASES
// ============================================================
// These aliases allow gradual migration from old types to unified types

/** @deprecated Use UnifiedEvent instead */
export type Event = UnifiedEvent;

/** @deprecated Use UnifiedMarket instead */
export type Market = UnifiedMarket;

/** @deprecated Use UnifiedWorkflow instead */
export type Workflow = UnifiedWorkflow;

/** @deprecated Use UnifiedWorkflowExecution instead */
export type Execution = UnifiedWorkflowExecution;

/** @deprecated Use UnifiedPlatformSettings instead */
export type Settings = UnifiedPlatformSettings;
