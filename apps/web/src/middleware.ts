import { type NextRequest, NextResponse } from 'next/server';

// Simple pass-through middleware for debugging
export function middleware(request: NextRequest) {
  console.log('Middleware executing for:', request.url);
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
