import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { createRemoteJWKSet, jwtVerify } from 'jose';

// Server-side check of the admin session for API routes.
//
// The admin login stores the Firebase ID token in the `admin_session` cookie
// (see app/admin/login). Here that token is verified properly — Google's
// signature, this Firebase project as issuer/audience, not expired — instead
// of only checking that the cookie exists. No service-account key is needed:
// Firebase ID tokens are verified against Google's public signing keys.
//
// Optional: set ADMIN_EMAILS="you@example.com,other@example.com" in the
// environment to also require one of those sign-in emails.

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const FIREBASE_KEYS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

export type AdminSession = { uid: string; email?: string };

export async function verifyAdminToken(token: string | undefined | null): Promise<AdminSession | null> {
  if (!token || !PROJECT_ID) return null;
  try {
    const { payload } = await jwtVerify(token, FIREBASE_KEYS, {
      issuer: `https://securetoken.google.com/${PROJECT_ID}`,
      audience: PROJECT_ID,
      algorithms: ['RS256'],
    });
    if (typeof payload.sub !== 'string' || payload.sub.length === 0) return null;
    // auth_time must be in the past (small allowance for clock skew).
    if (typeof payload.auth_time === 'number' && payload.auth_time > Date.now() / 1000 + 60) return null;

    const email = typeof payload.email === 'string' ? payload.email.toLowerCase() : undefined;
    const allowed = (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    if (allowed.length > 0 && (!email || !allowed.includes(email))) return null;

    return { uid: payload.sub, email };
  } catch {
    return null; // malformed, expired, wrong project, bad signature, keys unreachable
  }
}

/** Reads the session from `Authorization: Bearer <token>` or the admin_session cookie. */
export function getAdminSession(request: NextRequest): Promise<AdminSession | null> {
  const bearer = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  return verifyAdminToken(bearer ?? request.cookies.get('admin_session')?.value);
}

export function adminSessionRequired() {
  return NextResponse.json({ error: 'Admin session required. Sign in at /admin/login.' }, { status: 401 });
}
