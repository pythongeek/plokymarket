import { createClient } from '@/lib/supabase/server';
import { KycService } from '@/lib/kyc/service';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new Response('Unauthorized', { status: 401 });
        }

        console.log('Attempting KYC submission for user:', user.id);

        const dummyData = {
            full_name: 'Test User',
            date_of_birth: '1990-01-01',
            nationality: 'Bangladesh',
            id_type: 'national_id',
            id_number: '1234567890',
            address_line1: '123 Test St',
            city: 'Test City',
            country: 'Bangladesh',
            phone_number: '+8801711111111'
        };

        try {
            const result = await KycService.submitKyc(user.id, dummyData);
            return new Response(JSON.stringify(result), { status: 200 });
        } catch (error: any) {
            console.error('Detailed KYC Error:', error);
            // Return validation details if available
            return new Response(JSON.stringify({
                error: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            }), { status: 500 });
        }
    } catch (e: any) {
        return new Response(e.message, { status: 500 });
    }
}
