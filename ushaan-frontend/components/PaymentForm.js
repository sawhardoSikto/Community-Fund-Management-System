'use client';

import { useState } from 'react';
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
            { value: 'bkash', label: '🟣 বিকাশ' },
            { value: 'nagad', label: '🟠 নগদ' },
            { value: 'cash', label: '💵 নগদ অর্থ' },
            { value: 'card', label: '💳 কার্ড' },
          ].map(method => (
            <button key={method.value} type="button"
              onClick={() => setForm(f => ({ ...f, paymentMethod: method.value, transactionNumber: '' }))}
              className={`py-2 rounded-xl text-xs font-semibold transition-all ${form.paymentMethod === method.value ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
              {method.label}
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

      <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3">
        <p className="text-xs text-slate-400">
          পরিমাণ: <span className="text-amber-400 font-bold">{user?.monthlyAmount || 200} ৳</span>
        </p>
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