// Date helpers for URL expiration. Dates are stored in URLs as ISO date
// strings (YYYY-MM-DD) and compared at day-level granularity (no time of
// day) so a URL set to expire on 2026-12-31 is valid through end of that
// day everywhere on Earth.

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function endOfCurrentMonthIso(): string {
  const now = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return last.toISOString().slice(0, 10);
}

// Default expiration for newly generated URLs. End of current month if that
// is at least 7 days from today; otherwise 30 days from today. Capped at
// 30 days from now in either case.
export function defaultExpirationIso(): string {
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  let pick = endOfMonth;
  if (endOfMonth < sevenDays) pick = thirtyDays;
  if (pick > thirtyDays) pick = thirtyDays;
  return pick.toISOString().slice(0, 10);
}

export function maxExpirationIso(): string {
  const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  return thirtyDays.toISOString().slice(0, 10);
}

// True if the given ISO date is in the past (strictly before today, by date).
// Empty/missing/invalid strings count as "not expired" (back-compat with old
// URLs created before the expiration field existed).
export function isExpired(iso: string | undefined): boolean {
  if (!iso) return false;
  const exp = new Date(`${iso}T23:59:59`);
  if (isNaN(exp.getTime())) return false;
  return Date.now() > exp.getTime();
}

export function formatExpirationFriendly(iso: string | undefined): string | null {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
