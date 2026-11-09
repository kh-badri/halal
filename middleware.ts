import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.SESSION_SECRET || 'roadtohalal_super_secret_jwt_key_at_least_32_chars_2026';
const key = new TextEncoder().encode(JWT_SECRET);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('roadtohalal_session')?.value || req.cookies.get('nikahku_session')?.value;

  let isValidSession = false;
  let isAdmin = false;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
      isValidSession = !!payload;
      isAdmin = !!payload.isAdmin;
    } catch {
      isValidSession = false;
    }
  }

  const isAuthPage =
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/lupa-password' ||
    pathname === '/reset-password';

  const isProtectedPage =
    pathname.startsWith('/rute') ||
    pathname.startsWith('/beranda') ||
    pathname.startsWith('/tahap') ||
    pathname.startsWith('/anggota') ||
    pathname.startsWith('/pengaturan') ||
    pathname.startsWith('/modul') ||
    pathname.startsWith('/taaruf') ||
    pathname.startsWith('/khitbah') ||
    pathname.startsWith('/budget') ||
    pathname.startsWith('/kua') ||
    pathname.startsWith('/hari-h') ||
    pathname.startsWith('/profil') ||
    pathname.startsWith('/admin');

  // 1. Redirect unauthenticated users to /login
  if (isProtectedPage && !isValidSession) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Protect /admin specifically
  if (pathname.startsWith('/admin') && !isAdmin) {
    return NextResponse.redirect(new URL('/rute', req.url));
  }

  // 3. Redirect authenticated users away from /login & /register
  if (isAuthPage && isValidSession) {
    return NextResponse.redirect(new URL('/rute', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/rute/:path*',
    '/beranda/:path*',
    '/tahap/:path*',
    '/anggota/:path*',
    '/pengaturan/:path*',
    '/modul/:path*',
    '/taaruf/:path*',
    '/khitbah/:path*',
    '/budget/:path*',
    '/kua/:path*',
    '/hari-h/:path*',
    '/profil/:path*',
    '/admin/:path*',
    '/login',
    '/register',
    '/lupa-password',
    '/reset-password',
  ],
};
