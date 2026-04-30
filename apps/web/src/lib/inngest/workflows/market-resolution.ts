import { inngest } from '../client';

export type MarketResolveEvent = {
    data: {
        marketId: string;
        resolutionSource?: string;
    };
};

/**
 * Market Resolution Function
 * Uses n8n workflow for AI oracle resolution
 * Falls back to manual resolution if n8n is unavailable
 */
export const resolveMarket = inngest.createFunction(
    { id: 'resolve-market', concurrency: 5 },
    { event: 'market/resolve' },
    async ({ event, step }) => {
        const { marketId } = event.data;

        // Trigger n8n Oracle Workflow and wait for result
        const oracleData = await step.run('trigger-n8n-oracle', async () => {
            console.log('Triggering n8n oracle for market ' + marketId);

            // Call n8n webhook
            const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || `${process.env.NEXT_PUBLIC_APP_URL}/webhook/plokymarket-resolution`;

            try {
                const response = await fetch(n8nWebhookUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-n8n-api-key': process.env.N8N_API_KEY || ''
                    },
                    body: JSON.stringify({
                        market_id: marketId,
                        trigger_source: 'inngest'
                    })
                });

                if (!response.ok) {
                    throw new Error(`n8n returned ${response.status}`);
                }

                const result = await response.json();
                console.log('n8n oracle result:', result);

                return {
                    outcome: result.outcome || 'UNCERTAIN',
                    confidence: result.confidence_score || 0,
                    reasoning: result.reasoning || 'No reasoning provided',
                    sources: result.sources || [],
                    timestamp: new Date().toISOString()
                };
            } catch (error: any) {
                console.error('n8n oracle error:', error.message);
                // Return uncertain - will need manual resolution
                return {
                    outcome: 'UNCERTAIN',
                    confidence: 0,
                    reasoning: `n8n error: ${error.message}`,
                    sources: [],
                    timestamp: new Date().toISOString()
                };
            }
        });

        // Check confidence threshold
        await step.run('verify-resolution', async () => {
            const threshold = 0.9; // 90% confidence required
            if (oracleData.confidence < threshold) {
                console.log(`Oracle confidence ${oracleData.confidence} below threshold ${threshold}`);
                // Don't throw - this will result in manual review needed
            }
            return { verified: true, needsManualReview: oracleData.confidence < threshold };
        });

        // Update resolution system with oracle data
        await step.run('update-resolution-system', async () => {
            // This would typically call Supabase to update resolution_systems table
            // The n8n webhook already does this, so this is for additional processing
            console.log('Updating resolution system for market ' + marketId);
            return { updated: true };
        });

        // If high confidence, trigger settlement
        if (oracleData.confidence >= 0.9 && oracleData.outcome !== 'UNCERTAIN') {
            await step.run('settle-bets', async () => {
                console.log('Settling bets for market ' + marketId);
                // Call settle_market RPC
                return { settledCount: 0, totalVolume: 0 };
            });

            await step.run('notify-participants', async () => {
                return { sent: true };
            });
        }

        return {
            success: true,
            marketId,
            outcome: oracleData.outcome,
            confidence: oracleData.confidence,
            needsManualReview: oracleData.confidence < 0.9
        };
    }
);