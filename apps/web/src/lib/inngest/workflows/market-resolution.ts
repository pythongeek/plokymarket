import { inngest } from '../client';

export type MarketResolveEvent = {
    data: {
        marketId: string;
        resolutionSource?: string;
    };
};

export const resolveMarket = inngest.createFunction(
    { id: 'resolve-market', concurrency: 5 },
    { event: 'market/resolve' },
    async ({ event, step }) => {
        const { marketId } = event.data;

        const oracleData = await step.run('fetch-oracle-data', async () => {
            console.log('Fetching oracle data for market ' + marketId);
            return { winner: 'Yes', confidence: 0.98, timestamp: Date.now() };
        });

        await step.run('verify-resolution', async () => {
            if (oracleData.confidence < 0.9) {
                throw new Error('Oracle confidence too low');
            }
            return true;
        });

        const settlementResult = await step.run('settle-bets', async () => {
            console.log('Settling bets for market ' + marketId);
            return { settledCount: 150, totalVolume: 5000 };
        });

        await step.run('notify-participants', async () => {
            return { sent: true };
        });

        return { success: true, marketId };
    }
);