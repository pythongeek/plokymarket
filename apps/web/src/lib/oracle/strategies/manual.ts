import { IResolutionStrategy, OracleEvidence } from '../types';

export class ManualResolutionStrategy implements IResolutionStrategy {
    async resolve(marketId: string, marketQuestion: string, context?: any): Promise<{ outcome: string; evidence: OracleEvidence }> {
        // Manual strategy doesn't "auto-resolve". 
        // It expects the outcome to be passed in the context from an Admin action.

        if (!context?.manualOutcome) {
            throw new Error('Manual resolution requires specific outcome in context');
        }

        return {
            outcome: context.manualOutcome,
            evidence: {
                summary: context.reason || 'Manually resolved by Admin',
                urls: [],
                confidence: 1.0
            }
        };
    }
}
