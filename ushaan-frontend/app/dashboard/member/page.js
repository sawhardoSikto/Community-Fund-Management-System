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
  const [paymentForm, setPaymentForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    paymentMethod: 'bkash',
    transactionNumber: '',
    note: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: '', success: true });
  const [dueInfo, setDueInfo] = useState(null);
  const monthlyAmount = user?.monthlyAmount || 200;


  const showToast = (msg, success = true) => {
    setToast({ show: true, msg, success });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
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
      fetchNextUnpaid();
    } catch { router.push('/login'); }
  }, []);

  const fetchNextUnpaid = async () => {
    try {
      const res = await api.get('/payments/my/next-unpaid');
      if (res.data && res.data.month && res.data.year) {
        setPaymentForm(f => ({
          ...f,
          month: res.data.month,
          year: res.data.year,
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    checkDues();
  }, [paymentForm.month, paymentForm.year]);

  const checkDues = async () => {
    try {
      const res = await api.get(`/payments/my/dues?month=${paymentForm.month}&year=${paymentForm.year}`);
      const dues = res.data.data || [];
      // current month এর আগের due গুলো filter করো
      const relevantDues = dues.filter(d =>
        d.year < paymentForm.year ||
        (d.year === paymentForm.year && d.month < paymentForm.month)
      );
      setDueInfo(relevantDues);
    } catch (err) { console.error(err); }
  };


  const fetchAll = async () => {
    setLoading(true);
    try {
      const [paymentsRes, duesRes, projectsRes, overallRes, totalPaidRes] = await Promise.all([
        api.get('/payments/my'),
        api.get('/payments/my/dues'),
        api.get('/projects'),
        api.get('/sheets/overall-status'),
        api.get('/payments/my/total-paid'),
      ]);
      setMyPayments(paymentsRes.data.data || []);
      setMyDues(duesRes.data.data || []);
      setProjects(projectsRes.data.data || []);
      setOverallStatus(overallRes.data.data);
      setOverview(totalPaidRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/payments', paymentForm);
      showToast('পেমেন্ট জমা হয়েছে! অনুমোদনের অপেক্ষায়।');
      
      // Fetch next unpaid to default the form for the next payment
      let nextMonth = paymentForm.month;
      let nextYear = paymentForm.year;
      try {
        const res = await api.get('/payments/my/next-unpaid');
        if (res.data && res.data.month && res.data.year) {
          nextMonth = res.data.month;
          nextYear = res.data.year;
        }
      } catch (err) {
        console.error(err);
      }

      setPaymentForm(f => ({
        ...f,
        month: nextMonth,
        year: nextYear,
        transactionNumber: '',
        note: '',
      }));

      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'পেমেন্ট ব্যর্থ হয়েছে', false);
    } finally { setSubmitting(false); }
  };

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

  // ✅ selected month এর payment check
  const selectedMonthPaid = myPayments.find(
    p => p.status === 'approved' && paymentCoversMonth(p, paymentForm.month, paymentForm.year)
  );
  const selectedMonthPending = myPayments.find(
    p => p.status === 'pending' && paymentCoversMonth(p, paymentForm.month, paymentForm.year)
  );

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
                document.getElementById('payment-section')?.scrollIntoView({ behavior: 'smooth' });
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
              sub: selectedMonthPaid ? 'পরিশোধিত' : selectedMonthPending ? 'অপেক্ষমাণ' : 'বকেয়া রয়েছে', 
              icon: (
                <svg className={`w-5 h-5 ${selectedMonthPaid ? 'text-emerald-400' : selectedMonthPending ? 'text-amber-400' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              ), 
              color: selectedMonthPaid ? 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/20' : selectedMonthPending ? 'from-amber-500/20 to-amber-600/10 border-amber-500/20' : 'from-slate-800/50 to-slate-700/10 border-white/5', 
              textColor: selectedMonthPaid ? 'text-emerald-400' : selectedMonthPending ? 'text-amber-400' : 'text-slate-400' 
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

            {/* Payment Form Card */}
            <div id="payment-section" className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
              <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 text-sm">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </span>
                চাঁদা পেমেন্ট করুন
              </h2>

              {/* Selected month status */}
              {selectedMonthPaid ? (
                <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-4">
                  <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <p className="text-sm font-bold text-emerald-400">এই মাসের পেমেন্ট পরিশোধিত হয়েছে</p>
                    <p className="text-xs text-slate-400 mt-0.5">{MONTH_NAMES[paymentForm.month - 1]} {paymentForm.year}</p>
                  </div>
                </div>
              ) : selectedMonthPending ? (
                <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-4">
                  <svg className="w-5 h-5 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-bold text-amber-400">অনুমোদনের অপেক্ষায় আছে</p>
                    <p className="text-xs text-slate-400 mt-0.5">{selectedMonthPending.transactionNumber || selectedMonthPending.paymentMethod}</p>
                  </div>
                </div>
              ) : null}

              <form onSubmit={handlePaymentSubmit} className="space-y-4">

                {/* Month + Year */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">মাস</label>
                    <select value={paymentForm.month}
                      onChange={e => setPaymentForm(f => ({ ...f, month: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400/50 transition-all">
                      {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">বছর</label>
                    <input type="number" value={paymentForm.year}
                      onChange={e => setPaymentForm(f => ({ ...f, year: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400/50 transition-all" />
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">পেমেন্ট পদ্ধতি</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        value: 'bkash',
                        label: 'বিকাশ',
                        icon: <span className="w-4 h-4 rounded bg-[#E2136E] text-white flex items-center justify-center text-[9px] font-black shrink-0">b</span>
                      },
                      {
                        value: 'nagad',
                        label: 'নগদ',
                        icon: <span className="w-4 h-4 rounded bg-[#F04923] text-white flex items-center justify-center text-[9px] font-black shrink-0">n</span>
                      },
                      {
                        value: 'cash',
                        label: 'নগদ অর্থ',
                        icon: (
                          <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        )
                      },
                      {
                        value: 'card',
                        label: 'কার্ড',
                        icon: (
                          <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        )
                      },
                    ].map(method => (
                      <button key={method.value} type="button"
                        onClick={() => setPaymentForm(f => ({ ...f, paymentMethod: method.value, transactionNumber: '' }))}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all border ${paymentForm.paymentMethod === method.value ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20' : 'bg-slate-800 border-white/5 text-slate-300 hover:bg-slate-700 hover:text-white'}`}>
                        {method.icon}
                        <span>{method.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transaction Number */}
                {paymentForm.paymentMethod !== 'cash' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                      {paymentForm.paymentMethod === 'bkash' ? 'বিকাশ নম্বর' :
                       paymentForm.paymentMethod === 'nagad' ? 'নগদ নম্বর' : 'ট্রানজেকশন ID'}
                    </label>
                    <input type="text" value={paymentForm.transactionNumber}
                      onChange={e => setPaymentForm(f => ({ ...f, transactionNumber: e.target.value }))}
                      placeholder={paymentForm.paymentMethod === 'card' ? 'Transaction ID' : '01XXXXXXXXX'}
                      className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50 transition-all" />
                  </div>
                )}

                {/* Note */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">নোট (ঐচ্ছিক)</label>
                  <input type="text" value={paymentForm.note}
                    onChange={e => setPaymentForm(f => ({ ...f, note: e.target.value }))}
                    placeholder="কোনো তথ্য থাকলে লিখুন"
                    className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50 transition-all" />
                </div>

                {/* Amount Info */}
                <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 space-y-2">
                  {dueInfo && dueInfo.length > 0 && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
                      <p className="text-xs font-bold text-red-400 mb-1.5 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-red-400 shrink-0 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        {dueInfo.length} মাস বকেয়া আছে!
                      </p>
                      <p className="text-xs text-slate-400 mb-1.5">
                        <span className="text-amber-400 font-bold">
                          {monthlyAmount} × {dueInfo.length} due + {monthlyAmount} current = {(dueInfo.length + 1) * monthlyAmount} ৳
                        </span>
                      </p>
                      <div className="space-y-1">
                        {dueInfo.map((d, i) => (
                          <div key={i} className="flex justify-between">
                            <span className="text-xs text-slate-400">
                              {MONTH_NAMES[d.month - 1]} {d.year} (বকেয়া)
                            </span>
                            <span className="text-xs font-bold text-red-400">{d.amount} ৳</span>
                          </div>
                        ))}
                        <div className="flex justify-between pt-1 border-t border-red-500/20">
                          <span className="text-xs text-slate-400">
                            {MONTH_NAMES[paymentForm.month - 1]} {paymentForm.year} (এই মাস)
                          </span>
                          <span className="text-xs font-bold text-white">{user?.monthlyAmount} ৳</span>
                        </div>
                      </div>
                      <div className="flex justify-between mt-2 pt-2 border-t border-red-500/20">
                        <span className="text-xs font-bold text-white">মোট দিতে হবে</span>
                        <span className="text-sm font-black text-amber-400">
                          {(dueInfo.length + 1) * monthlyAmount} ৳
                        </span>
                      </div>
                    </div>
                  )}

                  {(!dueInfo || dueInfo.length === 0) && (
                    <p className="text-xs text-slate-400">
                      পরিমাণ: <span className="text-amber-400 font-bold">{monthlyAmount} current = {monthlyAmount} ৳</span>
                    </p>
                  )}
                  <p className="text-xs text-slate-500">পেমেন্ট করার পর এই ফর্ম পূরণ করুন</p>
                </div>

                {/* Submit Button */}
                <button type="submit"
                  disabled={submitting || !!selectedMonthPaid || !!selectedMonthPending}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
                  {submitting && <span className="loading loading-spinner loading-xs" />}
                  {submitting ? 'জমা হচ্ছে...'
                    : selectedMonthPaid ? 'এই মাস পরিশোধিত'
                    : selectedMonthPending ? 'অনুমোদন বাকি'
                    : 'পেমেন্ট জমা দিন'}
                </button>
              </form>
            </div>

            {/* Payment History */}
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
              <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 text-sm">
                  <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </span>
                পেমেন্ট ইতিহাস
              </h2>
              {myPayments.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">কোনো পেমেন্ট নেই</div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {myPayments.slice(0, 10).map(payment => (
                    <div key={payment.id} className="flex items-center justify-between px-4 py-3 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${payment.status === 'approved' ? 'bg-emerald-400 animate-pulse' : payment.status === 'pending' ? 'bg-amber-400' : 'bg-red-400'}`} />
                        <div>
                          <p className="text-sm font-semibold text-white">{MONTH_NAMES[payment.month - 1]} {payment.year}</p>
                          <p className="text-xs text-slate-500">
                            {payment.paymentMethod === 'bkash' ? 'বিকাশ' :
                             payment.paymentMethod === 'nagad' ? 'নগদ' :
                             payment.paymentMethod === 'cash' ? 'নগদ অর্থ' : 'কার্ড'}
                          </p>
                          {payment.transactionNumber && (
                            <p className="text-xs text-amber-400 font-medium">📱 {payment.transactionNumber}</p>
                          )}
                          {payment.note && (
                            <p className="text-xs text-slate-500 italic">"{payment.note}"</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">{Number(payment.amount).toFixed(0)} ৳</p>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border ${payment.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : payment.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                          {payment.status === 'approved' ? (
                            <>
                              <svg className="w-2.5 h-2.5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              অনুমোদিত
                            </>
                          ) : payment.status === 'pending' ? (
                            <>
                              <span className="w-1 h-1 rounded-full bg-amber-400 animate-ping shrink-0" />
                              অপেক্ষমাণ
                            </>
                          ) : (
                            <>
                              <svg className="w-2.5 h-2.5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              বাতিল
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (1/3 width - Secondary Importance) */}
          <div className="lg:col-span-1 space-y-6">

            {/* Notice Board */}
            <NoticeBoard user={user} />

            {/* Dues Alert Table */}
            {myDues.length > 0 && (
              <div className="bg-slate-900/50 border border-red-500/15 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-red-400 shrink-0 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  বকেয়া তালিকা ({myDues.length} মাস)
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {myDues.map((due, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2.5 bg-red-500/5 border border-red-500/10 rounded-xl">
                      <span className="text-xs font-semibold text-slate-300">{MONTH_NAMES[due.month - 1]} {due.year}</span>
                      <span className="text-xs font-bold text-red-400">{due.amount} ৳</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Overall Fund Status (Moved to Sidebar) */}
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

            {/* Projects List (Moved to Sidebar) */}
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
                            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
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
      </div>
    </div>
  );
}