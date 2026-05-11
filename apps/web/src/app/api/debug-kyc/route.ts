import { createPublicClient } from '@/lib/supabase/server';
import { KycService } from '@/lib/kyc/service';
import { jwtVerify } from 'jose';

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


export async function POST(req: Request) {
    try {
        const user = await getUserFromRequest(request);

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
