'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

const TRANSACTION_TYPE_LABELS = {
  expense: { label: 'বিনিয়োগ', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  profit: { label: 'মুনাফা', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  capital_return: { label: 'মূলধন ফেরত', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
};

export default function ProjectDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    api.get(`/projects/${id}`)
      .then((res) => {
        const projectData = res.data?.data || res.data || null;
        if (!projectData) {
          setError('প্রজেক্টের তথ্য পাওয়া যায়নি।');
          return;
        }
        setProject(projectData);
      })
      .catch(() => {
        setError('প্রজেক্ট লোড করতে সমস্যা হয়েছে।');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <span className="loading loading-spinner loading-lg text-amber-400" />
    </div>
  );

  if (error || !project) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-slate-200 font-semibold">{error || 'প্রজেক্ট পাওয়া যায়নি'}</p>
          <button
            onClick={() => router.push('/projects')}
            className="mt-4 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl transition-all"
          >
            প্রজেক্ট তালিকায় ফিরে যান
          </button>
        </div>
      </div>
    );
  }

  const s = project.summary;
  const isCompleted = project.status === 'completed';
  const netProfit = s
    ? isCompleted
      ? s.totalProfit + s.capitalReturn - (Number(s.openingInvested) + Number(s.totalExpense))
      : s.totalProfit
    : 0;
  const isProfit = netProfit >= 0;

  // Sort transactions by date descending
  const sortedTransactions = [...(project.transactions || [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Navigation & Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link href="/projects" className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold mb-2 transition-colors">
              ← সব প্রজেক্টে ফিরে যান
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-white">{project.name}</h1>
            {project.description && <p className="text-slate-400 text-sm mt-1">{project.description}</p>}
            <div className="flex gap-4 mt-2 text-xs text-slate-500">
              {project.startDate && <span>শুরু: {new Date(project.startDate).toLocaleDateString('bn-BD')}</span>}
              {project.endDate && <span>শেষ: {new Date(project.endDate).toLocaleDateString('bn-BD')}</span>}
            </div>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-center">
            {project.status === 'active' ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                সক্রিয়
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border bg-slate-800 text-slate-400 border-white/5">
                <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                সম্পন্ন
              </span>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
          {[
            { label: 'পুরনো বিনিয়োগ', value: `${Number(s?.openingInvested || 0).toFixed(0)} ৳`, color: 'text-slate-300', bg: 'from-slate-800/50 to-slate-700/10 border-white/5' },
            { label: 'নতুন বিনিয়োগ', value: `${Number(s?.newExpense || 0).toFixed(0)} ৳`, color: 'text-red-400', bg: 'from-red-500/10 to-red-600/5 border-red-500/20' },
            { label: 'মোট মুনাফা', value: `${Number(s?.totalProfit || 0).toFixed(0)} ৳`, color: 'text-emerald-400', bg: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20' },
            { label: 'মূলধন ফেরত', value: `${Number(s?.capitalReturn || 0).toFixed(0)} ৳`, color: 'text-blue-400', bg: 'from-blue-500/10 to-blue-600/5 border-blue-500/20' },
            { label: 'এখনো বাইরে', value: `${Number(s?.stillOutside || 0).toFixed(0)} ৳`, color: 'text-amber-400', bg: 'from-amber-500/10 to-orange-500/5 border-amber-500/20' },
          ].map((item, i) => (
            <div key={i} className={`bg-gradient-to-br ${item.bg} border rounded-2xl p-4`}>
              <p className={`text-lg sm:text-xl font-black ${item.color}`}>{item.value}</p>
              <p className="text-xs text-slate-400 mt-1">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Net Profit Summary Banner */}
        <div className={`mb-8 p-4 rounded-2xl border flex items-center justify-between ${isProfit ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          <span className="text-sm font-bold">নিট প্রজেক্ট অবস্থা:</span>
          <span className="text-lg font-black">
            {isProfit ? `+${netProfit.toFixed(0)} ৳ (লাভ)` : `${netProfit.toFixed(0)} ৳ (ক্ষতি)`}
          </span>
        </div>

        {/* Transactions Table */}
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 text-sm">📋</span>
            লেনদেনের ইতিহাস
          </h2>

          {sortedTransactions.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">এই প্রজেক্টে কোনো লেনদেন পাওয়া যায়নি।</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-slate-400 text-xs font-semibold">
                    <th className="py-3 px-4">তারিখ</th>
                    <th className="py-3 px-4">ধরন</th>
                    <th className="py-3 px-4">বিবরণ</th>
                    <th className="py-3 px-4 text-right">পরিমাণ</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTransactions.map((tx) => {
                    const cfg = TRANSACTION_TYPE_LABELS[tx.type] || { label: tx.type, color: 'bg-slate-700 text-slate-300' };
                    return (
                      <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5 transition-colors text-sm text-slate-300">
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {new Date(tx.date).toLocaleDateString('bn-BD')}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs sm:max-w-md truncate">
                          {tx.description || '-'}
                        </td>
                        <td className={`py-3.5 px-4 text-right font-bold ${tx.type === 'expense' ? 'text-red-400' : tx.type === 'profit' ? 'text-emerald-400' : 'text-blue-400'}`}>
                          {tx.type === 'expense' ? '-' : '+'}{Number(tx.amount).toFixed(0)} ৳
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
