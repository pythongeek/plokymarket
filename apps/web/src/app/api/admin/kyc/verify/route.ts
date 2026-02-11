import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();

        // Check if user is admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('is_admin, is_super_admin')
            .eq('id', user.id)
            .single();

        if (!profile?.is_admin && !profile?.is_super_admin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        // Get the user's KYC documents
        const { data: kycProfile, error: kycError } = await supabase
            .from('user_kyc_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (kycError || !kycProfile) {
            return NextResponse.json({ error: "KYC profile not found" }, { status: 404 });
        }

        if (!kycProfile.id_document_front_url || !kycProfile.selfie_url) {
            return NextResponse.json({ error: "Missing KYC documents" }, { status: 400 });
        }

        // Call the Python AI Service
        const aiServiceUrl = process.env.AI_KYC_URL || 'http://localhost:8000';

        // We need to ensure the URLs are accessible. 
        // If they are signed URLs from the frontend, they might have expired, but usually they are valid for some time.
        // If they are just paths, we need to sign them.
        // The current implementation in page.tsx saves signed URLs (which expire).
        // Ideally, we should save the PATH in DB and sign it on retrieval, OR save a long-lived signed URL.
        // The page.tsx implementation saves the signedUrl.

        const verificationPayload = {
            user_id: userId,
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
            console.error("AI Service Call Failed:", error);
            return NextResponse.json({ error: "AI Service Unavailable: " + error.message }, { status: 503 });
        }

        // Update the KYC profile with AI verification result
        // We store the result in the 'notes' or a new column 'ai_verification_result'
        // Since we can't easily add columns without migration, we'll append to admin_notes for now
        // or assume there is a jsonb column 'verification_data' (checked migration 063: it has `rejection_reason` and `status`, but no generic data column?)
        // Migration 063 has:
        /*
        CREATE TABLE public.user_kyc_profiles (
            ...
            rejection_reason TEXT,
            admin_notes TEXT,
            reviewed_by UUID REFERENCES auth.users(id),
            reviewed_at TIMESTAMPTZ,
            ...
        );
        */

        const aiStatus = aiResponse.status === 'success' ? 'VERIFIED' : 'FAILED';
        const confidence = aiResponse.face_verification.confidence.toFixed(2);

        // Append to admin notes
        const newNote = `\n[AI Verification ${new Date().toISOString()}]
Status: ${aiStatus}
Confidence: ${confidence}%
Distance: ${aiResponse.face_verification.details?.distance || 'N/A'}
OCR Raw: ${JSON.stringify(aiResponse.ocr_data).substring(0, 100)}...`;

        const updates: any = {
            admin_notes: (kycProfile.admin_notes || '') + newNote
        };

        if (aiStatus === 'VERIFIED' && parseFloat(confidence) > 85) {
            // Auto-approve if high confidence? Maybe just suggest.
            // Let's just return the result to the UI for the admin to decide.
        }

        const { error: updateError } = await supabase
            .from('user_kyc_profiles')
            .update(updates)
            .eq('user_id', userId);

        if (updateError) {
            throw new Error("Failed to update KYC profile with AI result");
        }

        return NextResponse.json({
            success: true,
            ai_result: aiResponse
        });

    } catch (error: any) {
        console.error("Error in AI verification route:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
