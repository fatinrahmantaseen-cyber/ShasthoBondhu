/**
 * Administrator Authentication Session Storage Management.
 *
 * Security Architecture Notice:
 * -----------------------------
 * This utility stores the administrator Bearer token in the browser's `sessionStorage`.
 *
 * Benefits:
 * - Scoped strictly to the current browser tab.
 * - Automatically purged when the tab or browser is closed (unlike `localStorage`).
 * - Never sent automatically on public non-admin fetch requests.
 *
 * Remaining Security Consideration (XSS):
 * - Tokens in `sessionStorage` remain accessible to any JavaScript running in the same origin.
 * - While sessionStorage reduces persistence exposure compared to localStorage, it is NOT
 *   equivalent to an `HttpOnly; Secure; SameSite=Strict` cookie, which prevents JavaScript access.
 * - In production environments, pairing this with a strict Content Security Policy (CSP) and
 *   migrating to backend-managed HttpOnly session cookies is recommended.
 */

export interface AdminSession {
  token: string;
  username: string;
  expiresAt: number; // Unix timestamp in milliseconds
}

const STORAGE_KEY = 'shasthobondhu_admin_session';

export function getAdminSession(): AdminSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const session: AdminSession = JSON.parse(raw);
    if (!session || !session.token || !session.expiresAt) {
      clearAdminSession();
      return null;
    }

    // Check expiration
    if (Date.now() >= session.expiresAt) {
      clearAdminSession();
      return null;
    }

    return session;
  } catch {
    clearAdminSession();
    return null;
  }
}

export function setAdminSession(token: string, username: string, expiresInSeconds: number): AdminSession {
  const expiresAt = Date.now() + Math.max(60, expiresInSeconds) * 1000;
  const session: AdminSession = {
    token,
    username,
    expiresAt,
  };

  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  return session;
}

export function clearAdminSession(): void {
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(STORAGE_KEY);
  }
}

export function isAdminAuthenticated(): boolean {
  return getAdminSession() !== null;
}

