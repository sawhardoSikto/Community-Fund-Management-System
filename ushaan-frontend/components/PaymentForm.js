'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { MONTH_NAMES } from '@/lib/constants';

export default function PaymentForm({ user, onSuccess }) {
  const [form, setForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    paymentMethod: 'bkash',
    transactionNumber: '',
    note: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [dueInfo, setDueInfo] = useState([]);
  const monthlyAmount = user?.monthlyAmount || 200;

  useEffect(() => {
    const fetchDueInfo = async () => {
      try {
        const res = await api.get('/payments/my/dues');
        const dues = res.data.data || [];
        const relevantDues = dues.filter((d) =>
          d.year < form.year || (d.year === form.year && d.month < form.month)
        );
        setDueInfo(relevantDues);
      } catch (err) {
        console.error(err);
      }
    };

    fetchDueInfo();
  }, [form.month, form.year]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/payments', form);
      setForm(f => ({ ...f, transactionNumber: '', note: '' }));
      onSuccess?.('পেমেন্ট জমা হয়েছে! অনুমোদনের অপেক্ষায়।');
    } catch (err) {
      setError(err.response?.data?.message || 'পেমেন্ট ব্যর্থ হয়েছে');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">মাস</label>
          <select value={form.month}
            onChange={e => setForm(f => ({ ...f, month: parseInt(e.target.value) }))}
            className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400/50 transition-all">
            {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">বছর</label>
          <input type="number" value={form.year}
            onChange={e => setForm(f => ({ ...f, year: parseInt(e.target.value) }))}
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
              onClick={() => setForm(f => ({ ...f, paymentMethod: method.value, transactionNumber: '' }))}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all border ${form.paymentMethod === method.value ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20' : 'bg-slate-800 border-white/5 text-slate-300 hover:bg-slate-700 hover:text-white'}`}>
              {method.icon}
              <span>{method.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Transaction Number */}
      {form.paymentMethod !== 'cash' && (
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">
            {form.paymentMethod === 'bkash' ? 'বিকাশ নম্বর' :
             form.paymentMethod === 'nagad' ? 'নগদ নম্বর' : 'ট্রানজেকশন ID'}
          </label>
          <input type="text" value={form.transactionNumber}
            onChange={e => setForm(f => ({ ...f, transactionNumber: e.target.value }))}
            placeholder="01XXXXXXXXX"
            className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50 transition-all" />
        </div>
      )}

      {/* Note */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-1.5">নোট (ঐচ্ছিক)</label>
        <input type="text" value={form.note}
          onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
          placeholder="কোনো তথ্য থাকলে লিখুন"
          className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50 transition-all" />
      </div>

      <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 space-y-2">
        {dueInfo.length > 0 ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2.5 space-y-1">
            <p className="text-xs font-bold text-red-400">
              ⚠️ {dueInfo.length} মাস বকেয়া আছে
            </p>
            <p className="text-xs text-slate-400">
              <span className="text-amber-400 font-bold">
                {monthlyAmount} × {dueInfo.length} due + {monthlyAmount} current = {(dueInfo.length + 1) * monthlyAmount} ৳
              </span>
            </p>
          </div>
        ) : (
          <p className="text-xs text-slate-400">
            পরিমাণ: <span className="text-amber-400 font-bold">{monthlyAmount} current = {monthlyAmount} ৳</span>
          </p>
        )}
        <p className="text-xs text-slate-500 mt-0.5">পেমেন্ট করার পর এই ফর্ম পূরণ করুন</p>
      </div>

      <button type="submit" disabled={submitting}
        className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98] disabled:opacity-60">
        {submitting && <span className="loading loading-spinner loading-xs" />}
        {submitting ? 'জমা হচ্ছে...' : 'পেমেন্ট জমা দিন'}
      </button>
    </form>
  );
}