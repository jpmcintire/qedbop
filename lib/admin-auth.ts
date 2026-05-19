import 'server-only';
import { cookies } from 'next/headers';
import { createHash } from 'crypto';

// Lightweight admin gate. Not a full auth system — a single shared
// password (ADMIN_PASSWORD env) protects all of /admin. The session
// cookie stores a hash of the password; if the env password changes,
// existing sessions invalidate automatically. httpOnly so client JS
// can't read it.

const COOKIE_NAME = 'qedbop_admin';
const SALT = 'qedbop-admin-v1';

function expectedToken(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  return createHash('sha256').update(SALT + pw).digest('hex');
}

// True when the request carries a valid admin session cookie. When
// ADMIN_PASSWORD is unset, the gate is OPEN (returns true) so local dev
// without the env var still works — set ADMIN_PASSWORD in Railway to
// actually lock it down.
export async function isAdmin(): Promise<boolean> {
  const expected = expectedToken();
  if (!expected) return true; // no password configured → gate disabled
  const jar = await cookies();
  const got = jar.get(COOKIE_NAME)?.value;
  return got === expected;
}

// For server actions / route handlers that must refuse non-admins.
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) {
    throw new Error('Not authorized.');
  }
}

// Validate a submitted password and set the session cookie. Returns
// false on wrong password.
export async function logIn(password: string): Promise<boolean> {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return true; // gate disabled
  if (password !== pw) return false;
  const jar = await cookies();
  jar.set(COOKIE_NAME, expectedToken()!, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return true;
}

export async function logOut(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

// Whether a password is even configured (used to show/hide the logout
// button and the "gate is open" warning).
export function isGateConfigured(): boolean {
  return !!process.env.ADMIN_PASSWORD;
}
