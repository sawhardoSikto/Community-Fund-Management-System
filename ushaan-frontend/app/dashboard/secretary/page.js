'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { MONTH_NAMES, ROLE_LABELS } from '@/lib/constants';
import UserAvatar from '@/components/UserAvatar';
import PaymentForm from '@/components/PaymentForm';
import NoticeBoard from '@/components/NoticeBoard';

const getTabIcon = (key, isActive) => {
  const activeColor = isActive ? "text-white" : "text-slate-400 group-hover:text-white";
  const className = `w-4.5 h-4.5 ${activeColor} transition-colors shrink-0`;
  switch (key) {
    case 'overview':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    case 'my-payment':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'members':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
    case 'projects':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      );
    case 'sheets':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    default:
      return null;
  }
};

export default function SecretaryDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [toast, setToast] = useState({ show: false, msg: '', success: true });
  const [overallStatus, setOverallStatus] = useState(null);
  const [projects, setProjects] = useState([]);
  const [sheets, setSheets] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [myPayments, setMyPayments] = useState([]);

  const showToast = (msg, success = true) => {
    setToast({ show: true, msg, success });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  };

  useEffect(() => {
    try {
      const u = localStorage.getItem('user');
      const userData = u && u !== 'undefined' ? JSON.parse(u) : null;
      if (!userData || userData.role !== 'general_secretary') return router.push('/login');
      setUser(userData);
      fetchAll();
    } catch { router.push('/login'); }
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [overallRes, projectsRes, sheetsRes, usersRes, paymentsRes] = await Promise.all([
        api.get('/sheets/overall-status'),
        api.get('/projects'),
        api.get('/sheets'),
        api.get('/users'),
        api.get('/payments/my'),
      ]);
      setOverallStatus(overallRes.data.data);
      setProjects(projectsRes.data.data || []);
      setSheets(sheetsRes.data.data || []);
      setAllUsers(usersRes.data || []);
      setMyPayments(paymentsRes.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <span className="loading loading-spinner loading-lg text-amber-400" />
    </div>
  );

  const TABS = [
    { key: 'overview', label: 'সারসংক্ষেপ' },
    { key: 'my-payment', label: 'আমার পেমেন্ট' },
    { key: 'members', label: 'সদস্য' },
    { key: 'projects', label: 'প্রজেক্ট' },
    { key: 'sheets', label: 'শিট' },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      {toast.show && (
        <div className="toast toast-top toast-center z-50 pt-4">
          <div className={`flex items-center gap-2 px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold ${toast.success ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
            {toast.success
              ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
              : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>}
            {toast.msg}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">স্বাগতম, {user?.name}! 👋</h1>
            <p className="text-slate-400 text-sm mt-0.5">সাধারণ সম্পাদক প্যানেল</p>
          </div>
          <span className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold rounded-xl">সাধারণ সম্পাদক</span>
        </div>

        {/* Stats */}
        {overallStatus && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'হাতে আছে', value: `${Number(overallStatus.cashInHand).toFixed(0)} ৳`, color: 'text-emerald-400', bg: 'from-emerald-500/10 border-emerald-500/20' },
              { label: 'বিনিয়োগকৃত', value: `${Number(overallStatus.totalInvested).toFixed(0)} ৳`, color: 'text-blue-400', bg: 'from-blue-500/10 border-blue-500/20' },
              { label: 'নিট লাভ/ক্ষতি', value: `${Number(overallStatus.totalProfit).toFixed(0)} ৳`, color: Number(overallStatus.totalProfit) >= 0 ? 'text-purple-400' : 'text-red-400', bg: Number(overallStatus.totalProfit) >= 0 ? 'from-purple-500/10 border-purple-500/20' : 'from-red-500/10 border-red-500/20' },
              { label: 'মোট সম্পদ', value: `${Number(overallStatus.totalAsset).toFixed(0)} ৳`, color: 'text-amber-400', bg: 'from-amber-500/10 border-amber-500/20' },
            ].map((s, i) => (
              <div key={i} className={`bg-gradient-to-br ${s.bg} border rounded-2xl p-4`}>
                <p className={`text-xl sm:text-2xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Left Column - Tabs and Tab Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 bg-slate-900/50 border border-white/5 p-1.5 rounded-2xl">
          {TABS.map(t => {
            const isActive = tab === t.key;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all group ${isActive ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                {getTabIcon(t.key, isActive)}
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
              <h2 className="text-base font-bold text-white mb-4">সাম্প্রতিক শিট</h2>
              {sheets.slice(0, 5).map(sheet => (
                <div key={sheet.id} className="flex items-center justify-between px-4 py-3 bg-slate-800/50 rounded-xl mb-2">
                  <div>
                    <p className="text-sm font-bold text-white">{MONTH_NAMES[sheet.month - 1]} {sheet.year}</p>
                    <p className="text-xs text-slate-400">হাতে: {Number(sheet.cashInHand).toFixed(0)} ৳</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/sheets/${sheet.id}`} className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg transition-colors">দেখুন</Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
              <h2 className="text-base font-bold text-white mb-4">প্রজেক্ট সারসংক্ষেপ</h2>
              {projects.map(project => (
                <Link key={project.id} href={`/projects/${project.id}`}
                  className="flex items-center justify-between px-4 py-3 bg-slate-800/50 hover:bg-slate-800/80 border border-white/0 hover:border-white/5 rounded-xl mb-2 transition-all">
                  <div>
                    <p className="text-sm font-bold text-white">{project.name}</p>
                    <p className="text-xs text-slate-400">বিনিয়োগ: {Number(project.totalInvested).toFixed(0)} ৳</p>
                  </div>
                  {project.status === 'active' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
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
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* My Payment */}
        {tab === 'my-payment' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
              <h2 className="text-base font-bold text-white mb-4">আমার মাসিক পেমেন্ট</h2>
              <PaymentForm user={user} onSuccess={(msg) => { showToast(msg); fetchAll(); }} />
            </div>
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
              <h2 className="text-base font-bold text-white mb-4">পেমেন্ট ইতিহাস</h2>
              {myPayments.length === 0 ? (
                <p className="text-center text-slate-500 text-sm py-8">কোনো পেমেন্ট নেই</p>
              ) : (
                <div className="space-y-2">
                  {myPayments.map(p => (
                    <div key={p.id} className="flex items-center justify-between px-4 py-3 bg-slate-800/50 rounded-xl">
                      <div>
                        <p className="text-sm font-semibold text-white">{MONTH_NAMES[p.month - 1]} {p.year}</p>
                        <p className="text-xs text-slate-500">{p.paymentMethod}</p>
                        {p.transactionNumber && <p className="text-xs text-amber-400">📱 {p.transactionNumber}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">{Number(p.amount).toFixed(0)} ৳</p>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border ${p.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : p.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                          {p.status === 'approved' ? 'পরিশোধিত' : p.status === 'pending' ? 'অপেক্ষমাণ' : 'বাতিল'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Members */}
        {tab === 'members' && (
          <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
            <h2 className="text-base font-bold text-white mb-4">সদস্য তালিকা ({allUsers.filter(u => u.isApproved).length})</h2>
            <div className="space-y-2">
              {allUsers.filter(u => u.isApproved).map(u => (
                <div key={u.id} className="flex items-center justify-between px-4 py-3 bg-slate-800/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <UserAvatar user={u} className="w-9 h-9 rounded-xl overflow-hidden shrink-0 text-sm" gradient="from-amber-400 to-orange-500" />
                    <div>
                      <p className="text-sm font-bold text-white">{u.name}</p>
                      <p className="text-xs text-slate-400">{u.phone || u.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-lg">{ROLE_LABELS[u.role]}</span>
                    <p className="text-xs text-slate-400 mt-1">{u.monthlyAmount} ৳/মাস</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {tab === 'projects' && (
          <div className="space-y-4">
            {projects.length === 0 ? (
              <div className="text-center py-12 text-slate-500">কোনো প্রজেক্ট নেই</div>
            ) : projects.map(project => (
              <Link key={project.id} href={`/projects/${project.id}`}
                className="block bg-slate-900/50 border border-white/5 hover:border-white/10 hover:bg-slate-900/80 rounded-2xl p-5 transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">{project.name}</h3>
                    {project.description && <p className="text-xs text-slate-400 mt-0.5">{project.description}</p>}
                  </div>
                  {project.status === 'active' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
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
                {project.summary && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { label: 'বিনিয়োগ', value: `${Number(project.summary.totalExpense).toFixed(0)} ৳`, color: 'text-red-400' },
                      { label: 'মুনাফা', value: `${Number(project.summary.totalProfit).toFixed(0)} ৳`, color: 'text-emerald-400' },
                      { label: 'ফেরত', value: `${Number(project.summary.capitalReturn).toFixed(0)} ৳`, color: 'text-blue-400' },
                      { label: 'বাইরে', value: `${Number(project.summary.stillOutside).toFixed(0)} ৳`, color: 'text-amber-400' },
                    ].map((s, i) => (
                      <div key={i} className="bg-slate-800/50 rounded-xl p-3 text-center">
                        <p className={`text-sm font-black ${s.color}`}>{s.value}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Sheets */}
        {tab === 'sheets' && (
          <div className="space-y-3">
            {sheets.length === 0 ? (
              <div className="text-center py-12 text-slate-500">কোনো শিট নেই</div>
            ) : sheets.map(sheet => (
              <div key={sheet.id} className="flex items-center justify-between bg-slate-900/50 border border-white/5 rounded-2xl p-4">
                <div>
                  <p className="text-sm font-bold text-white">{MONTH_NAMES[sheet.month - 1]} {sheet.year}</p>
                  <div className="flex gap-3 mt-1">
                    <span className="text-xs text-emerald-400">আয়: {(Number(sheet.totalMemberIncome) + Number(sheet.totalProjectIncome)).toFixed(0)} ৳</span>
                    <span className="text-xs text-red-400">ব্যয়: {Number(sheet.totalSalary).toFixed(0)} ৳</span>
                    <span className="text-xs text-amber-400">হাতে: {Number(sheet.cashInHand).toFixed(0)} ৳</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/sheets/${sheet.id}`} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition-colors">
                    দেখুন
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
          </div>

          {/* Right Column - Notice Board */}
          <div className="lg:col-span-1">
            <NoticeBoard user={user} />
          </div>
        </div>
      </div>
    </div>
  );
}