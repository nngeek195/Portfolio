'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/admin/dashboard');
    } catch (err: any) {
      console.error("Firebase Auth Error:", err);
      // This will display the exact Firebase error code on the screen
      setError(`Error: ${err.code || err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-gray-900 border border-cyan-800 p-8 rounded-2xl shadow-[0_0_40px_rgba(0,179,255,0.1)]">
        <h1 className="text-3xl font-bold text-center text-cyan-400 mb-8">System Access</h1>
        
        {error && <div className="bg-red-950/50 border border-red-500 text-red-400 p-3 rounded-lg mb-6 text-sm text-center">{error}</div>}
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-slate-400 text-sm mb-2">Admin Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black border border-gray-700 focus:border-cyan-500 rounded-lg p-3 text-white outline-none transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-gray-700 focus:border-cyan-500 rounded-lg p-3 text-white outline-none transition-colors"
              required
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-black font-bold py-3 rounded-lg transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)]"
          >
            Authenticate
          </button>
        </form>
      </div>
    </div>
  );
}