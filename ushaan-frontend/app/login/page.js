'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import api from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const getLoginErrorMessage = (err) => {
    const status = err?.response?.status;
    const rawMessage = err?.response?.data?.message;
    const message = Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage;

    if (status === 401) return 'ইমেইল বা পাসওয়ার্ড ভুল';
    if (status === 404) return 'এই ইমেইল দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি';
    if (status === 429) return 'অনেকবার চেষ্টা করা হয়েছে, একটু পরে আবার চেষ্টা করুন';

    if (typeof message === 'string' && message.trim()) {
      return message;
    }

    return 'লগইন ব্যর্থ হয়েছে, আবার চেষ্টা করুন';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', form);
      const token = res.data.token;
      localStorage.setItem('token', token);

      const user = res.data.data;
      localStorage.setItem('user', JSON.stringify(user));
      window.dispatchEvent(new Event('userChanged'));

      // Role দেখে redirect
      if (user.role === 'admin') window.location.href = '/dashboard/admin';
      else if (user.role === 'accountant') window.location.href = '/dashboard/accountant';
      else if (user.role === 'general_secretary') window.location.href = '/dashboard/secretary';
      else window.location.href = '/dashboard/member';

    } catch (err) {
      setError(getLoginErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

{/* Logo */}
<div className="text-center mb-8">
  <Link href="/" className="inline-flex flex-col items-center gap-3 mb-6 hover:opacity-90 transition-opacity">
    {/* Logo */}
    <div className="relative">
      <img
        src="/ushaan.png"
        alt="ঊষাণ"
        className="w-20 h-20 rounded-2xl object-contain shadow-lg shadow-amber-500/30"
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'flex';
        }}
      />
      {/* Fallback */}
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 items-center justify-center text-3xl font-black text-white shadow-lg shadow-amber-500/30 hidden">
        ঊ
      </div>
    </div>

    <h1 className="text-3xl font-black text-white tracking-tight">ঊষাণ</h1>
  </Link>

  {/* ✅ Animated Welcome Text */}
  <div className="overflow-hidden h-7">
    <p className="text-amber-400 text-sm font-semibold animate-slide-up">
      ✨ Welcome to Ushaan Family ✨
    </p>
  </div>
</div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-1">স্বাগতম!</h2>
          <p className="text-slate-400 text-sm mb-6">আপনার অ্যাকাউন্টে লগইন করুন</p>

          {error && (
            <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 mb-5 text-sm">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">ইমেইল</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="example@gmail.com"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/10 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-300">পাসওয়ার্ড</label>
                <Link href="/forgot-password" className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
                  পাসওয়ার্ড ভুলেছেন?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 pr-11 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPass ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading && <span className="loading loading-spinner loading-xs" />}
              {loading ? 'লগইন হচ্ছে...' : 'লগইন করুন'}
            </button>
          </form>
        </div>

        {/* Register Link */}
        <p className="text-center text-slate-400 text-sm mt-6">
          অ্যাকাউন্ট নেই?{' '}
          <Link href="/register" className="text-amber-400 font-semibold hover:text-amber-300 transition-colors">
            নিবন্ধন করুন
          </Link>
        </p>

        {/* Footer */}
        <div className="mt-12 text-center text-xs text-slate-500">
          <p>
            Developed by{' '}
            <a
              href="https://siktobiswas.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-500 hover:text-amber-400 font-semibold transition-colors hover:underline"
            >
              Sikto Biswas
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}