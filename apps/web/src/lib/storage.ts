/**
 * Local VPS File Storage Utility
 * Replaces Supabase Storage with VPS filesystem storage
 * 
 * Storage paths:
 *   /var/www/plokymarket/storage/avatars/        - User avatars (public)
 *   /var/www/plokymarket/storage/market-images/  - Market/event images (public)
 *   /var/www/plokymarket/storage/kyc/           - KYC documents (private)
 *   /var/www/plokymarket/storage/receipts/       - Deposit/withdrawal receipts (private)
 */

import { writeFile, mkdir, unlink, stat } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const STORAGE_BASE = '/var/www/plokymarket/storage';

// Ensure directory exists
async function ensureDir(dirPath: string): Promise<void> {
    if (!existsSync(dirPath)) {
        await mkdir(dirPath, { recursive: true });
    }
}

/**
 * Upload a file to local VPS storage
 * Returns the relative storage path (e.g., "kyc/user123/nid-front.jpg")
 */
export async function uploadFile(
    file: File | Blob,
    relativePath: string
): Promise<{ path: string; url: string }> {
    // Validate path to prevent directory traversal
    const normalized = path.normalize(relativePath).replace(/^\//, '');
    if (normalized.includes('..')) {
        throw new Error('Invalid path: directory traversal not allowed');
    }

    const fullPath = path.join(STORAGE_BASE, normalized);
    const dirPath = path.dirname(fullPath);

    await ensureDir(dirPath);

    // Convert File/Blob to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await writeFile(fullPath, buffer);

    // Return relative path (used in DB) and public URL
    return {
        path: normalized,
        url: `/storage/${normalized}`
    };
}

/**
 * Delete a file from local VPS storage
 */
export async function deleteFile(relativePath: string): Promise<void> {
    const normalized = path.normalize(relativePath).replace(/^\//, '');
    if (normalized.includes('..')) {
        throw new Error('Invalid path: directory traversal not allowed');
    }

    const fullPath = path.join(STORAGE_BASE, normalized);

    if (existsSync(fullPath)) {
        await unlink(fullPath);
    }
}

/**
 * Get the full filesystem path for a relative storage path
 */
export function getFullPath(relativePath: string): string {
    const normalized = path.normalize(relativePath).replace(/^\//, '');
    return path.join(STORAGE_BASE, normalized);
}

/**
 * Check if a file exists
 */
export async function fileExists(relativePath: string): Promise<boolean> {
    const normalized = path.normalize(relativePath).replace(/^\//, '');
    const fullPath = path.join(STORAGE_BASE, normalized);
    try {
        await stat(fullPath);
        return true;
    } catch {
        return false;
    }
}

/**
 * Supported MIME types and their extensions
 */
export const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
];

export const ALLOWED_DOCUMENT_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
];

/**
 * Validate file type and size
 */
export function validateFile(
    file: File,
    allowedTypes: string[],
    maxSizeMB: number = 10
): { valid: boolean; error?: string } {
    if (!allowedTypes.includes(file.type)) {
        return { valid: false, error: `File type ${file.type} not allowed` };
    }

    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
        return { valid: false, error: `File size exceeds ${maxSizeMB}MB limit` };
    }

    return { valid: true };
}

/**
 * Generate a unique filename while preserving original extension
 */
export function generateFileName(originalName: string, prefix: string): string {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}-${timestamp}-${random}${ext}`;
}
