import { createClient } from '@/lib/supabase/client';
import type { PlatformSettings, DbResult } from '@/types/database';

const supabase = createClient();

export async function getPlatformSettings(key: string): Promise<DbResult<PlatformSettings>> {
    const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('key', key)
        .single();

    return { data, error: error ? new Error(error.message) : null };
}

export async function updatePlatformSettings(
    key: string,
    value: any,
    updatedBy: string
): Promise<DbResult<PlatformSettings>> {
    const { data, error } = await supabase
        .from('platform_settings')
        .update({
            value,
            updated_by: updatedBy,
            updated_at: new Date().toISOString()
        })
        .eq('key', key)
        .select()
        .single();

    return { data, error: error ? new Error(error.message) : null };
}

/**
 * Convenience function to check if trading is paused globally
 */
export async function isTradingPausedGlobally(): Promise<boolean> {
    const { data } = await getPlatformSettings('trading_paused');
    return data?.value === true;
}

/**
 * Toggle global trading pause
 */
export async function setGlobalTradingPause(
    paused: boolean,
    updatedBy: string
): Promise<DbResult<PlatformSettings>> {
    return updatePlatformSettings('trading_paused', paused, updatedBy);
}
