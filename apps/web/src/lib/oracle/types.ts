export type ResolutionStrategyType = 'AI' | 'ADMIN' | 'API' | 'UMA' | 'MANUAL' | 'CENTRALIZED';

export interface OracleRequest {
    id: string;
    market_id: string;
    request_type: 'initial' | 'dispute' | 'confirmation';

    proposer_id?: string;
    proposed_outcome?: string;
    confidence_score?: number;
    evidence_text?: string;
    evidence_urls?: string[];
    ai_analysis?: any;

    // Optimistic fields
    bond_amount: number;
    bond_currency: string;
    challenge_window_ends_at?: string;

    status: 'pending' | 'proposed' | 'challenged' | 'disputed' | 'resolved' | 'finalized' | 'failed';

    created_at: string;
    updated_at: string;
    processed_at?: string;
    resolved_at?: string;
    finalized_at?: string;
}

export interface OracleEvidence {
    summary: string;
    urls: string[];
    confidence: number;
    aiAnalysis?: any;
}

export interface IResolutionStrategy {
    resolve(marketId: string, marketQuestion: string, context?: any): Promise<{
        outcome: string;
        evidence: OracleEvidence;
        bondAmount?: number; // Optional suggested bond
    }>;
}
