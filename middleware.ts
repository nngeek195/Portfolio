import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('admin_session')?.value;
  const { pathname } = request.nextUrl;

  // Protect all routes under /admin/dashboard
  if (pathname.startsWith('/admin/dashboard')) {
    if (!session) {
      // Redirect unauthorized users to the login page
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Prevent authenticated users from accessing the login page
  if (pathname === '/admin/login') {
    if (session) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

// Specify which routes this middleware should run on
export const config = {
  matcher: ['/admin/:path*'],
};