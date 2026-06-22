'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/projects').then(res => {
      setProjects(res.data.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <span className="loading loading-spinner loading-lg text-amber-400" />
    </div>
  );

  const activeProjects = projects.filter(p => p.status === 'active');
  const completedProjects = projects.filter(p => p.status === 'completed');

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-white">প্রজেক্টসমূহ</h1>
          <p className="text-slate-400 text-sm mt-1">সকল বিনিয়োগ প্রজেক্টের তালিকা</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'মোট প্রজেক্ট', value: projects.length, color: 'text-white' },
            { label: 'সক্রিয়', value: activeProjects.length, color: 'text-emerald-400' },
            { label: 'সম্পন্ন', value: completedProjects.length, color: 'text-slate-400' },
          ].map((s, i) => (
            <div key={i} className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 text-center">
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">📁</p>
            <p className="text-slate-400">কোনো প্রজেক্ট নেই</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Active */}
            {activeProjects.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  সক্রিয় প্রজেক্ট
                </h2>
                <div className="space-y-3">
                  {activeProjects.map(project => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              </div>
            )}

            {/* Completed */}
            {completedProjects.length > 0 && (
              <div className="mt-6">
                <h2 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  সম্পন্ন প্রজেক্ট
                </h2>
                <div className="space-y-3">
                  {completedProjects.map(project => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectCard({ project }) {
  const s = project.summary;
  const netProfit = s ? s.totalProfit + s.capitalReturn - s.totalExpense : 0;
  const isProfit = netProfit >= 0;

  return (
    <Link href={`/projects/${project.id}`}
      className="block bg-slate-900/50 border border-white/5 hover:border-amber-500/20 rounded-2xl p-5 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">{project.name}</h3>
          {project.description && <p className="text-xs text-slate-400 mt-0.5">{project.description}</p>}
          <div className="flex gap-2 mt-1">
            {project.startDate && <span className="text-xs text-slate-500">শুরু: {new Date(project.startDate).toLocaleDateString('bn-BD')}</span>}
            {project.endDate && <span className="text-xs text-slate-500">শেষ: {new Date(project.endDate).toLocaleDateString('bn-BD')}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {s && (
            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${isProfit ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
              {isProfit ? `+${netProfit.toFixed(0)} ৳` : `${netProfit.toFixed(0)} ৳`}
            </span>
          )}
          {project.status === 'active' ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
              সক্রিয়
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg border bg-slate-800 text-slate-400 border-white/5">
              <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              সম্পন্ন
            </span>
          )}
        </div>
      </div>

      {s && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'পুরনো বিনিয়োগ', value: `${Number(s.openingInvested).toFixed(0)} ৳`, color: 'text-slate-300', bg: 'border-slate-500/20' },
            { label: 'নতুন বিনিয়োগ', value: `${Number(s.newExpense).toFixed(0)} ৳`, color: 'text-red-400', bg: 'border-red-500/20' },
            { label: 'মোট মুনাফা', value: `${Number(s.totalProfit).toFixed(0)} ৳`, color: 'text-emerald-400', bg: 'border-emerald-500/20' },
            { label: 'মূলধন ফেরত', value: `${Number(s.capitalReturn).toFixed(0)} ৳`, color: 'text-blue-400', bg: 'border-blue-500/20' },
            { label: 'এখনো বাইরে', value: `${Number(s.stillOutside).toFixed(0)} ৳`, color: 'text-amber-400', bg: 'border-amber-500/20' },
          ].map((item, i) => (
            <div key={i} className={`bg-slate-800/50 rounded-xl p-3 text-center border ${item.bg}`}>
              <p className={`text-sm font-black ${item.color}`}>{item.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      )}
    </Link>
  );
}