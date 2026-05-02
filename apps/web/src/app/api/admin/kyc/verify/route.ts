// @ts-nocheck
import { pool, query } from '@/lib/admin/local-db';
import { NextRequest, NextResponse } from 'next/server';

async function getUserFromToken(token: string): Promise<string | null> {
    const cloudUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sltcfmqefujecqfbmkvz.supabase.co';
    const cloudRes = await fetch(`${cloudUrl}/auth/v1/user`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': process.env.SUPABASE_ANON_KEY || ''
        }
    });
    if (!cloudRes.ok) return null;
    const userData = await cloudRes.json();
    return userData?.id || null;
}

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = await getUserFromToken(token);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const profiles = await query<{ is_admin: boolean; is_super_admin: boolean }>(
            'SELECT is_admin, is_super_admin FROM user_profiles WHERE id = $1',
            [userId]
        );
        if (!profiles[0]?.is_admin && !profiles[0]?.is_super_admin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { userId: targetUserId } = body;

        if (!targetUserId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Get the user's KYC documents
        const kycResult = await pool.query(
            'SELECT * FROM user_kyc_profiles WHERE user_id = $1',
            [targetUserId]
        );

        if (kycResult.rows.length === 0) {
            return NextResponse.json({ error: 'KYC profile not found' }, { status: 404 });
        }

        const kycProfile = kycResult.rows[0];

        if (!kycProfile.id_document_front_url || !kycProfile.selfie_url) {
            return NextResponse.json({ error: 'Missing KYC documents' }, { status: 400 });
        }

        // Call the Python AI Service
        const aiServiceUrl = process.env.AI_KYC_URL || 'http://localhost:8000';

        const verificationPayload = {
            user_id: targetUserId,
            full_name: kycProfile.full_name,
            id_front_url: kycProfile.id_document_front_url,
            selfie_url: kycProfile.selfie_url
        };

        console.log(`Calling AI Service at ${aiServiceUrl}/api/kyc/verify with payload:`, verificationPayload);

        let aiResponse;
        try {
            const aiRes = await fetch(`${aiServiceUrl}/api/kyc/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(verificationPayload)
            });

            if (!aiRes.ok) {
                const errorText = await aiRes.text();
                throw new Error(`AI Service returned ${aiRes.status}: ${errorText}`);
            }

            aiResponse = await aiRes.json();
        } catch (error: any) {
            console.error('AI Service Call Failed:', error);
            return NextResponse.json({ error: 'AI Service Unavailable: ' + error.message }, { status: 503 });
        }

        // Update the KYC profile with AI verification result
        const aiStatus = aiResponse.status === 'success' ? 'VERIFIED' : 'FAILED';
        const confidence = aiResponse.face_verification.confidence.toFixed(2);

        // Append to admin notes
        const newNote = `\n[AI Verification ${new Date().toISOString()}]
Status: ${aiStatus}
Confidence: ${confidence}%
Distance: ${aiResponse.face_verification.details?.distance || 'N/A'}
OCR Raw: ${JSON.stringify(aiResponse.ocr_data).substring(0, 100)}...`;

        const adminNotes = (kycProfile.admin_notes || '') + newNote;

        const updateResult = await pool.query(
            'UPDATE user_kyc_profiles SET admin_notes = $1 WHERE user_id = $2',
            [adminNotes, targetUserId]
        );

        if (updateResult.error) {
            throw new Error('Failed to update KYC profile with AI result');
        }

        return NextResponse.json({
            success: true,
            ai_result: aiResponse
        });

    } catch (error: any) {
        console.error('Error in AI verification route:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
