'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { MONTH_NAMES } from '@/lib/constants';
import api from '@/lib/api';

export default function SheetsPage() {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/sheets').then(res => {
      setSheets(res.data.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <span className="loading loading-spinner loading-lg text-amber-400" />
    </div>
  );

  const published = sheets.filter(s => s.status === 'published');
  const drafts = sheets.filter(s => s.status === 'draft');

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-white">মাসিক শিট</h1>
          <p className="text-slate-400 text-sm mt-1">সকল মাসের আয়-ব্যয়ের হিসাব</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-8">
          {[
            { label: 'প্রকাশিত', value: published.length, color: 'text-emerald-400' },
            { label: 'খসড়া', value: drafts.length, color: 'text-amber-400' },
          ].map((s, i) => (
            <div key={i} className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 text-center">
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {sheets.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">📋</p>
            <p className="text-slate-400">কোনো শিট নেই</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sheets.map(sheet => (
              <Link key={sheet.id} href={`/sheets/${sheet.id}`}
                className="flex items-center justify-between bg-slate-900/50 border border-white/5 hover:border-amber-500/20 rounded-2xl p-5 transition-all group">
                <div>
                  <p className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                    {MONTH_NAMES[sheet.month - 1]} {sheet.year}
                  </p>
                  <div className="flex gap-3 mt-1.5">
                    <span className="text-xs text-emerald-400">আয়: {(Number(sheet.totalMemberIncome) + Number(sheet.totalProjectIncome)).toFixed(0)} ৳</span>
                    <span className="text-xs text-red-400">ব্যয়: {(Number(sheet.totalSalary) + Number(sheet.totalProjectExpense || 0)).toFixed(0)} ৳</span>
                    <span className="text-xs text-amber-400">হাতে: {Number(sheet.cashInHand).toFixed(0)} ৳</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-black text-white">{Number(sheet.totalAsset).toFixed(0)} ৳</p>
                    <p className="text-xs text-slate-400">মোট সম্পদ</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg shrink-0 ${sheet.status === 'published' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                    {sheet.status === 'published' ? '✅ প্রকাশিত' : '📝 খসড়া'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}