/**
 * Upstash Workflow Integration for AI KYC Verification
 * Handles long-running OCR, Face Verification, and Data Correlation tasks
 * Vercel Edge compatible with Upstash Workflow SDK
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const runtime = 'edge';
export const preferredRegion = 'iad1';

// Initialize Supabase Admin Client
// Initialize Supabase admin client is managed via createServiceClient

/**
 * Main workflow handler for KYC Verification
 */
export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        const payload = await request.json();
        const { step, data } = payload;
        const { userId } = data;

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId in payload' }, { status: 400 });
        }

        const supabase = await createServiceClient();

        // STEP 1: Fetch User KYC Profile & Images
        if (step === 'ai-analysis' || !step) {
            const { data: kycProfile, error: kycError } = await supabase
                .from('user_kyc_profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (kycError || !kycProfile) {
                throw new Error('KYC profile not found');
            }

            if (!kycProfile.id_document_front_url || !kycProfile.selfie_url) {
                throw new Error('Missing identity verification documents');
            }

            // Call the Python AI Service for OCR and Face matching
            const aiServiceUrl = process.env.AI_KYC_URL || 'http://localhost:8000';
            const verificationPayload = {
                user_id: userId,
                full_name: kycProfile.full_name,
                id_front_url: kycProfile.id_document_front_url,
                selfie_url: kycProfile.selfie_url
            };

            let aiResponse;
            try {
                // Sending request to FastAPI backend
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
                throw new Error("AI Service Unavailable: " + error.message);
            }

            // Now we have the OCR output and Face matching score from Python.
            // Send it to Gemini to determine if the ID data matches the user-provided data
            const geminiApiKey = process.env.GEMINI_API_KEY;
            if (!geminiApiKey) {
                throw new Error('GEMINI_API_KEY not configured');
            }

            const prompt = `You are a KYC Verification Oracle. Analyze the user-submitted profile data and the raw OCR data extracted from the user's ID card. Determine if the information matches reliably.

User Submitted Data:
- Full Name: ${kycProfile.full_name}
- Date of Birth: ${kycProfile.date_of_birth}
- Nationality/Country: ${kycProfile.nationality} / ${kycProfile.country}
- ID Number: ${kycProfile.id_number}

Raw OCR Data Extracted By AI:
${JSON.stringify(aiResponse.ocr_data || {})}

Face Verification Confidence: ${aiResponse.face_verification?.confidence || 0}%

Based on the evidence above, provide your analysis in JSON format:
{
  "matches": true | false,
  "confidence": number (0.0 to 1.0),
  "reasoning": "brief explanation of your decision"
}

Rules:
- Only return valid JSON, no markdown
- If there are minor OCR typos, use your judgment to still allow a match if it's clearly the same person with high probability.
- If Face Verification is below 70%, it should NOT match.`;

            const geminiResponse = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: prompt }]
                        }]
                    })
                }
            );

            if (!geminiResponse.ok) {
                throw new Error(`Gemini API error: ${geminiResponse.status}`);
            }

            const geminiResult = await geminiResponse.json();
            const aiText = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text || '';

            let aiDecision;
            try {
                const jsonMatch = aiText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    aiDecision = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error('No JSON found in AI response');
                }
            } catch (parseError) {
                console.error('Failed to parse AI response:', aiText);
                aiDecision = {
                    matches: false,
                    confidence: 0.0,
                    reasoning: 'Failed to parse AI response'
                };
            }

            return NextResponse.json({
                step: 'ai-analysis',
                status: 'success',
                aiDecision,
                faceVerification: aiResponse.face_verification,
                ocrData: aiResponse.ocr_data,
                userId: userId,
                nextStep: 'resolve-kyc'
            });
        }

        // STEP 2: Resolve KYC Status
        if (step === 'resolve-kyc') {
            const { aiDecision, faceVerification, userId, ocrData } = data;
            const confidenceThreshold = 0.85;

            const newNote = `\n[Auto Workflow ${new Date().toISOString()}]
Faces Match: ${faceVerification?.confidence || 'N/A'}%
Data Match: ${aiDecision.matches ? 'YES' : 'NO'} (${(aiDecision.confidence * 100).toFixed(0)}%)
Reasoning: ${aiDecision.reasoning}`;

            // Check if we should auto-approve
            if (aiDecision.matches && aiDecision.confidence >= confidenceThreshold && faceVerification?.confidence >= 80) {
                // Auto Approve
                await supabase.rpc('admin_kyc_action', {
                    p_admin_id: '00000000-0000-0000-0000-000000000000', // System automated
                    p_user_id: userId,
                    p_action: 'approve',
                    p_reason: 'Automated AI Verification Approval',
                    p_rejection_reason: null
                });

                const { data: prof } = await supabase.from('user_kyc_profiles').select('admin_notes').eq('id', userId).single();
                await supabase.from('user_kyc_profiles').update({
                    admin_notes: (prof?.admin_notes || '') + newNote + "\nResult: Auto Approved."
                }).eq('id', userId);

                return NextResponse.json({
                    step: 'resolve-kyc',
                    status: 'verified',
                    userId,
                    executionTimeMs: Date.now() - startTime
                });
            }

            // If it doesn't meet the auto-approve threshold, just leave it pending and update the notes.
            const { data: prof } = await supabase.from('user_kyc_profiles').select('admin_notes').eq('id', userId).single();
            await supabase.from('user_kyc_profiles').update({
                admin_notes: (prof?.admin_notes || '') + newNote + "\nResult: Left Pending for Manual Review."
            }).eq('id', userId);

            return NextResponse.json({
                step: 'resolve-kyc',
                status: 'manual_review_required',
                userId,
                reason: 'Confidence below threshold or mismatch detected',
                executionTimeMs: Date.now() - startTime
            });
        }

        // Unknown step
        return NextResponse.json(
            { error: 'Unknown workflow step', step },
            { status: 400 }
        );

    } catch (error: any) {
        console.error('[Upstash KYC Workflow] Error:', error);
        return NextResponse.json(
            {
                error: 'Workflow failed',
                details: error.message,
                executionTimeMs: Date.now() - startTime
            },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    return NextResponse.json({
        status: 'active',
        service: 'upstash-workflow-kyc',
        steps: ['ai-analysis', 'resolve-kyc'],
        timestamp: new Date().toISOString()
    });
}
