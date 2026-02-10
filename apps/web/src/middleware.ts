import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple middleware that just passes through
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

// Only run middleware on specific paths
export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
