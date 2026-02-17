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
          // Fetch profile and related data
          const { data: profile } = await supabase
            .from('user_profiles')
            .select(`
              kyc_level,
              last_login_at,
              user_kyc_profiles (id_expiry),
              user_status (account_status)
            `)
            .eq('id', session.user.id)
            .single();

          const kycProfile = (profile as any)?.user_kyc_profiles;
          const statusRecord = (profile as any)?.user_status;

          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
            avatar_url: session.user.user_metadata?.avatar_url,
            created_at: session.user.created_at,
            kycLevel: profile?.kyc_level || 0,
            lastLoginAt: profile?.last_login_at,
            idExpiry: kycProfile?.id_expiry,
            accountStatus: statusRecord?.account_status || 'active'
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
