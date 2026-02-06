import { IResolutionStrategy, OracleEvidence } from '../types';

export class ApiResolutionStrategy implements IResolutionStrategy {
    async resolve(marketId: string, marketQuestion: string, context?: any): Promise<{ outcome: string; evidence: OracleEvidence }> {
        const apiUrl = context?.apiUrl;
        const valuePath = context?.valuePath; // e.g., "data.match.winner"

        if (!apiUrl) {
            throw new Error('API Resolution requires apiUrl in context');
        }

        try {
            const response = await fetch(apiUrl);
            const data = await response.json();

            // Simple path traversal
            // In prod, use lodash.get or similar
            const resultValue = valuePath.split('.').reduce((o: any, i: string) => o?.[i], data);

            let outcome = 'UNCERTAIN';
            // Basic mapping logic - can be extended
            if (String(resultValue).toLowerCase() === 'yes' || resultValue === true) outcome = 'YES';
            if (String(resultValue).toLowerCase() === 'no' || resultValue === false) outcome = 'NO';

            // If we have specific expected values
            if (context?.expectedYesValue && resultValue === context.expectedYesValue) outcome = 'YES';

            return {
                outcome,
                evidence: {
                    summary: `Fetched from API: ${apiUrl}. Value: ${JSON.stringify(resultValue)}`,
                    urls: [apiUrl],
                    confidence: 1.0,
                    aiAnalysis: { rawData: data }
                }
            };
        } catch (e) {
            console.error("API Resolution Error", e);
            throw new Error('Failed to resolve via API');
        }
    }
}
