import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();

        // 1. Authenticate User
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Parse FormData
        const formData = await req.formData();

        const nidFront = formData.get('nidFront') as File | null;
        const nidBack = formData.get('nidBack') as File | null;
        const selfie = formData.get('selfie') as File | null;
        const nidNumber = formData.get('nidNumber') as string | null;
        const dateOfBirth = formData.get('dateOfBirth') as string | null;

        // 3. Validation
        if (!nidFront || !nidBack || !selfie || !nidNumber || !dateOfBirth) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        const nidRegex = /^\d{10}$|^\d{13}$|^\d{17}$/;
        if (!nidRegex.test(nidNumber)) {
            return NextResponse.json({ error: 'Invalid NID number' }, { status: 400 });
        }

        // 4. File Upload Helper
        const uploadFile = async (path: string, file: File) => {
            const bucketPath = `${user.id}/${path}`;
            const { error: uploadError } = await supabase.storage
                .from('kyc-documents')
                .upload(bucketPath, file, {
                    contentType: file.type,
                    upsert: true
                });

            if (uploadError) {
                console.error(`Storage Upload Error for ${path}:`, uploadError);
                throw new Error(`Failed to upload ${path}`);
            }

            return bucketPath;
        };

        // 5. Parallel Uploads
        const [nidFrontPath, nidBackPath, selfiePath] = await Promise.all([
            uploadFile('nid-front.jpg', nidFront),
            uploadFile('nid-back.jpg', nidBack),
            uploadFile('selfie.jpg', selfie)
        ]);

        // 6. KYC Record Insertion
        const { data: kyc, error: insertError } = await supabase
            .from('kyc_submissions')
            .insert({
                user_id: user.id,
                nid_number: nidNumber,
                date_of_birth: dateOfBirth,
                nid_front_url: nidFrontPath,
                nid_back_url: nidBackPath,
                selfie_url: selfiePath,
                status: 'pending'
            })
            .select()
            .single();

        if (insertError) {
            console.error('KYC Submission Insert Error:', insertError);
            return NextResponse.json({ error: 'Failed to submit KYC' }, { status: 500 });
        }

        // 7. Success Response
        return NextResponse.json({
            success: true,
            message: 'KYC documents submitted successfully. Verification may take 1-2 business days.',
            kyc
        });

    } catch (error: any) {
        console.error('KYC Submission catch block error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
