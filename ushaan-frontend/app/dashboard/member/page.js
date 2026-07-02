'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { MONTH_NAMES } from '@/lib/constants';
import NoticeBoard from '@/components/NoticeBoard';

export default function MemberDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [myPayments, setMyPayments] = useState([]);
  const [myDues, setMyDues] = useState([]);
  const [projects, setProjects] = useState([]);
  const [overallStatus, setOverallStatus] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [paymentsRes, duesRes, projectsRes, overallRes, totalPaidRes, usersRes] = await Promise.all([
        api.get('/payments/my'),
        api.get('/payments/my/dues'),
        api.get('/projects'),
        api.get('/sheets/overall-status'),
        api.get('/payments/my/total-paid'),
        api.get('/users'),
      ]);
      setMyPayments(paymentsRes.data.data || []);
      setMyDues(duesRes.data.data || []);
      setProjects(projectsRes.data.data || []);
      setOverallStatus(overallRes.data.data);
      setOverview(totalPaidRes.data);
      setAllUsers(usersRes.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    try {
      const u = localStorage.getItem('user');
      const userData = u && u !== 'undefined' ? JSON.parse(u) : null;
      if (!userData) return router.push('/login');
      if (userData.role !== 'member') {
        if (userData.role === 'admin') router.push('/dashboard/admin');
        else if (userData.role === 'accountant') router.push('/dashboard/accountant');
        else if (userData.role === 'general_secretary') router.push('/dashboard/secretary');
        else router.push('/login');
        return;
      }
      setUser(userData);
      fetchAll();
    } catch { router.push('/login'); }
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <span className="loading loading-spinner loading-lg text-amber-400" />
    </div>
  );

  const paymentCoversMonth = (p, month, year) => {
    if (p.month === month && p.year === year) return true;
    if (!p.coveredMonths) return false;
    try {
      const covered = typeof p.coveredMonths === 'string'
        ? JSON.parse(p.coveredMonths)
        : p.coveredMonths;
      return Array.isArray(covered) && covered.some(c => c.month === month && c.year === year);
    } catch {
      return false;
    }
  };

  // ✅ চলতি মাস (Current calendar month) এর payment check
  const currentMonthNum = new Date().getMonth() + 1;
  const currentYearNum = new Date().getFullYear();
  const isCurrentMonthDue = myDues.some(d => d.month === currentMonthNum && d.year === currentYearNum);
  const isCurrentMonthPending = myPayments.some(
    p => p.status === 'pending' && paymentCoversMonth(p, currentMonthNum, currentYearNum)
  );
  const isCurrentMonthPaid = !isCurrentMonthDue && !isCurrentMonthPending;


  return (
    <div className="min-h-screen bg-slate-950">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            স্বাগতম, {user?.name}! 👋
          </h1>
          <p className="text-slate-400 mt-1 text-sm">ঊষাণ কমিউনিটি ফান্ড ম্যানেজমেন্ট</p>
        </div>

        {/* Personal Status Alert Banner (HCI Visual Hierarchy) */}
        {myDues.length > 0 ? (
          <div className="mb-6 bg-gradient-to-r from-red-500/15 to-orange-500/5 border border-red-500/20 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 shrink-0 mt-0.5 animate-pulse">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </span>
              <div>
                <h3 className="text-sm font-bold text-white">আপনার চাঁদা বকেয়া রয়েছে</h3>
                <p className="text-xs text-slate-400 mt-1">
                  আপনার মোট <span className="text-red-400 font-bold">{myDues.length} মাসের</span> চাঁদা বকেয়া আছে (মোট বকেয়া: <span className="text-amber-400 font-bold">{myDues.reduce((acc, curr) => acc + Number(curr.amount), 0)} ৳</span>)। অনুগ্রহ করে দ্রুত পরিশোধ করুন।
                </p>
              </div>
            </div>
            <button 
              onClick={() => {
                router.push('/dashboard/member/pay-bill');
              }}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-red-500/25 shrink-0 self-start sm:self-center"
            >
              এখনই পরিশোধ করুন
            </button>
          </div>
        ) : (
          <div className="mb-6 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-2xl p-5 flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">আপনার কোনো বকেয়া নেই!</h3>
              <p className="text-xs text-slate-400 mt-0.5">সব পরিশোধিত করার জন্য আপনাকে ধন্যবাদ। 🎉 আপনি চাইলে পরবর্তী মাসের জন্য অগ্রিম চাঁদা দিতে পারেন।</p>
            </div>
          </div>
        )}

        {/* Stats Cards (Personal focus) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { 
              label: 'মোট পরিশোধ', 
              value: `${overview?.grandTotal || 0} ৳`, 
              sub: `ওয়েবসাইট: ${overview?.websiteTotal || 0} ৳`, 
              icon: (
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ), 
              color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/20', 
              textColor: 'text-emerald-400' 
            },
            { 
              label: 'বকেয়া মাস', 
              value: `${myDues.length} মাস`, 
              sub: myDues.length > 0 ? `বকেয়া: ${myDues.reduce((acc, curr) => acc + Number(curr.amount), 0)} ৳` : 'কোনো বকেয়া নেই', 
              icon: (
                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              ), 
              color: myDues.length > 0 ? 'from-red-500/20 to-red-600/10 border-red-500/20' : 'from-slate-800/50 to-slate-700/10 border-white/5', 
              textColor: myDues.length > 0 ? 'text-red-400' : 'text-slate-400' 
            },
            { 
              label: 'মাসিক চাঁদা', 
              value: `${user?.monthlyAmount || 200} ৳`, 
              sub: 'প্রতি মাসে', 
              icon: (
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              ), 
              color: 'from-blue-500/20 to-blue-600/10 border-blue-500/20', 
              textColor: 'text-blue-400' 
            },
            { 
              label: 'চলতি মাস', 
              value: `${MONTH_NAMES[new Date().getMonth()]}`, 
              sub: isCurrentMonthPaid ? 'পরিশোধিত' : isCurrentMonthPending ? 'অপেক্ষমাণ' : 'বকেয়া রয়েছে', 
              icon: (
                <svg className={`w-5 h-5 ${isCurrentMonthPaid ? 'text-emerald-400' : isCurrentMonthPending ? 'text-amber-400' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              ), 
              color: isCurrentMonthPaid ? 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/20' : isCurrentMonthPending ? 'from-amber-500/20 to-amber-600/10 border-amber-500/20' : 'from-slate-800/50 to-slate-700/10 border-white/5', 
              textColor: isCurrentMonthPaid ? 'text-emerald-400' : isCurrentMonthPending ? 'text-amber-400' : 'text-slate-400' 
            },
          ].map((stat, i) => (
            <div key={i} className={`bg-gradient-to-br ${stat.color} border rounded-2xl p-4 flex items-center justify-between`}>
              <div>
                <p className="text-xs text-slate-400">{stat.label}</p>
                <p className={`text-lg sm:text-2xl font-black mt-1 ${stat.textColor}`}>{stat.value}</p>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">{stat.sub}</p>
              </div>
              <div className="p-2.5 bg-white/5 rounded-xl shrink-0">
                {stat.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Grid Layout (HCI Column structure) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column (2/3 width - High Importance) */}
          <div className="lg:col-span-2 space-y-6">
            <NoticeBoard user={user} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* সদস্যদের বকেয়া তালিকা */}
              <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
                <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 text-sm">
                    ⚠️
                  </span>
                  সদস্যদের বকেয়া তালিকা
                </h2>
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {allUsers
                    .filter(u => u.isApproved && u.dueAmount > 0)
                    .sort((a, b) => b.dueAmount - a.dueAmount)
                    .map(u => (
                      <div key={u.id} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl border border-white/5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-rose-500/10 flex items-center justify-center text-rose-400 text-xs font-bold shrink-0">
                            {u.name ? u.name[0] : '👥'}
                          </div>
                          <span className="text-xs font-bold text-slate-200">{u.name}</span>
                        </div>
                        <span className="text-xs font-black text-rose-400">{u.dueAmount} ৳</span>
                      </div>
                    ))}
                  {allUsers.filter(u => u.isApproved && u.dueAmount > 0).length === 0 && (
                    <p className="text-xs text-slate-500 text-center py-4">কারো কোনো বকেয়া নেই! 🎉</p>
                  )}
                </div>
              </div>

              {/* Projects List */}
              <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 text-sm">
                      <svg className="w-4 h-4 text-purple-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </span>
                    প্রজেক্টসমূহ
                  </h2>
                  <Link href="/projects" className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-0.5">
                    সব দেখুন 
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
                {projects.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-sm">কোনো প্রজেক্ট নেই</div>
                ) : (
                  <div className="space-y-3">
                    {projects.slice(0, 3).map(project => (
                      <Link key={project.id} href={`/projects/${project.id}`}
                        className="flex items-center justify-between px-4 py-3 bg-slate-800/50 hover:bg-slate-800/80 border border-white/0 hover:border-white/5 rounded-xl transition-all">
                        <div>
                          <p className="text-sm font-semibold text-white">{project.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">বিনিয়োগ: {Number(project.totalInvested).toFixed(0)} ৳</p>
                        </div>
                        <div className="text-right">
                          {project.status === 'active' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                              <span className="w-1.5 h-1.5 bg-emerald-400 animate-pulse" />
                              সক্রিয়
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border bg-slate-800 text-slate-400 border-white/5">
                              <svg className="w-2.5 h-2.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              সম্পন্ন
                            </span>
                          )}
                          {project.summary && (
                            <p className="text-xs text-amber-400 mt-1">মুনাফা: {Number(project.summary.totalProfit).toFixed(0)} ৳</p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column (1/3 width - Secondary Importance) */}
          <div className="lg:col-span-1 space-y-6">

            {/* Overall Fund Status */}
            {overallStatus && (
              <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-2xl p-5">
                <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 text-sm">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </span>
                  সামগ্রিক ফান্ড অবস্থা
                </h2>
                <div className="space-y-3">
                  {[
                    { label: 'হাতে আছে', value: `${Number(overallStatus.cashInHand).toFixed(0)} ৳`, color: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/10' },
                    { label: 'বিনিয়োগকৃত', value: `${Number(overallStatus.totalInvested).toFixed(0)} ৳`, color: 'text-blue-400', bg: 'bg-blue-500/5 border-blue-500/10' },
                    { label: 'নিট লাভ/ক্ষতি', value: `${Number(overallStatus.totalProfit).toFixed(0)} ৳`, color: Number(overallStatus.totalProfit) >= 0 ? 'text-purple-400' : 'text-red-400', bg: Number(overallStatus.totalProfit) >= 0 ? 'bg-purple-500/5 border-purple-500/10' : 'bg-red-500/5 border-red-500/10' },
                    { label: 'মোট সম্পদ', value: `${Number(overallStatus.totalAsset).toFixed(0)} ৳`, color: 'text-amber-400', bg: 'bg-amber-500/5 border-amber-500/10' },
                  ].map((item, i) => (
                    <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${item.bg}`}>
                      <span className="text-xs text-slate-400">{item.label}</span>
                      <span className={`text-sm font-black ${item.color}`}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}