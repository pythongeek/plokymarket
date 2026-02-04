import { NextResponse, type NextRequest } from 'next/server';

// Simplified middleware - Supabase auth will be enabled when credentials are configured
export async function updateSession(request: NextRequest) {
  return NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
}
