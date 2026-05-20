import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;

  const isAuthPage = request.nextUrl.pathname.startsWith('/login');
  
  // Exclude API routes that don't need auth (like login, swagger, seed, public marketplace)
  if (
    request.nextUrl.pathname.startsWith('/api/auth/login') ||
    request.nextUrl.pathname.startsWith('/api/auth/logout') ||
    request.nextUrl.pathname.startsWith('/api/admin/seed') ||
    request.nextUrl.pathname.startsWith('/api/swagger') ||
    request.nextUrl.pathname.startsWith('/api-doc') ||
    request.nextUrl.pathname.startsWith('/api/marketplace') ||
    request.nextUrl.pathname.startsWith('/marketplace')
  ) {
    return NextResponse.next();
  }

  // If no token and trying to access protected route
  if (!token) {
    if (!isAuthPage && (request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/api/admin'))) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // If token exists, verify it
  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'fallback_secret_key_change_in_production'
    );
    await jwtVerify(token, secret);

    // If verified and on login page, redirect to admin
    if (isAuthPage) {
      const adminUrl = new URL('/admin', request.url);
      return NextResponse.redirect(adminUrl);
    }

    return NextResponse.next();
  } catch (error) {
    // Invalid token
    if (!isAuthPage && (request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/api/admin'))) {
      const loginUrl = new URL('/login', request.url);
      // Clear invalid cookie
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('auth_token');
      return response;
    }
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/login', '/marketplace/:path*', '/api/marketplace/:path*'],
};
