import type { NextAuthConfig } from 'next-auth';

// Edge-safe subset of the auth config. Used by middleware (which runs on the
// Edge runtime and cannot import Prisma). The full config in lib/auth.ts
// extends this with adapter + providers that need Node.
export const authConfig = {
  pages: {
    signIn: '/auth/signin',
  },
  providers: [],
  callbacks: {
    // Gate-keeper for every request that hits middleware. Returning false
    // sends the user to pages.signIn; returning true lets the request through.
    // Without this callback, Auth.js's default is to block any unauthed
    // request — which makes every public page (including /auth/signin itself)
    // redirect-loop to signin.
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isAuthed = !!auth?.user;
      const role = auth?.user?.role;

      if (pathname.startsWith('/app')) return isAuthed;
      if (pathname.startsWith('/admin')) return role === 'ADMIN';

      // Everything else (/, /poems, /auth/*, /a/[slug], /api/*) is public.
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.uid as string) ?? session.user.id;
        session.user.role = (token.role as 'TEACHER' | 'ADMIN') ?? 'TEACHER';
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
