import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { createClient } from '@/lib/supabase/server';

// Admin route protection
const ADMIN_ROUTES = ['/admin', '/admin/users', '/admin/analytics'];
const ADMIN_API_ROUTES = ['/api/admin'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.url;
  
  // First, update the session
  const response = await updateSession(request);
  
  // Check if this is an admin route
  const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route));
  const isAdminApiRoute = ADMIN_API_ROUTES.some(route => pathname.startsWith(route));
  
  if (isAdminRoute || isAdminApiRoute) {
    // Check for admin access
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      // Not authenticated - redirect to login
      if (isAdminRoute) {
        return NextResponse.redirect(new URL('/login?redirect=admin', request.url));
      }
      // API route - return 401
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profile?.is_admin) {
      // Not an admin - redirect or return 403
      if (isAdminRoute) {
        return NextResponse.redirect(new URL('/markets', request.url));
      }
      // API route - return 403
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }
    
    // Add admin info to headers for downstream use
    response.headers.set('x-admin-id', user.id);
    response.headers.set('x-admin-email', user.email || '');
  }
  
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
