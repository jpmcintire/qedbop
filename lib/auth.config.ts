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
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.uid as string) ?? session.user.id;
        session.user.role = (token.role as 'TEACHER' | 'ADMIN') ?? 'TEACHER';
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
