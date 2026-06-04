'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

function VerifyOtpForm() {
  const router = useRouter();
  const email = useSearchParams().get('email');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!email) router.push('/register');
  }, [email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/verify-otp', { email, otp });
      setDone(true);
      setTimeout(() => router.push('/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'OTP যাচাই ব্যর্থ হয়েছে');
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
          <h1 className="text-3xl font-black text-white">ঊষাণ</h1>

          {done ? (
            <>
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mt-4 mb-3">
                <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <p className="text-emerald-400 font-bold text-lg">ইমেইল যাচাই সম্পন্ন!</p>
              <p className="text-slate-400 text-sm mt-1">লগইন পেজে নিয়ে যাচ্ছি...</p>
            </>
          ) : (
            <>
              <p className="text-slate-400 text-sm mt-2">আপনার ইমেইলে পাঠানো OTP দিন</p>
              <p className="text-amber-400 text-sm font-medium mt-1">{email}</p>
            </>
          )}
        </div>

        {!done && (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            {error && (
              <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 mb-5 text-sm">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">OTP কোড</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => { setOtp(e.target.value); setError(''); }}
                  placeholder="৬ সংখ্যার OTP"
                  maxLength={6}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 text-sm text-center tracking-[0.5em] text-lg font-bold focus:outline-none focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/10 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all duration-200 active:scale-[0.98] disabled:opacity-60"
              >
                {loading && <span className="loading loading-spinner loading-xs" />}
                {loading ? 'যাচাই হচ্ছে...' : 'যাচাই করুন'}
              </button>
            </form>
          </div>
        )}

        <p className="text-center text-slate-400 text-sm mt-6">
          <Link href="/login" className="text-amber-400 font-semibold hover:text-amber-300 transition-colors">
            ← লগইনে ফিরে যান
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-amber-400" />
      </div>
    }>
      <VerifyOtpForm />
    </Suspense>
  );
}