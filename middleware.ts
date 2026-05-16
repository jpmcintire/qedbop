import { NextResponse } from 'next/server';

// Explicit no-op middleware. The deployed binary at Railway was still
// serving 307 redirects from /poems even after middleware.ts was deleted
// (likely Auth.js auto-registering middleware behavior via the
// NextAuth() call in lib/auth.ts, OR Railway's cached Next.js build
// output retaining the old compiled middleware). This file overrides
// any inherited behavior with an explicit "do nothing, then move on."
export function middleware() {
  return NextResponse.next();
}

// Matcher that matches nothing. Combined with the no-op above, this
// guarantees no request is intercepted by middleware regardless of
// what other code does.
export const config = {
  matcher: ['/__nothing_will_ever_match_this__'],
};
