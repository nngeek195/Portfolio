'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged, onIdTokenChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';
import { LayoutDashboard, Import, Image as ImageIcon, LogOut, Award } from 'lucide-react';
import Cookies from 'js-cookie';

// Keeps the admin_session cookie holding a current Firebase ID token. ID tokens
// expire after 1 hour; the admin API routes verify the token (lib/admin-session),
// so the cookie is refreshed whenever Firebase issues a new one. Same cookie,
// same options as the login page sets.
async function refreshSessionCookie(user: User) {
  try {
    Cookies.set('admin_session', await user.getIdToken(), { expires: 1, path: '/', sameSite: 'strict' });
  } catch (error) {
    console.error('Could not refresh admin session cookie:', error);
  }
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // Refresh the cookie before the page renders, so its first API calls are authorised.
      if (currentUser) await refreshSessionCookie(currentUser);
      setUser(currentUser);
      setLoading(false);
      
      // Redirect to login if not authenticated and not already on the login page
      if (!currentUser && pathname !== '/admin/login') {
        router.push('/admin/login');
      }
    });
    return () => unsubscribe();
  }, [pathname, router]);

  // Firebase refreshes the ID token about once an hour while the admin is open.
  useEffect(() => onIdTokenChanged(auth, (currentUser) => {
    if (currentUser) refreshSessionCookie(currentUser);
  }), []);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-cyan-400">Loading Access...</div>;

  // If on login page, just render the login form without the sidebar
  if (pathname === '/admin/login') return <>{children}</>;

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-black border-r border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Admin Control</h2>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin/dashboard" className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${pathname === '/admin/dashboard' ? 'bg-cyan-900/30 text-cyan-400' : 'text-slate-400 hover:bg-gray-900'}`}>
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link href="/admin/dashboard/importers" className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${pathname === '/admin/dashboard/importers' ? 'bg-cyan-900/30 text-cyan-400' : 'text-slate-400 hover:bg-gray-900'}`}>
            <Import size={20} /> Importers & Sync
          </Link>
          <Link href="/admin/dashboard/certificates" className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${pathname === '/admin/dashboard/certificates' ? 'bg-cyan-900/30 text-cyan-400' : 'text-slate-400 hover:bg-gray-900'}`}>
            <Award size={20} /> Certificates
          </Link>
          <Link href="/admin/dashboard/media" className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${pathname === '/admin/dashboard/media' ? 'bg-cyan-900/30 text-cyan-400' : 'text-slate-400 hover:bg-gray-900'}`}>
            <ImageIcon size={20} /> Media Showcase
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-800">
          
            <button 
            onClick={async () => {
                await auth.signOut();
                Cookies.remove('admin_session', { path: '/' }); // Clear cookie
                router.push('/admin/login');
            }}
            className="flex items-center gap-3 p-3 w-full rounded-lg text-red-400 hover:bg-red-950/30 transition-colors"
            >
            <LogOut size={20} /> Sign Out
            </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto custom-scrollbar">
        {children}
      </main>
    </div>
  );
}