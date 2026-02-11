import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { KycService } from '@/lib/kyc/service';

// GET /api/kyc - Get user's own KYC profile
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const profile = await KycService.getKycProfile(user.id);
        const submissions = await KycService.getKycSubmissions(user.id);

        return NextResponse.json({
            profile: profile || { verification_status: 'unverified' },
            submissions,
        });
    } catch (error: any) {
        console.error('Error getting KYC profile:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get KYC profile' },
            { status: 500 }
        );
    }
}

// POST /api/kyc - Submit KYC documents
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();

        // Validate required fields
        const requiredFields = ['full_name', 'date_of_birth', 'nationality', 'id_type', 'id_number', 'address_line1', 'city', 'country', 'phone_number'];
        for (const field of requiredFields) {
            if (!body[field]) {
                return NextResponse.json(
                    { error: `Missing required field: ${field}` },
                    { status: 400 }
                );
            }
        }

        // Validate id_type
        if (!validIdTypes.includes(body.id_type)) {
            return NextResponse.json(
                { error: 'Invalid ID type. Must be: national_id, passport, or driving_license' },
                { status: 400 }
            );
        }

        // Validate date format
        if (isNaN(Date.parse(body.date_of_birth))) {
            return NextResponse.json(
                { error: 'Invalid date_of_birth format' },
                { status: 400 }
            );
        }

        const result = await KycService.submitKyc(user.id, body);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error submitting KYC:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to submit KYC' },
            { status: 500 }
        );
    }
}
