'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';

function GoogleCallbackHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const googleToken = searchParams.get('google_token');
      const googleRefresh = searchParams.get('google_refresh');
      const error = searchParams.get('error');
      const next = searchParams.get('next') || '/markets';

      if (error) {
        console.error('Google OAuth error:', error);
        window.location.href = `/login?error=${error}`;
        return;
      }

      if (googleToken) {
        // Set the access token as a cookie (SameSite=Lax for cross-origin OAuth)
        document.cookie = `sb-access-token=${googleToken}; path=/; max-age=604800; SameSite=Lax`;
        if (googleRefresh) {
          document.cookie = `sb-refresh-token=${googleRefresh}; path=/; max-age=2592000; SameSite=Lax`;
        }

        // Clear URL params
        const url = new URL(window.location.href);
        url.searchParams.delete('google_token');
        url.searchParams.delete('google_refresh');
        url.searchParams.delete('google_user_id');
        window.history.replaceState({}, '', url.pathname);

        // Redirect to intended page
        window.location.href = next;
      }
    };

    handleCallback();
  }, [searchParams]);

  return null;
}

export default function GoogleOAuthCallback() {
  return (
    <Suspense fallback={null}>
      <GoogleCallbackHandler />
    </Suspense>
  );
}
