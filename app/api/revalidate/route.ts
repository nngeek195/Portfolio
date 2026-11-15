import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { adminSessionRequired, getAdminSession } from '@/lib/admin-session';

// Called by the admin dashboard after it saves or deletes content, so the
// public pages (cached for up to 5 minutes) show the change on the next visit
// instead of waiting for the cache to expire. Admin session required.
export async function POST(request: NextRequest) {
  if (!(await getAdminSession(request))) return adminSessionRequired();
  revalidatePath('/', 'layout'); // home, /projects, /articles (everything under the root layout)
  return NextResponse.json({ revalidated: true, at: new Date().toISOString() });
}
