/**
 * Slug Utilities for Event Creation
 * Handles slug generation, validation, and duplicate checking
 */

import { createClient } from '@/lib/supabase/client';

/**
 * Generate URL-friendly slug from title
 * @param title - Event title
 * @returns Generated slug
 */
export function generateSlug(title: string): string {
  if (!title || title.trim().length === 0) {
    return '';
  }

  // Bengali to English transliteration mapping (common words)
  const bengaliToEnglish: Record<string, string> = {
    'বাংলাদেশ': 'bangladesh',
    'বিপিএল': 'bpl',
    'ক্রিকেট': 'cricket',
    'নির্বাচন': 'election',
    'জিতবে': 'win',
    'হারবে': 'lose',
    'ঢাকা': 'dhaka',
    'চট্টগ্রাম': 'chittagong',
    'চট্টগ্রাম': 'chattogram',
    'সিলেট': 'sylhet',
    'রাজশাহী': 'rajshahi',
    'খুলনা': 'khulna',
    'বরিশাল': 'barisal',
    'রংপুর': 'rangpur',
    'ময়মনসিংহ': 'mymensingh',
    'ফাইনাল': 'final',
    'ম্যাচ': 'match',
    'খেলা': 'game',
    'দল': 'team',
    'জয়': 'victory',
    'পরাজয়': 'defeat',
    'টাকা': 'taka',
    'ডলার': 'dollar',
    'মূল্য': 'price',
    'বাজার': 'market',
    'শেয়ার': 'share',
    'স্টক': 'stock',
  };

  let processed = title.toLowerCase();

  // Replace Bengali words with English
  Object.entries(bengaliToEnglish).forEach(([bn, en]) => {
    processed = processed.replace(new RegExp(bn, 'gi'), en);
  });

  // Transliterate remaining Bengali characters (basic)
  processed = processed
    .replace(/[অআইঈউঊএঐওঔ]/g, 'a')
    .replace(/[ক]/g, 'k')
    .replace(/[খ]/g, 'kh')
    .replace(/[গ]/g, 'g')
    .replace(/[ঘ]/g, 'gh')
    .replace(/[চ]/g, 'ch')
    .replace(/[ছ]/g, 'chh')
    .replace(/[জ]/g, 'j')
    .replace(/[ঝ]/g, 'jh')
    .replace(/[ট]/g, 't')
    .replace(/[ঠ]/g, 'th')
    .replace(/[ড]/g, 'd')
    .replace(/[ঢ]/g, 'dh')
    .replace(/[ণ]/g, 'n')
    .replace(/[ত]/g, 't')
    .replace(/[থ]/g, 'th')
    .replace(/[দ]/g, 'd')
    .replace(/[ধ]/g, 'dh')
    .replace(/[ন]/g, 'n')
    .replace(/[প]/g, 'p')
    .replace(/[ফ]/g, 'f')
    .replace(/[ব]/g, 'b')
    .replace(/[ভ]/g, 'bh')
    .replace(/[ম]/g, 'm')
    .replace(/[য]/g, 'y')
    .replace(/[র]/g, 'r')
    .replace(/[ল]/g, 'l')
    .replace(/[শ]/g, 'sh')
    .replace(/[ষ]/g, 'sh')
    .replace(/[স]/g, 's')
    .replace(/[হ]/g, 'h')
    .replace(/[ড়]/g, 'r')
    .replace(/[ঢ়]/g, 'rh')
    .replace(/[য়]/g, 'y')
    .replace(/[ৎ]/g, 't')
    .replace(/[ং]/g, 'ng')
    .replace(/[ঃ]/g, 'h')
    .replace(/[ঁ]/g, '');

  // Clean up the slug
  const slug = processed
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove consecutive hyphens
    .substring(0, 60); // Limit length

  return slug;
}

/**
 * Check if slug already exists in database
 * @param slug - Slug to check
 * @returns Object with exists boolean and suggestions
 */
export async function checkSlugExists(slug: string): Promise<{
  exists: boolean;
  existingEvent?: { id: string; title: string };
}> {
  if (!slug) return { exists: false };

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('events')
      .select('id, title')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      console.error('[Slug Utils] Error checking slug:', error);
      return { exists: false };
    }

    return {
      exists: !!data,
      existingEvent: data || undefined,
    };
  } catch (error) {
    console.error('[Slug Utils] Error in checkSlugExists:', error);
    return { exists: false };
  }
}

/**
 * Generate unique slug with fallback
 * If slug exists, appends random 4-digit suffix
 * @param title - Event title
 * @returns Unique slug
 */
export async function generateUniqueSlug(title: string): Promise<string> {
  const baseSlug = generateSlug(title);
  
  if (!baseSlug) {
    // Fallback to timestamp if no valid slug generated
    return `event-${Date.now()}`;
  }

  // Check if base slug exists
  const { exists } = await checkSlugExists(baseSlug);
  
  if (!exists) {
    return baseSlug;
  }

  // Generate random 4-digit suffix
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const newSlug = `${baseSlug}-${randomSuffix}`;

  // Double-check the new slug
  const { exists: newExists } = await checkSlugExists(newSlug);
  
  if (newExists) {
    // If still exists, use timestamp
    return `${baseSlug}-${Date.now()}`;
  }

  return newSlug;
}

/**
 * Validate slug format
 * @param slug - Slug to validate
 * @returns Validation result
 */
export function validateSlug(slug: string): {
  valid: boolean;
  error?: string;
} {
  if (!slug || slug.trim().length === 0) {
    return { valid: false, error: 'Slug is required' };
  }

  if (slug.length < 3) {
    return { valid: false, error: 'Slug must be at least 3 characters' };
  }

  if (slug.length > 100) {
    return { valid: false, error: 'Slug must be less than 100 characters' };
  }

  // Check valid characters
  const validPattern = /^[a-z0-9-]+$/;
  if (!validPattern.test(slug)) {
    return { valid: false, error: 'Slug can only contain lowercase letters, numbers, and hyphens' };
  }

  // Check for consecutive hyphens
  if (slug.includes('--')) {
    return { valid: false, error: 'Slug cannot contain consecutive hyphens' };
  }

  // Check start/end with hyphen
  if (slug.startsWith('-') || slug.endsWith('-')) {
    return { valid: false, error: 'Slug cannot start or end with a hyphen' };
  }

  return { valid: true };
}

/**
 * Pre-flight check before event creation
 * Validates slug and checks for duplicates
 * @param title - Event title
 * @returns Pre-flight result with slug and validation
 */
export async function preFlightCheck(title: string): Promise<{
  success: boolean;
  slug?: string;
  error?: string;
  warnings?: string[];
}> {
  const warnings: string[] = [];

  // Generate slug
  const slug = await generateUniqueSlug(title);

  // Validate slug
  const validation = validateSlug(slug);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
    };
  }

  // Check if original slug was modified
  const originalSlug = generateSlug(title);
  if (slug !== originalSlug) {
    warnings.push(`Slug modified to ensure uniqueness: "${slug}"`);
  }

  return {
    success: true,
    slug,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
