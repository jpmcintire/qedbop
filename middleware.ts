import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from '@/lib/auth.config';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthed = !!req.auth?.user?.id;
  const isAdmin = req.auth?.user?.role === 'ADMIN';

  if (pathname.startsWith('/app') && !isAuthed) {
    const url = req.nextUrl.clone();
    url.pathname = '/auth/signin';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
  if (pathname.startsWith('/admin') && !isAdmin) {
    const url = req.nextUrl.clone();
    url.pathname = isAuthed ? '/app/dashboard' : '/auth/signin';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ['/app/:path*', '/admin/:path*'],
};
