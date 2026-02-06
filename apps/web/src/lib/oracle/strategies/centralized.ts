import { IResolutionStrategy, OracleEvidence } from '../types';
import { MultiSigWallet } from '../MultiSigWallet';
import { SettlementEngine } from '@/lib/settlement/SettlementEngine';
import { createClient } from '@/lib/supabase/server'; // Use server-side client logic

export class CentralizedOracleStrategy implements IResolutionStrategy {
    private multiSig: MultiSigWallet;
    private settlementEngine: SettlementEngine;

    constructor() {
        this.multiSig = new MultiSigWallet();
        this.settlementEngine = new SettlementEngine();
    }

    async resolve(marketId: string, marketQuestion: string, context?: any): Promise<{ outcome: string; evidence: OracleEvidence; bondAmount?: number }> {
        // Context requires: { signatures: string[], proposedOutcome: string }
        if (!context || !context.signatures || !context.proposedOutcome) {
            throw new Error('Centralized Oracle requires signatures and proposedOutcome in context');
        }

        const { signatures, proposedOutcome } = context;

        // 1. Verify Signatures
        const isValid = await this.multiSig.verifySignatures(marketId, proposedOutcome, signatures);
        if (!isValid) {
            throw new Error('Insufficient valid signatures for centralized resolution');
        }

        // 2. Helper to get Supabase client (assuming we are in a context where we can)
        // Note: 'createClient' usually requires cookie store in Next.js Server Actions/Components.
        // If running in a worker/background, we might need a Service Role client.
        // For this strategy pattern, we'll assume we can use a direct Service Role if needed, 
        // OR we return the result and let the Service layer persist it.
        // HOWEVER, the Prompt description says: "Update market state... Trigger settlement".
        // So this strategy is SIDE-EFFECT heavy compared to the "Propose" pattern of others.

        // The Interface `IResolutionStrategy.resolve` implementation in `OracleService` 
        // usually returns a result that is *then* proposed. 
        // BUT Centralized Oracle skips "Proposal/Challenge" flow usually?
        // Or does it just propose with HIGH confidence/High Bond?

        // "Centralized Oracle (Fast Resolution)" suggests it bypasses the challenge window.
        // We will execute the side effects here if we can, OR return a special flag.
        // But strictly observing the interface:

        // Let's perform the Side Effect (Direct Resolution) HERE because it is "Fast".
        // We need a Service Role client for this usually.
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        if (supabaseUrl && supabaseKey) {
            const { createClient: createClientJs } = require('@supabase/supabase-js');
            const supabase = createClientJs(supabaseUrl, supabaseKey);

            // Update Market
            await supabase
                .from('markets')
                .update({
                    status: 'resolved',
                    winning_outcome: proposedOutcome,
                    resolved_at: new Date().toISOString(),
                    resolution_source: 'CENTRALIZED'
                })
                .eq('id', marketId);

            // Trigger Settlement
            await this.settlementEngine.processMarket(marketId, proposedOutcome);
        } else {
            console.warn("Missing Service Role Key, cannot fast-resolve in Centralized Strategy");
        }

        return {
            outcome: proposedOutcome,
            evidence: {
                summary: 'Verified by Centralized MultiSig',
                urls: [],
                confidence: 1.0
            },
            bondAmount: 0 // No bond needed as it is final
        };
    }
}
