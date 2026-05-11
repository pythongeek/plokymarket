import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/server';
import { KycService } from '@/lib/kyc/service';
import { jwtVerify } from 'jose';

const validIdTypes = ['national_id', 'passport', 'driving_license'];

// GET /api/kyc - Get user's own KYC profile
const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXT_PUBLIC_JWT_SECRET || 'P10kyM@rket.BD.2026.JWT.SECRET.XX'
);

async function getUserFromRequest(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET, { clockTolerance: 60 });
      return { id: payload.sub as string, email: payload.email as string };
    } catch { /* fall through */ }
  }
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(/sb-access-token=([^;]+)/);
  const token = match ? decodeURIComponent(match[1]) : null;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { clockTolerance: 60 });
    return { id: payload.sub as string, email: payload.email as string };
  } catch { return null; }
}


export async function GET() {
    try {
        const supabase = await createPublicClient();
        const user = await getUserFromRequest(request);

        if (!user) {
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
        const supabase = await createPublicClient();
        const user = await getUserFromRequest(request);

        if (!user) {
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
