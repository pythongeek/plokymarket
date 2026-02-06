import { createClient } from '@/lib/supabase/server';

export class DisputeResolutionService {
    async initiateDispute(marketId: string, challengerId: string, proposedOutcome: string, context?: any) {
        // 1. Calculate Dispute Bond (2% of market volume)
        // In prod, fetch volume from 'trades'. 
        // Mock volume = 50000 -> Bond = 1000.
        const marketVolume = 50000;
        const bondAmount = marketVolume * 0.02;

        console.log(`[Dispute] Initiating dispute for Market ${marketId} by ${challengerId}. Bond Required: ${bondAmount}`);

        // 2. Lock Bond
        // await walletService.lockFunds(challengerId, bondAmount);

        // 3. Create Dispute Record
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        if (supabaseUrl && supabaseKey) {
            const { createClient: createClientJs } = require('@supabase/supabase-js');
            const supabase = createClientJs(supabaseUrl, supabaseKey);

            // Find Active Request for this market to dispute?
            // Assuming we dispute the 'proposed' request.
            const { data: request } = await supabase
                .from('oracle_requests')
                .select('id')
                .eq('market_id', marketId)
                .eq('status', 'proposed')
                .single();

            if (!request) throw new Error('No proposed request to dispute');

            const { data: dispute, error } = await supabase
                .from('oracle_disputes')
                .insert({
                    request_id: request.id,
                    disputer_id: challengerId,
                    bond_amount: bondAmount,
                    reason: context?.reason || 'Disputing Outcome',
                    status: 'open'
                })
                .select()
                .single();

            if (error) throw error;

            // Update Request Status
            await supabase.from('oracle_requests').update({ status: 'disputed' }).eq('id', request.id);

            return dispute;
        }

        return { success: true, bondAmount, status: 'VOTING' };
    }
}
