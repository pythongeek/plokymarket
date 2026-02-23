"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at?: string;
  kycLevel?: number;
  idExpiry?: string;
  accountStatus?: string;
  lastLoginAt?: string;
  current_level_id?: number;
  current_level_name?: string;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = createClient();
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (session?.user) {
          // Fetch profile (simple query — no joins to non-existent tables)
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('kyc_level, last_login_at')
            .eq('id', session.user.id)
            .single();

          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
            avatar_url: session.user.user_metadata?.avatar_url,
            created_at: session.user.created_at,
            kycLevel: profile?.kyc_level || 0,
            lastLoginAt: profile?.last_login_at,
            accountStatus: 'active',
            current_level_id: profile?.current_level_id || 1,
            current_level_name: profile?.current_level_name || 'Novice'
          });
        } else {
          // Demo user for development
          setUser({
            id: 'demo-user',
            email: 'trader@example.com',
            name: 'Demo Trader',
            avatar_url: undefined,
            created_at: new Date().toISOString(),
            kycLevel: 1 // Demo as verified
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch user');
        // Fallback to demo user
        setUser({
          id: 'demo-user',
          email: 'trader@example.com',
          name: 'Demo Trader',
          avatar_url: undefined,
          created_at: new Date().toISOString()
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, loading, error };
}
