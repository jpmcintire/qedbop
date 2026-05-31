'use client';

import { useEffect, useState } from 'react';

// Lightweight fake-auth identity layer. Two named proxy identities
// ("John" and "Dante") let us exercise signed-in-only features
// without standing up real auth — which CLAUDE.md is explicit about
// not adding. Identity persists in localStorage; per-browser scope
// is a known limit of the fake layer and is fine for testing.

export type Identity = 'john' | 'dante';

export const IDENTITIES: Record<Identity, { displayName: string; role: string }> = {
  john: { displayName: 'John', role: 'High-school English teacher' },
  dante: { displayName: 'Dante', role: 'College literature professor' },
};

export const IDENTITY_LIST: Identity[] = ['john', 'dante'];

const STORAGE_KEY = 'qedbop:identity';
const CHANGE_EVENT = 'qedbop:identity-changed';

export function getIdentity(): Identity | null {
  if (typeof window === 'undefined') return null;
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === 'john' || v === 'dante' ? v : null;
}

export function signIn(id: Identity) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, id);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function signOut() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

// React hook that reads current identity and re-renders when sign-in
// state changes. Returns null on the server (no localStorage) and on
// the very first client render before useEffect runs — callers should
// treat null as "not signed in yet, possibly hydrating."
export function useIdentity(): Identity | null {
  const [identity, setIdentity] = useState<Identity | null>(null);

  useEffect(() => {
    const sync = () => setIdentity(getIdentity());
    sync();
    window.addEventListener(CHANGE_EVENT, sync);
    // Cross-tab sync via storage event
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return identity;
}
