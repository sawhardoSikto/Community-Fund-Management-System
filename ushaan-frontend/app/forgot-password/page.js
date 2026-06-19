'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nid, setNid] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      return setError('পাসওয়ার্ড মিলছে না');
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/auth/forgot-password', {
        email,
        phone,
        nid,
        newPassword,
      });

      setSent(true);

      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch (err) {
      setError(
        err.response?.data?.message ||
        'ব্যর্থ হয়েছে'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30 mb-4">
            <span className="text-2xl font-black text-white">ঊ</span>
          </div>

          <h1 className="text-3xl font-black text-white">
            ঊষাণ
          </h1>

          {sent ? (
            <>
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mt-4 mb-3">
                <svg
                  className="w-7 h-7 text-emerald-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
              </div>

              <p className="text-emerald-400 font-bold text-lg mt-2">
                পাসওয়ার্ড পরিবর্তন হয়েছে!
              </p>

              <p className="text-slate-400 text-sm mt-1">
                লগইন পেজে নিয়ে যাচ্ছি...
              </p>
            </>
          ) : (
            <>
              <p className="text-slate-400 text-sm mt-2">
                ইমেইল, ফোন ও NID দিয়ে পরিচয় যাচাই করুন
              </p>
            </>
          )}
        </div>

        {!sent && (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">

            {error && (
              <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 mb-5 text-sm">
                <svg
                  className="w-4 h-4 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                  />
                </svg>

                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  ইমেইল ঠিকানা
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="example@gmail.com"
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  ফোন নম্বর
                </label>

                <input
                  type="text"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setError('');
                  }}
                  placeholder="01XXXXXXXXX"
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  NID নম্বর
                </label>

                <input
                  type="text"
                  value={nid}
                  onChange={(e) => {
                    setNid(e.target.value);
                    setError('');
                  }}
                  placeholder="NID Number"
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  নতুন পাসওয়ার্ড
                </label>

                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="******"
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  পাসওয়ার্ড নিশ্চিত করুন
                </label>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="******"
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/10 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98] disabled:opacity-60"
              >
                {loading && (
                  <span className="loading loading-spinner loading-xs" />
                )}

                {loading
                  ? 'যাচাই করা হচ্ছে...'
                  : 'পাসওয়ার্ড পরিবর্তন করুন'}
              </button>

            </form>
          </div>
        )}

        <p className="text-center text-slate-400 text-sm mt-6">
          <Link
            href="/login"
            className="text-amber-400 font-semibold hover:text-amber-300 transition-colors"
          >
            ← লগইনে ফিরুন
          </Link>
        </p>
      </div>
    </div>
  );
}