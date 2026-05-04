// @ts-nocheck
/**
 * KYC Document Storage API Route
 * Serves KYC documents from VPS local storage
 * Only accessible by authenticated admins
 * 
 * GET /api/storage/kyc/[...path]
 * Returns the file with appropriate headers
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getFullPath, fileExists } from '@/lib/storage';
import { readFile } from 'fs/promises';
import path from 'path';

const MIME_TYPES: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
};

export async function GET(
    req: Request,
    { params }: { params: { path: string[] } }
) {
    try {
        // 1. Authenticate - require admin access
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Check admin status
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

        if (!profile?.is_admin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 3. Build and validate file path
        const filePath = Array.isArray(params.path)
            ? params.path.join('/')
            : params.path;

        // Security: prevent directory traversal
        if (filePath.includes('..') || filePath.startsWith('/')) {
            return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
        }

        // Ensure path starts with kyc/ prefix (all KYC files are under kyc/)
        const safePath = filePath.startsWith('kyc/') ? filePath : `kyc/${filePath}`;
        const fullPath = getFullPath(safePath);

        // 4. Check file exists
        const exists = await fileExists(safePath);
        if (!exists) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        // 5. Read and serve file
        const fileBuffer = await readFile(fullPath);
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `inline; filename="${path.basename(filePath)}"`,
                'Cache-Control': 'private, max-age=3600',
                'X-Content-Type-Options': 'nosniff',
            },
        });

    } catch (error) {
        console.error('KYC storage route error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
