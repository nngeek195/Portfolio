'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Import, Image as ImageIcon, Activity, FileText, FolderGit2, Award, Loader2 } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function DashboardHome() {
  const [counts, setCounts] = useState({ articles: 0, projects: 0, certificates: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'curated_content'));
        let arts = 0, projs = 0, certs = 0;
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.category === 'article') arts++;
          if (data.category === 'project') projs++;
          if (data.category === 'certificate') certs++;
        });

        setCounts({ articles: arts, projects: projs, certificates: certs });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const stats = [
    { label: 'Published Articles', count: counts.articles, icon: FileText, color: 'text-blue-400' },
    { label: 'Synced Projects', count: counts.projects, icon: FolderGit2, color: 'text-cyan-400' },
    { label: 'Certificates', count: counts.certificates, icon: Award, color: 'text-emerald-400' },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-10 border-b border-gray-800 pb-6">
        <h1 className="text-3xl font-bold text-white mb-2">System Overview</h1>
        <p className="text-slate-400">Welcome back. Here is the current status of your portfolio database.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {stats.map((stat, index) => (
          <div key={index} className="bg-gray-900 border border-gray-800 p-6 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">{stat.label}</p>
              {isLoading ? (
                <Loader2 className="animate-spin text-gray-500 mt-2" size={24} />
              ) : (
                <p className="text-3xl font-bold text-white">{stat.count}</p>
              )}
            </div>
            <div className={`p-4 bg-black rounded-full border border-gray-800 ${stat.color}`}>
              <stat.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
      
      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/admin/dashboard/importers" className="group bg-gray-900 border border-gray-800 hover:border-cyan-500 p-6 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.1)] flex items-start gap-4">
          <div className="p-3 bg-cyan-950/30 rounded-lg text-cyan-400 group-hover:scale-110 transition-transform"><Import size={24} /></div>
          <div>
            <h3 className="text-lg font-bold text-slate-200 mb-1">Import & Sync Content</h3>
            <p className="text-slate-400 text-sm">Fetch the latest posts from LinkedIn, categorize them as articles or projects, and merge them with GitHub repositories.</p>
          </div>
        </Link>
        <Link href="/admin/dashboard/certificates" className="group bg-gray-900 border border-gray-800 hover:border-emerald-500 p-6 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.1)] flex items-start gap-4">
          <div className="p-3 bg-emerald-950/30 rounded-lg text-emerald-400 group-hover:scale-110 transition-transform"><Award size={24} /></div>
          <div>
            <h3 className="text-lg font-bold text-slate-200 mb-1">Manage Certificates</h3>
            <p className="text-slate-400 text-sm">Manually add or remove certificates, complete with an uploaded image or PDF and credential link.</p>
          </div>
        </Link>
        <Link href="/admin/dashboard/media" className="group bg-gray-900 border border-gray-800 hover:border-blue-500 p-6 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] flex items-start gap-4">
          <div className="p-3 bg-blue-950/30 rounded-lg text-blue-400 group-hover:scale-110 transition-transform"><ImageIcon size={24} /></div>
          <div>
            <h3 className="text-lg font-bold text-slate-200 mb-1">Manage Media Showcase</h3>
            <p className="text-slate-400 text-sm">Upload, remove, and organize the profile images displayed in the main hero section.</p>
          </div>
        </Link>
      </div>

      {/* System Status */}
      <div className="mt-12 bg-black border border-gray-800 p-6 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Activity className="text-emerald-500" size={24} />
          <div>
            <h3 className="font-bold text-slate-200">Database Connection</h3>
            <p className="text-sm text-slate-500">Connected to Firebase Firestore</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-emerald-950/30 text-emerald-400 border border-emerald-900 rounded-full text-xs font-bold uppercase tracking-wider">
          Online
        </span>
      </div>
    </div>
  );
}