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
    case 'settings':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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
  const [pendingPayments, setPendingPayments] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [currentSettings, setCurrentSettings] = useState(null);
  const [settingsForm, setSettingsForm] = useState({
    openingCashInHand: '',
    openingTotalInvested: '',
    openingTotalProfit: '',
    openingMonth: new Date().getMonth() + 1,
    openingYear: new Date().getFullYear(),
  });

  const [userForm, setUserForm] = useState({ name: '', email: '', phone: '', nid: '', role: 'member', monthlyAmount: '200' });
  const [editingUser, setEditingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [processing, setProcessing] = useState(null);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [projectForm, setProjectForm] = useState({ name: '', description: '', openingInvested: '', startDate: '', endDate: '' });

  const showToast = (msg, success = true) => {
    setToast({ show: true, msg, success });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/projects', {
        ...projectForm,
        openingInvested: parseFloat(projectForm.openingInvested) || 0,
      });
      showToast('প্রজেক্ট তৈরি হয়েছে!');
      setProjectForm({ name: '', description: '', openingInvested: '', startDate: '', endDate: '' });
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'ব্যর্থ হয়েছে', false);
    } finally { setSubmitting(false); }
  };

  const handleDeleteProject = async (id) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই প্রজেক্টটি ডিলিট করতে চান?')) return;
    try {
      await api.delete(`/projects/${id}`);
      showToast('প্রজেক্টটি ডিলিট করা হয়েছে।');
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'ডিলিট করতে ব্যর্থ হয়েছে', false);
    }
  };

  const handleToggleProjectStatus = async (project) => {
    const newStatus = project.status === 'active' ? 'completed' : 'active';
    const actionText = newStatus === 'completed' ? 'সম্পন্ন' : 'সক্রিয়';
    if (!confirm(`আপনি কি এই প্রজেক্টটি ${actionText} করতে চান?`)) return;
    try {
      await api.patch(`/projects/${project.id}`, { status: newStatus });
      showToast(`প্রজেক্টটি ${actionText} করা হয়েছে।`);
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'স্ট্যাটাস আপডেট করতে ব্যর্থ হয়েছে', false);
    }
  };

  const handleOpeningBalanceSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData(e.target);
      await api.post('/payments/opening-balance', {
        userId: parseInt(fd.get('userId')),
        totalPaid: parseFloat(fd.get('totalPaid')),
        upToMonth: parseInt(fd.get('upToMonth')),
        upToYear: parseInt(fd.get('upToYear')),
      });
      showToast('পুরনো ব্যালেন্স সেট হয়েছে!');
      e.target.reset();
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'ব্যর্থ হয়েছে', false);
    } finally {
      setSubmitting(false);
    }
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
      const [usersRes, projectsRes, overallRes, sheetsRes, settingsRes] = await Promise.all([
        api.get('/users'),
        api.get('/projects'),
        api.get('/sheets/overall-status'),
        api.get('/sheets'),
        api.get('/settings'),
      ]);
      setAllUsers(usersRes.data || []);
      setProjects(projectsRes.data.data || []);
      setOverallStatus(overallRes.data.data);
      setSheets(sheetsRes.data.data || []);

      // ✅ Settings সঠিকভাবে set করো
      const settings = settingsRes.data;
      setCurrentSettings(settings);
      if (settings) {
        setSettingsForm({
          openingCashInHand: Number(settings.openingCashInHand) || '',
          openingTotalInvested: Number(settings.openingTotalInvested) || '',
          openingTotalProfit: Number(settings.openingTotalProfit) || '',
          openingMonth: settings.openingMonth || new Date().getMonth() + 1,
          openingYear: settings.openingYear || new Date().getFullYear(),
        });
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchPayments = async () => {
    try {
      const res = await api.get(`/payments?month=${filterMonth}&year=${filterYear}`);
      setAllPayments(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  const handleSettingsSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/settings/opening-balance', {
        openingCashInHand: parseFloat(settingsForm.openingCashInHand) || 0,
        openingTotalInvested: parseFloat(settingsForm.openingTotalInvested) || 0,
        openingTotalProfit: parseFloat(settingsForm.openingTotalProfit) || 0,
        openingMonth: parseInt(settingsForm.openingMonth),
        openingYear: parseInt(settingsForm.openingYear),
      });
      showToast('সেটিংস সংরক্ষিত হয়েছে!');
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'ব্যর্থ হয়েছে', false);
    } finally { setSubmitting(false); }
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

  const handlePaymentStatus = async (id, status) => {
    setProcessing(id);
    try {
      await api.patch(`/payments/${id}/status`, { status });
      showToast(`পেমেন্ট ${status === 'approved' ? 'অনুমোদিত' : 'বাতিল'} হয়েছে`);
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'ব্যর্থ হয়েছে', false);
    } finally { setProcessing(null); }
  };

  const handleReset = async (label, endpoint) => {
    if (!confirm(`"${label}" — আপনি কি নিশ্চিত? এটি পূর্বাবস্থায় ফেরানো যাবে না!`)) return;
    try {
      await api.delete(endpoint);
      showToast(`${label} সম্পন্ন হয়েছে`);
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'ব্যর্থ হয়েছে', false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <span className="loading loading-spinner loading-lg text-amber-400" />
    </div>
  );

  const members = allUsers.filter(u => u.role === 'member');
  const staffs = allUsers.filter(u => u.role !== 'member');

  const TABS = [
    { key: 'overview', label: 'সারসংক্ষেপ' },
    { key: 'members', label: 'সদস্য', count: allUsers.length },
    { key: 'payments', label: 'পেমেন্ট' },
    { key: 'my-payment', label: 'আমার পেমেন্ট' },
    { key: 'projects', label: 'প্রজেক্ট' },
    { key: 'settings', label: 'সেটিংস' },
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'হাতে আছে', value: `${Number(overallStatus.cashInHand).toFixed(0)} ৳`, color: 'text-emerald-400', bg: 'from-emerald-500/10 border-emerald-500/20', icon: '💵' },
              { label: 'বিনিয়োগকৃত', value: `${Number(overallStatus.totalInvested).toFixed(0)} ৳`, color: 'text-blue-400', bg: 'from-blue-500/10 border-blue-500/20', icon: '📤' },
              { label: 'মোট মুনাফা', value: `${Number(overallStatus.totalProfit).toFixed(0)} ৳`, color: 'text-purple-400', bg: 'from-purple-500/10 border-purple-500/20', icon: '📈' },
              { label: 'মোট সম্পদ', value: `${Number(overallStatus.totalAsset).toFixed(0)} ৳`, color: 'text-amber-400', bg: 'from-amber-500/10 border-amber-500/20', icon: '🏦' },
            ].map((s, i) => (
              <div key={i} className={`bg-gradient-to-br ${s.bg} border rounded-2xl p-4`}>
                <div className="text-2xl mb-2">{s.icon}</div>
                <p className={`text-xl sm:text-2xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-400 mt-1">{s.label}</p>
              </div>
            ))}
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
                        {sheet.status === 'published' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            প্রকাশিত
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <svg className="w-3.5 h-3.5 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            খসড়া
                          </span>
                        )}
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
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
              <h2 className="text-sm font-bold text-amber-400 mb-3">পদস্থ সদস্য ({staffs.length})</h2>
              <div className="space-y-2">
                {staffs.map(u => (
                  <div key={u.id} className="flex items-center justify-between px-4 py-3 bg-slate-800/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <UserAvatar user={u} className="w-9 h-9 rounded-xl overflow-hidden shrink-0 text-sm" gradient="from-amber-400 to-orange-500" />
                      <div>
                        <p className="text-sm font-bold text-white">{u.name}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
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
                  <div key={u.id} className="flex items-center justify-between px-4 py-3 bg-slate-800/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <UserAvatar user={u} className="w-9 h-9 rounded-xl overflow-hidden shrink-0 text-sm" gradient="from-slate-600 to-slate-700" />
                      <div>
                        <p className="text-sm font-bold text-white">{u.name}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-slate-400">{u.phone || u.email}</p>
                          <span className="text-xs text-amber-400 font-semibold">{u.monthlyAmount} ৳/মাস</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
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

        {/* Payments */}
        {tab === 'payments' && (
          <div className="space-y-5">
            
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
                <h2 className="text-base font-bold text-white flex-1">সব পেমেন্ট</h2>
                <div className="flex gap-2">
                  <select value={filterMonth} onChange={e => setFilterMonth(parseInt(e.target.value))}
                    className="px-3 py-2 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none transition-all">
                    {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                  <input type="number" value={filterYear} onChange={e => setFilterYear(parseInt(e.target.value))}
                    className="w-24 px-3 py-2 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none transition-all" />
                  <button onClick={fetchPayments} className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-sm font-semibold hover:bg-amber-500/20 transition-all">দেখুন</button>
                </div>
              </div>
              {allPayments.length === 0 ? (
                <p className="text-center text-slate-500 text-sm py-6">উপরের বাটন চাপুন</p>
              ) : (
                <div className="space-y-2">
                  {allPayments.map(p => (
                    <div key={p.id} className="flex items-center justify-between px-4 py-3 bg-slate-800/50 rounded-xl">
                      <div>
                        <p className="text-sm font-bold text-white">{p.user?.name}</p>
                        <p className="text-xs text-slate-400">{p.paymentMethod} {p.transactionNumber && `· ${p.transactionNumber}`}</p>
                        {p.note && <p className="text-xs text-slate-500 italic">"{p.note}"</p>}
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Create Project Form */}
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 h-fit">
              <h2 className="text-base font-bold text-white mb-4">নতুন প্রজেক্ট</h2>
              <form onSubmit={handleCreateProject} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">প্রজেক্টের নাম</label>
                  <input type="text" value={projectForm.name} onChange={e => setProjectForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="যেমন: রাতুল ইনভেস্টমেন্ট" required
                    className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">বিবরণ</label>
                  <textarea value={projectForm.description} onChange={e => setProjectForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="প্রজেক্টের বিবরণ" rows={2}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50 transition-all resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">শুরুর তারিখ</label>
                    <input type="date" value={projectForm.startDate} onChange={e => setProjectForm(f => ({ ...f, startDate: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400/50 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">শেষের তারিখ</label>
                    <input type="date" value={projectForm.endDate} onChange={e => setProjectForm(f => ({ ...f, endDate: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400/50 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">পুরনো বিনিয়োগ (৳)</label>
                  <input type="number" value={projectForm.openingInvested} onChange={e => setProjectForm(f => ({ ...f, openingInvested: e.target.value }))}
                    placeholder="আগে থেকে যা invest আছে (না থাকলে 0)"
                    className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50 transition-all" />
                  <p className="text-xs text-slate-500 mt-1">ওয়েবসাইটের আগে যদি এই project এ invest করা থাকে</p>
                </div>
                <button type="submit" disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-bold rounded-xl transition-all disabled:opacity-60">
                  {submitting && <span className="loading loading-spinner loading-xs" />}
                  প্রজেক্ট তৈরি করুন
                </button>
              </form>
            </div>

            {/* Projects List */}
            <div className="space-y-4">
              <h2 className="text-base font-bold text-white">সব প্রজেক্ট ({projects.length})</h2>
              {projects.length === 0 ? (
                <p className="text-center text-slate-500 py-12 bg-slate-900/50 border border-white/5 rounded-2xl">কোনো প্রজেক্ট নেই</p>
              ) : projects.map(project => (
                <div key={project.id} className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <Link href={`/projects/${project.id}`} className="group flex-1">
                      <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                        {project.name}
                        <span className="text-xs font-normal text-amber-500/80 group-hover:text-amber-400">→ বিস্তারিত দেখুন</span>
                      </h3>
                      {project.description && <p className="text-xs text-slate-400 mt-0.5">{project.description}</p>}
                    </Link>
                    <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                      {project.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          সক্রিয়
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border bg-slate-800 text-slate-400 border-white/5">
                          <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          সম্পন্ন
                        </span>
                      )}
                      <button
                        onClick={() => handleToggleProjectStatus(project)}
                        className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          project.status === 'active'
                            ? 'bg-slate-800 text-slate-300 border-white/5 hover:bg-amber-500/10 hover:text-amber-400 hover:border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500 hover:text-white'
                        }`}
                      >
                        {project.status === 'active' ? (
                          <>
                            <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            সম্পন্ন করুন
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            সক্রিয় করুন
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                      >
                        <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        ডিলিট
                      </button>
                    </div>
                  </div>
                  {project.summary && (
                    <Link href={`/projects/${project.id}`} className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 block hover:opacity-90 transition-opacity">
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
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings */}
        {tab === 'settings' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Opening Balance Form */}
              <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
                <h2 className="text-base font-bold text-white mb-1">প্রারম্ভিক ব্যালেন্স (হাতে নগদ/বিনিয়োগ)</h2>
                <p className="text-xs text-slate-400 mb-4">ওয়েবসাইট চালু হওয়ার আগের মূল তহবিল হিসাব</p>

                {/* ✅ Settings দেখাও */}
                {currentSettings && Number(currentSettings.openingCashInHand) > 0 && (
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 mb-4">
                    <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      সেটিংস সংরক্ষিত আছে
                    </p>
                    <div className="flex gap-4 mt-2">
                      <span className="text-xs text-slate-400">নগদ: <span className="text-white font-semibold">{Number(currentSettings.openingCashInHand).toFixed(0)} ৳</span></span>
                      <span className="text-xs text-slate-400">বিনিয়োগ: <span className="text-white font-semibold">{Number(currentSettings.openingTotalInvested).toFixed(0)} ৳</span></span>
                      <span className="text-xs text-slate-400">মুনাফা: <span className="text-white font-semibold">{Number(currentSettings.openingTotalProfit).toFixed(0)} ৳</span></span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{MONTH_NAMES[(currentSettings.openingMonth || 1) - 1]} {currentSettings.openingYear} থেকে শুরু</p>
                  </div>
                )}

                <form onSubmit={handleSettingsSave} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">হাতে নগদ (৳)</label>
                    <input type="number" value={settingsForm.openingCashInHand}
                      onChange={e => setSettingsForm(f => ({ ...f, openingCashInHand: e.target.value }))}
                      placeholder="যেমন: 21028"
                      className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">মোট বিনিয়োগকৃত (৳)</label>
                    <input type="number" value={settingsForm.openingTotalInvested}
                      onChange={e => setSettingsForm(f => ({ ...f, openingTotalInvested: e.target.value }))}
                      placeholder="যেমন: 13195"
                      className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">মোট মুনাফা (৳)</label>
                    <input type="number" value={settingsForm.openingTotalProfit}
                      onChange={e => setSettingsForm(f => ({ ...f, openingTotalProfit: e.target.value }))}
                      placeholder="যেমন: 600"
                      className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50 transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">থেকে মাস</label>
                      <select value={settingsForm.openingMonth}
                        onChange={e => setSettingsForm(f => ({ ...f, openingMonth: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400/50 transition-all">
                        {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">বছর</label>
                      <input type="number" value={settingsForm.openingYear}
                        onChange={e => setSettingsForm(f => ({ ...f, openingYear: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400/50 transition-all" />
                    </div>
                  </div>
                  <button type="submit" disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-bold rounded-xl transition-all disabled:opacity-60">
                    {submitting && <span className="loading loading-spinner loading-xs" />}
                    সেটিংস সংরক্ষণ করুন
                  </button>
                </form>
              </div>

              {/* Member pre-launch Opening Balance Form */}
              <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 h-fit">
                <h2 className="text-base font-bold text-white mb-1">সদস্যের প্রাক-লঞ্চ পেমেন্ট (Opening Balance)</h2>
                <p className="text-xs text-slate-400 mb-4">ওয়েবসাইট চালুর আগে কোনো সদস্য কত টাকা জমা দিয়েছিলেন</p>
                <form onSubmit={handleOpeningBalanceSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">সদস্য</label>
                    <select name="userId" required
                      className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400/50 transition-all">
                      <option value="">সদস্য নির্বাচন করুন</option>
                      {allUsers.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">মোট পরিশোধিত পরিমাণ (৳)</label>
                    <input type="number" name="totalPaid" required placeholder="যেমন: ৪০০০"
                      className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50 transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">পর্যন্ত মাস</label>
                      <select name="upToMonth" required
                        className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400/50 transition-all">
                        {MONTH_NAMES.map((m, i) => (
                          <option key={i} value={i + 1}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">বছর</label>
                      <input type="number" name="upToYear" defaultValue={new Date().getFullYear()}
                        className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400/50 transition-all" />
                    </div>
                  </div>
                  <button type="submit" disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all disabled:opacity-60">
                    {submitting && <span className="loading loading-spinner loading-xs" />}
                    ব্যালেন্স সেট করুন
                  </button>
                </form>
              </div>
            </div>

            {/* ✅ Danger Zone */}
            <div className="bg-red-950/20 border border-red-500/10 rounded-2xl p-6 shadow-xl max-w-4xl mx-auto">
              <h2 className="text-base font-black text-red-400 mb-1.5 flex items-center gap-2">
                <svg className="w-5 h-5 animate-pulse text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                ⚠️ বিপজ্জনক অঞ্চল (Danger Zone)
              </h2>
              <p className="text-xs text-slate-400 mb-5">
                নিচের অ্যাকশনগুলো স্থায়ীভাবে ডেটা মুছে ফেলবে এবং এটি আর কোনোভাবেই পুনরুদ্ধার বা পূর্বাবস্থায় ফিরিয়ে নেওয়া সম্ভব নয়। অনুগ্রহ করে সতর্কতার সাথে ব্যবহার করুন।
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { label: 'সব শিট মুছুন', endpoint: '/sheets/reset' },
                  { label: 'সব বেতন মুছুন', endpoint: '/salaries/reset' },
                  { label: 'সব পেমেন্ট মুছুন', endpoint: '/payments/reset' },
                  { label: 'সব ওপেনিং ব্যালেন্স মুছুন', endpoint: '/payments/opening-balances/reset' },
                  { label: 'সেটিংস রিসেট করুন', endpoint: '/settings/reset' },
                  { label: 'সব সাধারণ খরচ মুছুন', endpoint: '/expenses/reset/all' },
                ].map((item, i) => (
                  <button key={i} onClick={() => handleReset(item.label, item.endpoint)}
                    className="w-full flex items-center justify-between px-4 py-3.5 bg-red-950/30 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/20 rounded-xl text-xs font-bold text-red-400 transition-all active:scale-[0.98]">
                    <span>{item.label}</span>
                    <svg className="w-4 h-4 text-red-500/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
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