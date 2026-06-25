'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { ROLE_LABELS } from '@/lib/constants';
import UserAvatar from '@/components/UserAvatar';

export default function MembersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  useEffect(() => {
    api.get('/users').then(res => {
      setUsers((res.data || []).filter(u => u.isApproved));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = users.filter(u => {
    const matchSearch = u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search);
    const matchRole = filterRole === 'all' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <span className="loading loading-spinner loading-lg text-amber-400" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-white">সদস্য তালিকা</h1>
          <p className="text-slate-400 text-sm mt-1">ঊষাণের সকল সদস্য</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'মোট', value: users.length, color: 'text-white' },
            { label: 'সদস্য', value: users.filter(u => u.role === 'member').length, color: 'text-blue-400' },
            { label: 'পদস্থ', value: users.filter(u => u.role !== 'member').length, color: 'text-amber-400' },
            { label: 'যাচাইকৃত', value: users.filter(u => u.isVerified).length, color: 'text-emerald-400' },
          ].map((s, i) => (
            <div key={i} className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 text-center">
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="flex-1 relative">
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="নাম, ইমেইল বা ফোন দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50 transition-all"
            />
          </div>
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
            className="px-3 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400/50 transition-all">
            <option value="all">সব ভূমিকা</option>
            <option value="member">সদস্য</option>
            <option value="admin">সভাপতি</option>
            <option value="general_secretary">সাধারণ সম্পাদক</option>
            <option value="accountant">হিসাবরক্ষক</option>
          </select>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">👥</p>
            <p className="text-slate-400 text-sm">কোনো সদস্য পাওয়া যায়নি</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(u => (
              <div key={u.id} className="flex items-center justify-between bg-slate-900/50 border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <UserAvatar user={u} className="w-11 h-11 rounded-xl overflow-hidden shrink-0 text-base" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-white">{u.name}</p>
                      {!u.isVerified && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded border border-red-500/20">অযাচাইকৃত</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{u.email}</p>
                    {u.phone && <p className="text-xs text-slate-500">{u.phone}</p>}
                    {u.dueAmount > 0 ? (
                      <p className="text-xs font-bold text-rose-400 mt-1">বকেয়া: {u.dueAmount} ৳</p>
                    ) : (
                      <p className="text-xs font-bold text-emerald-400 mt-1">বকেয়া নেই</p>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${
                    u.role === 'admin' ? 'bg-amber-500/10 text-amber-400' :
                    u.role === 'accountant' ? 'bg-blue-500/10 text-blue-400' :
                    u.role === 'general_secretary' ? 'bg-purple-500/10 text-purple-400' :
                    'bg-slate-700 text-slate-300'
                  }`}>
                    {ROLE_LABELS[u.role]}
                  </span>
                  <p className="text-xs text-slate-400 mt-1">{u.monthlyAmount} ৳/মাস</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}