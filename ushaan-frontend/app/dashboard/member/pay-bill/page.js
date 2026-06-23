'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { MONTH_NAMES } from '@/lib/constants';

export default function MemberPayBill() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myPayments, setMyPayments] = useState([]);
  const [myDues, setMyDues] = useState([]);
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
        router.push('/login');
        return;
      }
      setUser(userData);
      fetchPaymentData();
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
    if (user) {
      checkDues();
    }
  }, [paymentForm.month, paymentForm.year, user]);

  const checkDues = async () => {
    try {
      const res = await api.get(`/payments/my/dues?month=${paymentForm.month}&year=${paymentForm.year}`);
      const dues = res.data.data || [];
      const relevantDues = dues.filter(d =>
        d.year < paymentForm.year ||
        (d.year === paymentForm.year && d.month < paymentForm.month)
      );
      setDueInfo(relevantDues);
    } catch (err) { console.error(err); }
  };

  const fetchPaymentData = async () => {
    setLoading(true);
    try {
      const [paymentsRes, duesRes] = await Promise.all([
        api.get('/payments/my'),
        api.get('/payments/my/dues'),
      ]);
      setMyPayments(paymentsRes.data.data || []);
      setMyDues(duesRes.data.data || []);
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

      // Refresh data
      await fetchPaymentData();
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

  const selectedMonthPaid = myPayments.find(
    p => p.status === 'approved' && paymentCoversMonth(p, paymentForm.month, paymentForm.year)
  );
  const selectedMonthPending = myPayments.find(
    p => p.status === 'pending' && paymentCoversMonth(p, paymentForm.month, paymentForm.year)
  );

  return (
    <div className="min-h-screen bg-slate-950 py-10 px-4">
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

      <div className="max-w-xl mx-auto">
        {/* Title */}
        <div className="mb-6 text-center sm:text-left">
          <h1 className="text-2xl font-black text-white">চাঁদা পেমেন্ট করুন 💰</h1>
          <p className="text-slate-400 mt-1 text-sm">ঊষাণ কমিউনিটি ফান্ড ম্যানেজমেন্ট</p>
        </div>

        {/* Payment Form Card */}
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 md:p-8 shadow-2xl">
          <h2 className="text-base font-bold text-white mb-6 flex items-center gap-2 border-b border-white/5 pb-4">
            <span className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </span>
            চাঁদার বিবরণী ও পেমেন্ট ফর্ম
          </h2>

          {/* Selected month status */}
          {selectedMonthPaid ? (
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-5">
              <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="text-sm font-bold text-emerald-400">এই মাসের পেমেন্ট পরিশোধিত হয়েছে</p>
                <p className="text-xs text-slate-400 mt-0.5">{MONTH_NAMES[paymentForm.month - 1]} {paymentForm.year}</p>
              </div>
            </div>
          ) : selectedMonthPending ? (
            <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-5">
              <svg className="w-5 h-5 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-bold text-amber-400">অনুমোদনের অপেক্ষায় আছে</p>
                <p className="text-xs text-slate-400 mt-0.5">{selectedMonthPending.transactionNumber || selectedMonthPending.paymentMethod}</p>
              </div>
            </div>
          ) : null}

          <form onSubmit={handlePaymentSubmit} className="space-y-5">
            {/* Month + Year */}
            <div className="grid grid-cols-2 gap-4">
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
              <label className="block text-xs font-semibold text-slate-400 mb-2">পেমেন্ট পদ্ধতি</label>
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

            {/* Transaction Number & Note side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div className={paymentForm.paymentMethod === 'cash' ? 'col-span-2' : ''}>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">নোট (ঐচ্ছিক)</label>
                <input type="text" value={paymentForm.note}
                  onChange={e => setPaymentForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="কোনো তথ্য থাকলে লিখুন"
                  className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50 transition-all" />
              </div>
            </div>

            {/* Amount Info */}
            <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 space-y-2">
              {dueInfo && dueInfo.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <p className="text-xs font-bold text-red-400 mb-2 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-red-400 shrink-0 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {dueInfo.length} মাস বকেয়া আছে!
                  </p>
                  <p className="text-xs text-slate-400 mb-2">
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
                    <div className="flex justify-between pt-1.5 border-t border-red-500/20">
                      <span className="text-xs text-slate-400">
                        {MONTH_NAMES[paymentForm.month - 1]} {paymentForm.year} (এই মাস)
                      </span>
                      <span className="text-xs font-bold text-white">{user?.monthlyAmount} ৳</span>
                    </div>
                  </div>
                  <div className="flex justify-between mt-3 pt-3 border-t border-red-500/20">
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
      </div>
    </div>
  );
}
