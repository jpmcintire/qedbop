import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

// The `authorized` callback in auth.config.ts decides which paths require
// auth. Auth.js handles the redirect to /auth/signin when authorized() is
// false. Custom redirect logic (e.g., non-admins hitting /admin) can be
// added by wrapping with auth((req) => {...}) — but Auth.js's default
// behavior already gives us 99% of what we need.
export const { auth: middleware } = NextAuth(authConfig);

// Match every request EXCEPT Next.js internals, the NextAuth API routes
// (Auth.js handles those without needing middleware), and static files.
// Matching everything else lets the authorized callback decide.
export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
