import Image from 'next/image';
import Link from 'next/link';

const highlights = [
  {
    title: 'সদস্য চাঁদা ব্যবস্থাপনা',
    description: 'প্রতি মাসের চাঁদা, বকেয়া, অনুমোদিত পেমেন্ট এবং সার্বিক সংগ্রহ এক জায়গায় দেখা যায়।',
  },
  {
    title: 'প্রজেক্ট আয়-ব্যয়',
    description: 'প্রজেক্ট ইনকাম, ব্যয়, লাভ এবং মূলধন ফেরতের হিসাব স্বচ্ছভাবে ট্র্যাক করা হয়।',
  },
  {
    title: 'বেতন ও সাধারণ খরচ',
    description: 'স্টাফ বেতন, অফিস খরচ ও অন্যান্য ব্যয় মাসভিত্তিকভাবে দেখানো হয়।',
  },
  {
    title: 'ফান্ড স্টেটাস',
    description: 'হাতে নগদ, বিনিয়োগকৃত অর্থ, মোট সম্পদ এবং পূর্ববর্তী ব্যালেন্স একসাথে পাওয়া যায়।',
  },
];

const stats = [
  { label: 'মাসিক রিপোর্ট', value: '12+' },
  { label: 'সদস্য', value: '150+' },
  { label: 'সক্রিয় প্রজেক্ট', value: '08' },
  { label: 'স্বচ্ছ হিসাব', value: '100%' },
];

const activities = [
  'নতুন সদস্য নিবন্ধন ও যাচাই',
  'মাসিক পেমেন্ট ও বকেয়া আপডেট',
  'প্রজেক্ট ইনকাম ও এক্সপেন্স এন্ট্রি',
  'বেতন, খরচ ও ফান্ড স্টেটাস প্রকাশ',
];

const portalSections = [
  {
    title: 'Dashboard',
    detail: 'Live overview of fund health, pending work and monthly performance.',
  },
  {
    title: 'Members',
    detail: 'Member profile, monthly amount, verification and payment tracking.',
  },
  {
    title: 'Finance',
    detail: 'Project income, salaries, general expenses and asset breakdown.',
  },
];

export default function Home() {
  return (
    <div className="bg-slate-950 text-white">
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.18),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.14),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.08),_transparent_26%),linear-gradient(180deg,_rgba(15,23,42,0.92),_rgba(2,6,23,1))]" />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm">
                <Image src="/ushaan.png" alt="ঊষাণ" width={28} height={28} className="rounded-full" />
                <span className="text-xs font-semibold tracking-[0.24em] text-slate-200 uppercase">Community Fund Portal</span>
              </div>

              <h1 className="mt-5 text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                সংগঠনের কাজ, হিসাব এবং সদস্য ব্যবস্থাপনা
                <span className="block text-amber-400">এক জায়গায়।</span>
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                ঊষাণ কমিউনিটি ফান্ড ম্যানেজমেন্ট সিস্টেমের মাধ্যমে সদস্য চাঁদা, প্রজেক্ট আয়-ব্যয়, বেতন, সাধারণ খরচ এবং মোট ফান্ড স্টেটাস সুন্দরভাবে দেখানো হয়।
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition-transform hover:scale-[1.01]"
                >
                  পোর্টালে লগইন করুন
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  নতুন অ্যাকাউন্ট করুন
                </Link>
              </div>

              <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                    <p className="text-2xl font-black text-amber-400">{stat.value}</p>
                    <p className="mt-1 text-xs text-slate-400">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-8 -top-8 h-24 w-24 rounded-full bg-amber-400/15 blur-3xl" />
              <div className="absolute -bottom-8 -right-6 h-28 w-28 rounded-full bg-sky-400/15 blur-3xl" />

              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/80 shadow-2xl shadow-black/40 backdrop-blur">
                <div className="border-b border-white/10 bg-white/5 px-5 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Demo dashboard</p>
                      <h2 className="mt-1 text-lg font-bold text-white">সংগঠনের কার্যক্রমের এক নজরের ভিউ</h2>
                    </div>
                    <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                      Live overview
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 p-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                      <p className="text-xs text-slate-400">Total Fund</p>
                      <p className="mt-2 text-3xl font-black text-white">৳ 1,24,800</p>
                      <p className="mt-2 text-sm text-emerald-300">+12.4% this month</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                      <p className="text-xs text-slate-400">Pending Alerts</p>
                      <p className="mt-2 text-3xl font-black text-white">06</p>
                      <p className="mt-2 text-sm text-amber-300">Payment reminders active</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-sm font-semibold text-white">Recent Work Summary</p>
                      <span className="rounded-full bg-sky-400/10 px-3 py-1 text-[11px] font-semibold text-sky-300">This month</span>
                    </div>
                    <div className="space-y-3">
                      {activities.map((item, index) => (
                        <div key={item} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-3 py-2">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-400/15 text-xs font-bold text-amber-300">
                            {index + 1}
                          </span>
                          <p className="text-sm text-slate-200">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sm font-semibold tracking-[0.24em] text-amber-300 uppercase">What we manage</p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">সংগঠনের প্রতিটি কাজ পরিষ্কারভাবে দেখা যায়</h2>
          </div>
          <Link href="/login" className="text-sm font-semibold text-amber-400 hover:text-amber-300">
            লগইন করে full portal দেখুন →
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {highlights.map((item) => (
            <article key={item.title} className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400/20 to-orange-500/10 text-xl font-black text-amber-300">
                {item.title[0]}
              </div>
              <h3 className="text-lg font-bold text-white">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-white/5 bg-slate-900/60">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-20">
          <div>
            <p className="text-sm font-semibold tracking-[0.24em] text-sky-300 uppercase">Why login?</p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">লগইন করলে পুরো portal unlock হবে</h2>
            <p className="mt-4 leading-7 text-slate-300">
              সদস্য, accountant, secretary এবং admin role অনুযায়ী আলাদা dashboard দেখাবে। এখান থেকে reports, payments, projects, sheets এবং notifications access করা যাবে।
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/login" className="inline-flex items-center justify-center rounded-2xl bg-amber-400 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-amber-300">
                Login to Portal
              </Link>
              <Link href="/members" className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10">
                সদস্য তালিকা দেখুন
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/8 to-white/4 p-6 shadow-2xl shadow-black/30">
            <div className="mb-4 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-400">Portal access</p>
                  <h3 className="mt-1 text-lg font-bold text-white">Role-based access inside the portal</h3>
                </div>
                <div className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300">
                  Secure login
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {['Admin', 'Accountant', 'Secretary'].map((role) => (
                  <div key={role} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-slate-200">
                    {role}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {portalSections.map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <p className="text-xs text-slate-400">{item.title}</p>
                  <p className="mt-2 text-base font-bold text-white">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
