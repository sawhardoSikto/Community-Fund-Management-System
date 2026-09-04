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
    case 'members':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
    case 'payments':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      );
    case 'my-payment':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'projects':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      );
    case 'fines':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    default:
      return null;
  }
};

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, msg: '', success: true });

  const [allUsers, setAllUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [overallStatus, setOverallStatus] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [fines, setFines] = useState([]);
  const [fineForm, setFineForm] = useState({ userId: '', amount: '', reason: '', customReason: '' });

  const [userForm, setUserForm] = useState({ name: '', email: '', phone: '', nid: '', role: 'member', monthlyAmount: '200' });
  const [editingUser, setEditingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [processing, setProcessing] = useState(null);

  const showToast = (msg, success = true) => {
    setToast({ show: true, msg, success });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  };



  useEffect(() => {
    try {
      const u = localStorage.getItem('user');
      const userData = u && u !== 'undefined' ? JSON.parse(u) : null;
      if (!userData || userData.role !== 'admin') return router.push('/login');
      setUser(userData);
      fetchAll();
    } catch { router.push('/login'); }
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [usersRes, projectsRes, overallRes, sheetsRes, finesRes] = await Promise.all([
        api.get('/users'),
        api.get('/projects'),
        api.get('/sheets/overall-status'),
        api.get('/sheets'),
        api.get('/fines'),
      ]);
      setAllUsers(usersRes.data || []);
      setProjects(projectsRes.data.data || []);
      setOverallStatus(overallRes.data.data);
      setSheets(sheetsRes.data.data || []);
      setFines(finesRes.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleFineSubmit = async (e) => {
    e.preventDefault();
    if (!fineForm.userId) return showToast('সদস্য সিলেক্ট করুন', false);
    const amountNum = Number(fineForm.amount);
    if (isNaN(amountNum) || amountNum <= 0) return showToast('সদস্যের জন্য সঠিক জরিমানার পরিমাণ লিখুন', false);
    const finalReason = fineForm.reason === 'অন্যান্য' ? fineForm.customReason : fineForm.reason;
    if (!finalReason) return showToast('জরিমানার কারণ লিখুন', false);

    setSubmitting(true);
    try {
      await api.post('/fines', {
        userId: Number(fineForm.userId),
        amount: amountNum,
        reason: finalReason,
      });
      showToast('জরিমানা সফলভাবে ধার্য করা হয়েছে');
      setFineForm({ userId: '', amount: '', reason: '', customReason: '' });
      fetchAll();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'জরিমানা করতে ব্যর্থ হয়েছে', false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFineDelete = async (id) => {
    if (!confirm('আপনি কি নিশ্চিত যে জরিমানাটি বাতিল করতে চান?')) return;
    try {
      await api.delete(`/fines/${id}`);
      showToast('জরিমানা বাতিল করা হয়েছে');
      fetchAll();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'জরিমানা বাতিল করতে ব্যর্থ হয়েছে', false);
    }
  };

  const handleUserUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.patch(`/users/${editingUser.id}`, { ...userForm, monthlyAmount: parseInt(userForm.monthlyAmount) });
      showToast('সদস্য আপডেট হয়েছে!');
      setEditingUser(null);
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'ব্যর্থ হয়েছে', false);
    } finally { setSubmitting(false); }
  };

  const handleUserDelete = async (userId) => {
    if (!confirm('এই সদস্যকে মুছে ফেলবেন?')) return;
    setProcessing(userId);
    try {
      await api.delete(`/users/${userId}`);
      showToast('সদস্য মুছে ফেলা হয়েছে');
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'ব্যর্থ হয়েছে', false);
    } finally { setProcessing(null); }
  };

  const handleUserApprove = async (userId) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই সদস্যকে অনুমোদন করতে চান?')) return;
    setProcessing(userId);
    try {
      await api.patch(`/users/${userId}`, { isApproved: true });
      showToast('সদস্য অনুমোদন করা হয়েছে');
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'ব্যর্থ হয়েছে', false);
    } finally { setProcessing(null); }
  };





  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <span className="loading loading-spinner loading-lg text-amber-400" />
    </div>
  );

  const pendingMembers = allUsers.filter(u => !u.isApproved);
  const members = allUsers.filter(u => u.role === 'member' && u.isApproved);
  const staffs = allUsers.filter(u => u.role !== 'member' && u.isApproved);

  const TABS = [
    { key: 'overview', label: 'সারসংক্ষেপ' },
    { key: 'members', label: 'সদস্য', count: pendingMembers.length },
    { key: 'my-payment', label: 'আমার পেমেন্ট' },
    { key: 'projects', label: 'প্রজেক্ট' },
    { key: 'fines', label: 'জরিমানা' },
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

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <h3 className="text-base font-bold text-white">সদস্য সম্পাদনা</h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleUserUpdate} className="px-6 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">নাম</label>
                  <input type="text" value={userForm.name} onChange={e => setUserForm(f => ({ ...f, name: e.target.value }))} required
                    className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400/50 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">ফোন</label>
                  <input type="tel" value={userForm.phone} onChange={e => setUserForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400/50 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">ভূমিকা</label>
                <select value={userForm.role} onChange={e => setUserForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400/50 transition-all">
                  <option value="member">সদস্য</option>
                  <option value="accountant">হিসাবরক্ষক</option>
                  <option value="general_secretary">সাধারণ সম্পাদক</option>
                  <option value="admin">সভাপতি</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">মাসিক চাঁদা</label>
                <select value={userForm.monthlyAmount} onChange={e => setUserForm(f => ({ ...f, monthlyAmount: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400/50 transition-all">
                  <option value="200">২০০ ৳</option>
                  <option value="400">৪০০ ৳ (২X)</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setEditingUser(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-sm">বাতিল</button>
                <button type="submit" disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl text-sm disabled:opacity-60">
                  {submitting && <span className="loading loading-spinner loading-xs" />}সংরক্ষণ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">স্বাগতম, {user?.name}! 👋</h1>
            <p className="text-slate-400 text-sm mt-0.5">সভাপতি প্যানেল</p>
          </div>
          <span className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold rounded-xl">👑 সভাপতি</span>
        </div>

        {/* Overall Status */}
        {overallStatus && (
          <div className="mb-6 bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-2xl p-5">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 text-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </span>
              সামগ্রিক ফান্ড অবস্থা
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'হাতে আছে', value: `${Number(overallStatus.cashInHand).toFixed(0)} ৳`, color: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/10' },
                { label: 'বিনিয়োগকৃত', value: `${Number(overallStatus.totalInvested).toFixed(0)} ৳`, color: 'text-blue-400', bg: 'bg-blue-500/5 border-blue-500/10' },
                { label: 'নিট লাভ/ক্ষতি', value: `${Number(overallStatus.totalProfit).toFixed(0)} ৳`, color: Number(overallStatus.totalProfit) >= 0 ? 'text-purple-400' : 'text-red-400', bg: Number(overallStatus.totalProfit) >= 0 ? 'bg-purple-500/5 border-purple-500/10' : 'bg-red-500/5 border-red-500/10' },
                { label: 'মোট সম্পদ', value: `${Number(overallStatus.totalAsset).toFixed(0)} ৳`, color: 'text-amber-400', bg: 'bg-amber-500/5 border-amber-500/10' },
              ].map((item, i) => (
                <div key={i} className={`flex flex-col items-center justify-center p-4 rounded-xl border ${item.bg}`}>
                  <span className={`text-lg sm:text-xl font-black ${item.color}`}>{item.value}</span>
                  <span className="text-xs text-slate-400 mt-1">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { label: 'মোট সদস্য', value: allUsers.length, icon: '👥' },
            { label: 'প্রজেক্ট', value: projects.length, icon: '📁' },
          ].map((s, i) => (
            <div key={i} className="bg-slate-900/50 border rounded-2xl border-white/5 p-4 text-center">
              <p className="text-2xl mb-1">{s.icon}</p>
              <p className="text-2xl font-black text-white">{s.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

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
                    {t.count > 0 && <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-black shrink-0">{t.count}</span>}
                  </button>
                );
              })}
              <Link
                href="/dashboard/ledger"
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all group text-slate-400 hover:text-white hover:bg-white/5 ml-auto border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>আয়-ব্যয় রিপোর্ট</span>
              </Link>
            </div>

            {/* Overview */}
            {tab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
                  <h2 className="text-base font-bold text-white mb-4">সাম্প্রতিক শিট</h2>
                  {sheets.length === 0 ? <p className="text-slate-500 text-sm py-6 text-center">কোনো শিট নেই</p> : (
                    <div className="space-y-2">
                      {sheets.slice(0, 5).map(sheet => (
                        <div key={sheet.id} className="flex items-center justify-between px-4 py-3 bg-slate-800/50 rounded-xl">
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
                  )}
                </div>
                <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
                  <h2 className="text-base font-bold text-white mb-4">প্রজেক্ট সারসংক্ষেপ</h2>
                  {projects.length === 0 ? <p className="text-slate-500 text-sm py-6 text-center">কোনো প্রজেক্ট নেই</p> : (
                    <div className="space-y-2">
                      {projects.map(project => (
                        <Link key={project.id} href={`/projects/${project.id}`}
                          className="block px-4 py-3 bg-slate-800/50 hover:bg-slate-800/80 border border-white/0 hover:border-white/5 rounded-xl transition-all">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-bold text-white">{project.name}</p>
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
                          <div className="flex gap-3">
                            <span className="text-xs text-red-400">বিনিয়োগ: {Number(project.totalInvested).toFixed(0)} ৳</span>
                            {project.summary && <span className="text-xs text-emerald-400">মুনাফা: {Number(project.summary.totalProfit).toFixed(0)} ৳</span>}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Members */}
            {tab === 'members' && (
              <div className="space-y-4">
                {pendingMembers.length > 0 && (
                  <div className="bg-slate-900/50 border border-amber-500/20 rounded-2xl p-5">
                    <h2 className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      অনুমোদনের অপেক্ষায় থাকা সদস্য ({pendingMembers.length})
                    </h2>
                    <div className="space-y-2">
                      {pendingMembers.map(u => (
                        <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                          <div className="flex items-center gap-3 min-w-0 w-full">
                            <UserAvatar user={u} className="w-9 h-9 rounded-xl overflow-hidden shrink-0 text-sm" gradient="from-amber-400/20 to-orange-500/20" />
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-white truncate">{u.name}</p>
                              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                <p className="text-xs text-slate-400 truncate">{u.phone || u.email}</p>
                                <span className="text-[10px] sm:text-xs text-amber-400/80 font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded-lg shrink-0">{u.monthlyAmount} ৳/মাস</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end sm:justify-start">
                            <button onClick={() => handleUserApprove(u.id)} disabled={processing === u.id}
                              className="flex-1 sm:flex-initial justify-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1">
                              {processing === u.id ? <span className="loading loading-spinner loading-xs" /> : "অনুমোদন"}
                            </button>
                            <button onClick={() => handleUserDelete(u.id)} disabled={processing === u.id}
                              className="flex-1 sm:flex-initial justify-center px-3 py-1.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white text-xs font-bold border border-red-500/20 rounded-lg transition-all cursor-pointer disabled:opacity-50">
                              প্রত্যাখ্যান
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
                  <h2 className="text-sm font-bold text-amber-400 mb-3">পদস্থ সদস্য ({staffs.length})</h2>
                  <div className="space-y-2">
                    {staffs.map(u => (
                      <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-slate-800/50 rounded-xl">
                        <div className="flex items-center gap-3 min-w-0 w-full">
                          <UserAvatar user={u} className="w-9 h-9 rounded-xl overflow-hidden shrink-0 text-sm" gradient="from-amber-400 to-orange-500" />
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white truncate">{u.name}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-0.5">
                              <p className="text-xs text-slate-400 truncate max-w-[140px] sm:max-w-xs">{u.email}</p>
                              <span className="text-[10px] sm:text-xs text-amber-400 font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded-lg shrink-0">{u.monthlyAmount} ৳/মাস</span>
                            </div>
                            {u.dueAmount > 0 ? (
                              <p className="text-xs font-bold text-rose-400 mt-0.5">বকেয়া: {u.dueAmount} ৳</p>
                            ) : (
                              <p className="text-xs font-bold text-emerald-400 mt-0.5">বকেয়া নেই</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto shrink-0 border-t border-white/5 sm:border-0 pt-2 sm:pt-0">
                          <span className="text-xs font-semibold px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-lg">{ROLE_LABELS[u.role]}</span>
                          <button onClick={() => { setEditingUser(u); setUserForm({ name: u.name, email: u.email, phone: u.phone || '', nid: u.nid || '', role: u.role, monthlyAmount: u.monthlyAmount?.toString() || '200' }); }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
                  <h2 className="text-sm font-bold text-slate-300 mb-3">সাধারণ সদস্য ({members.length})</h2>
                  <div className="space-y-2">
                    {members.map(u => (
                      <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-slate-800/50 rounded-xl">
                        <div className="flex items-center gap-3 min-w-0 w-full">
                          <UserAvatar user={u} className="w-9 h-9 rounded-xl overflow-hidden shrink-0 text-sm" gradient="from-slate-600 to-slate-700" />
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white truncate">{u.name}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-0.5">
                              <p className="text-xs text-slate-400 truncate max-w-[140px] sm:max-w-xs">{u.phone || u.email}</p>
                              <span className="text-[10px] sm:text-xs text-amber-400 font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded-lg shrink-0">{u.monthlyAmount} ৳/মাস</span>
                            </div>
                            {u.dueAmount > 0 ? (
                              <p className="text-xs font-bold text-rose-400 mt-0.5">বকেয়া: {u.dueAmount} ৳</p>
                            ) : (
                              <p className="text-xs font-bold text-emerald-400 mt-0.5">বকেয়া নেই</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-1 w-full sm:w-auto shrink-0 border-t border-white/5 sm:border-0 pt-2 sm:pt-0">
                          <button onClick={() => { setEditingUser(u); setUserForm({ name: u.name, email: u.email, phone: u.phone || '', nid: u.nid || '', role: u.role, monthlyAmount: u.monthlyAmount?.toString() || '200' }); }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                          </button>
                          <button onClick={() => handleUserDelete(u.id)} disabled={processing === u.id}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50">
                            {processing === u.id ? <span className="loading loading-spinner loading-xs" /> : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}



            {/* My Payment */}
            {tab === 'my-payment' && (
              <div className="max-w-md">
                <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
                  <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 text-sm">💰</span>
                    আমার মাসিক পেমেন্ট
                  </h2>
                  <PaymentForm user={user} onSuccess={(msg) => showToast(msg)} />
                </div>
              </div>
            )}

            {/* Projects */}
            {tab === 'projects' && (
              <div className="space-y-4 max-w-4xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-white">সব প্রজেক্ট ({projects.length})</h2>
                </div>
                {projects.length === 0 ? (
                  <p className="text-center text-slate-500 py-12 bg-slate-900/50 border border-white/5 rounded-2xl">কোনো প্রজেক্ট নেই</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects.map(project => (
                      <div key={project.id} className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <Link href={`/projects/${project.id}`} className="group flex-1">
                              <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                                {project.name}
                                <span className="text-xs font-normal text-amber-500/80 group-hover:text-amber-400">→</span>
                              </h3>
                              {project.description && <p className="text-xs text-slate-400 mt-0.5">{project.description}</p>}
                            </Link>
                            {project.status === 'active' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                সক্রিয়
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border bg-slate-800 text-slate-400 border-white/5 shrink-0">
                                সম্পন্ন
                              </span>
                            )}
                          </div>
                          {project.summary && (
                            <Link href={`/projects/${project.id}`} className="grid grid-cols-2 gap-2 mb-3 mt-4 block hover:opacity-90 transition-opacity">
                              {[
                                { label: 'বিনিয়োগ', value: `${Number(project.totalInvested || 0).toFixed(0)} ৳`, color: 'text-red-400' },
                                { label: 'মুনাফা', value: `${Number(project.summary.totalProfit).toFixed(0)} ৳`, color: 'text-emerald-400' },
                                { label: 'ফেরত', value: `${Number(project.summary.capitalReturn).toFixed(0)} ৳`, color: 'text-blue-400' },
                                { label: 'বাইরে', value: `${Number(project.summary.stillOutside).toFixed(0)} ৳`, color: 'text-amber-400' },
                              ].map((s, i) => (
                                <div key={i} className="bg-slate-800/50 rounded-xl p-2.5 text-center">
                                  <p className={`text-sm font-black ${s.color}`}>{s.value}</p>
                                  <p className="text-[10px] text-slate-500 mt-0.5">{s.label}</p>
                                </div>
                              ))}
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Fines */}
            {tab === 'fines' && (
              <div className="space-y-6 max-w-4xl">
                {/* Create Fine Form */}
                <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
                  <h2 className="text-base font-bold text-white mb-4">নতুন জরিমানা ধার্য করুন</h2>
                  <form onSubmit={handleFineSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5">সদস্য নির্বাচন করুন</label>
                        <select
                          value={fineForm.userId}
                          onChange={(e) => setFineForm({ ...fineForm, userId: e.target.value })}
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                        >
                          <option value="">সদস্য সিলেক্ট করুন</option>
                          {allUsers.filter(u => u.isApproved).map(u => (
                            <option key={u.id} value={u.id}>
                              {u.name} — {u.role === 'admin' ? 'এডমিন' : u.role === 'accountant' ? 'হিসাবরক্ষক' : u.role === 'secretary' ? 'সেক্রেটারি' : 'সদস্য'}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5">জরিমানার পরিমাণ (৳)</label>
                        <input
                          type="number"
                          placeholder="যেমন: ১০০"
                          value={fineForm.amount}
                          onChange={(e) => setFineForm({ ...fineForm, amount: e.target.value })}
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5">জরিমানার कारण</label>
                        <select
                          value={fineForm.reason}
                          onChange={(e) => setFineForm({ ...fineForm, reason: e.target.value, customReason: '' })}
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                        >
                          <option value="">কারণ সিলেক্ট করুন</option>
                          <option value="মিটিং অনুপস্থিতি">মিটিং অনুপস্থিতি</option>
                          <option value="দেরিতে ফি প্রদান">দেরিতে ফি প্রদান</option>
                          <option value="অন্যান্য">অন্যান্য (নিজে লিখুন)</option>
                        </select>
                      </div>
                    </div>

                    {fineForm.reason === 'অন্যান্য' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5">অন্যান্য কারণ লিখুন</label>
                        <input
                          type="text"
                          placeholder="কারণ লিখুন..."
                          value={fineForm.customReason}
                          onChange={(e) => setFineForm({ ...fineForm, customReason: e.target.value })}
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all"
                    >
                      {submitting ? 'প্রক্রিয়াধীন...' : 'জরিমানা ধার্য করুন'}
                    </button>
                  </form>
                </div>

                {/* Fines List */}
                <div className="space-y-6">
                  {/* Total Pending Fines Card */}
                  {fines.filter(f => f.status === 'pending').length > 0 && (
                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-rose-400">মোট বকেয়া জরিমানা</p>
                        <h3 className="text-2xl font-black text-white mt-1">
                          {fines.filter(f => f.status === 'pending').reduce((sum, f) => sum + Number(f.amount), 0).toFixed(0)} ৳
                        </h3>
                      </div>
                      <div className="text-3xl">⚠️</div>
                    </div>
                  )}

                  {/* Pending Fines Table */}
                  <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
                    <h2 className="text-base font-bold text-white mb-4">
                      বকেয়া জরিমানা তালিকা ({fines.filter(f => f.status === 'pending').length})
                    </h2>
                    {fines.filter(f => f.status === 'pending').length === 0 ? (
                      <p className="text-center text-slate-500 py-6 text-sm">কোনো বকেয়া জরিমানা নেই</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-white/5 text-slate-400 font-semibold">
                              <th className="py-3 px-4">সদস্য</th>
                              <th className="py-3 px-4">জরিমানার সংখ্যা</th>
                              <th className="py-3 px-4">কারণসমূহ</th>
                              <th className="py-3 px-4">মোট বকেয়া</th>
                              <th className="py-3 px-4 text-right">অ্যাকশন</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const pending = fines.filter(f => f.status === 'pending');
                              const grouped = pending.reduce((acc, f) => {
                                const uid = f.userId;
                                if (!acc[uid]) {
                                  acc[uid] = {
                                    userName: f.user?.name || `সদস্য আইডি: ${uid}`,
                                    total: 0,
                                    items: []
                                  };
                                }
                                acc[uid].total += Number(f.amount);
                                acc[uid].items.push(f);
                                return acc;
                              }, {});
                              
                              return Object.entries(grouped).map(([uid, data]) => (
                                <tr key={uid} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                  <td className="py-3 px-4 text-white font-medium">{data.userName}</td>
                                  <td className="py-3 px-4 text-slate-400 font-bold">{data.items.length}টি</td>
                                  <td className="py-3 px-4 text-slate-300">
                                    <div className="space-y-1">
                                      {data.items.map((item) => (
                                        <div key={item.id} className="flex items-center gap-1.5 text-[11px] text-slate-400">
                                          <span>• {item.reason} ({Number(item.amount).toFixed(0)} ৳)</span>
                                          <button
                                            onClick={() => handleFineDelete(item.id)}
                                            className="text-rose-400 hover:text-rose-500 font-semibold hover:underline"
                                            title="এই জরিমানাটি বাতিল করুন"
                                          >
                                            [বাতিল]
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-rose-400 font-bold">{data.total.toFixed(0)} ৳</td>
                                  <td className="py-3 px-4 text-right">
                                    <button
                                      onClick={() => {
                                        if (confirm(`${data.userName} এর সকল (${data.items.length}টি) বকেয়া জরিমানা বাতিল করতে চান?`)) {
                                          data.items.forEach(item => handleFineDelete(item.id));
                                        }
                                      }}
                                      className="px-2 py-1 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded border border-red-500/20 transition-all font-semibold"
                                    >
                                      সব বাতিল
                                    </button>
                                  </td>
                                </tr>
                              ));
                            })()}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Paid Fines Table */}
                  <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
                    <h2 className="text-base font-bold text-white mb-4">
                      পরিশোধিত জরিমানা তালিকা ({fines.filter(f => f.status === 'paid').length})
                    </h2>
                    {fines.filter(f => f.status === 'paid').length === 0 ? (
                      <p className="text-center text-slate-500 py-6 text-sm">কোনো পরিশোধিত জরিমানা নেই</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-white/5 text-slate-400 font-semibold">
                              <th className="py-3 px-4">সদস্য</th>
                              <th className="py-3 px-4">অ্যামাউন্ট</th>
                              <th className="py-3 px-4">কারণ</th>
                              <th className="py-3 px-4">তারিখ</th>
                              <th className="py-3 px-4">স্ট্যাটাস</th>
                            </tr>
                          </thead>
                          <tbody>
                            {fines.filter(f => f.status === 'paid').map((fine) => (
                              <tr key={fine.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="py-3 px-4 text-white font-medium">{fine.user?.name || `User ID: ${fine.userId}`}</td>
                                <td className="py-3 px-4 text-emerald-400 font-bold">{Number(fine.amount).toFixed(0)} ৳</td>
                                <td className="py-3 px-4 text-slate-300">{fine.reason}</td>
                                <td className="py-3 px-4 text-slate-400">{new Date(fine.createdAt).toLocaleDateString('bn-BD')}</td>
                                <td className="py-3 px-4">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                                    পরিশোধিত
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}


          </div>

          {/* Right Column - Notice Board */}
          <div className="lg:col-span-1 space-y-6">
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
            <NoticeBoard user={user} />
          </div>
        </div>
      </div>
    </div>
  );
}