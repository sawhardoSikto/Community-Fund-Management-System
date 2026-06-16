'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { MONTH_NAMES } from '@/lib/constants';
import { useReactToPrint } from 'react-to-print';

export default function SheetDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const printRef = useRef();
  const [sheet, setSheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api.get(`/sheets/${id}`)
      .then(res => { setSheet(res.data.data); setLoading(false); })
      .catch(() => router.push('/sheets'));
  }, [id]);

const handleDownloadPDF = useReactToPrint({
  contentRef: printRef,
  documentTitle: 'ushaan-sheet',
});

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <span className="loading loading-spinner loading-lg text-amber-400" />
    </div>
  );

  if (!sheet) return null;

  const totalIncome = Number(sheet.totalMemberIncome) + Number(sheet.totalProjectIncome);
const totalExpense =
  Number(sheet.totalSalary || 0) +
  Number(sheet.totalProjectExpense || 0) +
  Number(sheet.totalGeneralExpense || 0);
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Actions */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/sheets" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
            শিট তালিকায় ফিরুন
          </Link>
          <button
  onClick={handleDownloadPDF}
  className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl transition-all"
>
  <svg
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
    />
  </svg>
  Print / Save PDF
</button>
        </div>

        {/* Printable Content */}
        <div ref={printRef}>
            <div className="print-only bg-white text-black p-10">
<div className="text-center mb-8">

  <img
    src="/ushaan.png"
    alt="Ushaan Logo"
    className="w-20 h-20 mx-auto mb-3"
  />

  <h1 className="text-4xl font-bold">
    ঊষাণ
  </h1>

  <p className="text-lg mt-2">
    মাসিক হিসাব বিবরণী
  </p>

  <p className="mt-1">
    {MONTH_NAMES[sheet.month - 1]} {sheet.year}
  </p>

</div>
  <h2 className="text-xl font-bold mt-8 mb-4">
  সদস্য চাঁদা অবস্থা
</h2>

<table className="w-full border border-black border-collapse mb-8">
  <thead>
    <tr>
      <th className="border border-black p-2 text-left">
        সদস্যের নাম
      </th>

      <th className="border border-black p-2 text-center">
        মাসিক চাঁদা
      </th>

      <th className="border border-black p-2 text-center">
        অবস্থা
      </th>
    </tr>
  </thead>

  <tbody>
    {sheet.memberPayments?.map((member) => (
      <tr key={member.id}>
        <td className="border border-black p-2">
          {member.name}
        </td>

        <td className="border border-black p-2 text-center">
          {member.monthlyAmount} ৳
        </td>

        <td className="border border-black p-2 text-center">
          {member.status === 'paid'
            ? 'পরিশোধিত'
            : 'বকেয়া'}
        </td>
      </tr>
    ))}

    <tr>
      <td
        colSpan={2}
        className="border border-black p-2 font-bold"
      >
        মোট সংগ্রহ
      </td>

      <td className="border border-black p-2 text-center font-bold">
        {Number(sheet.totalMemberIncome).toFixed(0)} ৳
      </td>
    </tr>
  </tbody>
</table>

  <h2 className="text-xl font-bold mt-8 mb-4">
  মাসিক সারসংক্ষেপ
</h2>

<table className="w-full border border-black border-collapse mb-8">
  <tbody>
    <tr>
      <td className="border p-2">সদস্য চাঁদা</td>
      <td className="border p-2 text-right">
        +{Number(sheet.totalMemberIncome).toFixed(0)} ৳
      </td>
    </tr>

    <tr>
      <td className="border p-2">প্রজেক্ট আয়</td>
      <td className="border p-2 text-right">
        +{Number(sheet.totalProjectIncome).toFixed(0)} ৳
      </td>
    </tr>

    <tr>
      <td className="border p-2">প্রজেক্ট বিনিয়োগ</td>
      <td className="border p-2 text-right">
        -{Number(sheet.totalProjectExpense || 0).toFixed(0)} ৳
      </td>
    </tr>

    <tr>
  <td className="border p-2">সাধারণ খরচ</td>
  <td className="border p-2 text-right">
    -{Number(sheet.totalGeneralExpense || 0).toFixed(0)} ৳
  </td>
</tr>

    <tr>
      <td className="border p-2">বেতন</td>
      <td className="border p-2 text-right">
        -{Number(sheet.totalSalary).toFixed(0)} ৳
      </td>
    </tr>

    <tr>
      <td className="border p-2 font-bold">
        নিট এই মাসে
      </td>

      <td className="border p-2 text-right font-bold">
        {(Number(sheet.totalMemberIncome)
          + Number(sheet.totalProjectIncome)
          - Number(sheet.totalProjectExpense || 0)
          - Number(sheet.totalSalary)
          - Number(sheet.totalGeneralExpense || 0)
        ).toFixed(0)} ৳
      </td>
    </tr>
  </tbody>
</table>
<h2 className="text-xl font-bold mt-8 mb-4">
  সামগ্রিক ফান্ড অবস্থা
</h2>

<table className="w-full border border-black border-collapse mb-8">
  <tbody>
    <tr>
      <td className="border p-2">আগের ব্যালেন্স</td>
      <td className="border p-2 text-right">
        {Number(sheet.previousBalance).toFixed(0)} ৳
      </td>
    </tr>

    <tr>
      <td className="border p-2">হাতে নগদ</td>
      <td className="border p-2 text-right">
        {Number(sheet.cashInHand).toFixed(0)} ৳
      </td>
    </tr>

    <tr>
      <td className="border p-2">বিনিয়োগকৃত</td>
      <td className="border p-2 text-right">
        {Number(sheet.totalInvested).toFixed(0)} ৳
      </td>
    </tr>

    <tr>
      <td className="border p-2 font-bold">
        মোট সম্পদ
      </td>

      <td className="border p-2 text-right font-bold">
        {Number(sheet.totalAsset).toFixed(0)} ৳
      </td>
    </tr>
  </tbody>
</table>
  
</div>
<div className="screen-only space-y-4">

          {/* Header */}
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-2xl p-6 text-center">
            <h1 className="text-2xl font-black text-white">ঊষাণ</h1>
            <p className="text-slate-400 text-sm mt-1">মাসিক হিসাব শিট</p>
            <p className="text-amber-400 font-bold text-lg mt-2">{MONTH_NAMES[sheet.month - 1]} {sheet.year}</p>
            <span className={`inline-block mt-2 text-xs font-bold px-3 py-1 rounded-lg ${sheet.status === 'published' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
              {sheet.status === 'published' ? '✅ প্রকাশিত' : '📝 খসড়া'}
            </span>
          </div>

          {/* Member Payments */}
          <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
            <h2 className="text-base font-bold text-white mb-4">💰 সদস্য চাঁদা</h2>
            {sheet.memberPayments?.length === 0 ? (
              <p className="text-slate-500 text-sm">কোনো তথ্য নেই</p>
            ) : (
              <>
                <div className="space-y-2 mb-3">
                  {sheet.memberPayments?.map((mp, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 bg-slate-800/50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${mp.status === 'paid' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        <span className="text-sm text-white">{mp.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">{mp.monthlyAmount} ৳</span>
                        <span className={`text-xs font-bold ${mp.status === 'paid' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {mp.status === 'paid' ? '✅ পরিশোধ' : '❌ বকেয়া'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between px-3 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                  <span className="text-sm font-bold text-white">মোট সংগ্রহ</span>
                  <span className="text-sm font-black text-emerald-400">{Number(sheet.totalMemberIncome).toFixed(0)} ৳</span>
                </div>
              </>
            )}
          </div>

          {/* Project Transactions */}
          {sheet.projectTransactions?.length > 0 && (
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
              <h2 className="text-base font-bold text-white mb-4">📁 প্রজেক্ট লেনদেন</h2>
              <div className="space-y-2 mb-3">
                {sheet.projectTransactions.map((tx, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 bg-slate-800/50 rounded-xl">
                    <div>
                      <p className="text-sm text-white">{tx.project?.name}</p>
                      <p className="text-xs text-slate-400">{tx.description}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${tx.type === 'expense' ? 'text-red-400' : 'text-emerald-400'}`}>
                        {tx.type === 'expense' ? '-' : '+'}{Number(tx.amount).toFixed(0)} ৳
                      </p>
                      <p className="text-xs text-slate-500">{tx.type === 'expense' ? 'ব্যয়' : tx.type === 'profit' ? 'মুনাফা' : 'ফেরত'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Salaries */}
          {sheet.salaries?.length > 0 && (
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
              <h2 className="text-base font-bold text-white mb-4">👔 বেতন</h2>
              <div className="space-y-2 mb-3">
                {sheet.salaries.map((s, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 bg-slate-800/50 rounded-xl">
                    <div>
                      <p className="text-sm text-white">{s.user?.name}</p>
                      <p className="text-xs text-slate-400">{s.role}</p>
                    </div>
                    <p className="text-sm font-bold text-red-400">-{Number(s.amount).toFixed(0)} ৳</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between px-3 py-2 bg-red-500/5 border border-red-500/10 rounded-xl">
                <span className="text-sm font-bold text-white">মোট বেতন</span>
                <span className="text-sm font-black text-red-400">{Number(sheet.totalSalary).toFixed(0)} ৳</span>
              </div>
            </div>
          )}
          {/* General Expenses */}
{sheet.totalGeneralExpense > 0 && (
  <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
    <h2 className="text-base font-bold text-white mb-4">💸 সাধারণ খরচ</h2>
    <div className="flex justify-between px-3 py-2 bg-red-500/5 border border-red-500/10 rounded-xl">
      <span className="text-sm font-bold text-white">মোট সাধারণ খরচ</span>
      <span className="text-sm font-black text-red-400">-{Number(sheet.totalGeneralExpense).toFixed(0)} ৳</span>
    </div>
  </div>
)}

          {/* Monthly Summary */}
          <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
            <h2 className="text-base font-bold text-white mb-4">📊 মাসিক সারসংক্ষেপ</h2>
            <div className="space-y-2">
              {[
                { label: 'সদস্য চাঁদা', value: `+${Number(sheet.totalMemberIncome).toFixed(0)} ৳`, color: 'text-emerald-400' },
                { label: 'প্রজেক্ট আয়', value: `+${Number(sheet.totalProjectIncome).toFixed(0)} ৳`, color: 'text-emerald-400' },
                { label: 'প্রজেক্ট বিনিয়োগ', value: `-${Number(sheet.totalProjectExpense || 0).toFixed(0)} ৳`, color: 'text-red-400' },
                { label: 'বেতন', value: `-${Number(sheet.totalSalary).toFixed(0)} ৳`, color: 'text-red-400' },
                { label: 'সাধারণ খরচ', value: `-${Number(sheet.totalGeneralExpense || 0).toFixed(0)} ৳`, color: 'text-red-400' },
              ].map((item, i) => (
                <div key={i} className="flex justify-between px-4 py-2 bg-slate-800/50 rounded-xl">
                  <span className="text-sm text-slate-300">{item.label}</span>
                  <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
                </div>
              ))}
              <div className="flex justify-between px-4 py-3 bg-slate-700/50 rounded-xl border border-white/10 mt-2">
                <span className="text-sm font-bold text-white">নিট এই মাসে</span>
                <span className={`text-sm font-black ${totalIncome - totalExpense >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {totalIncome - totalExpense >= 0 ? '+' : ''}{(totalIncome - totalExpense).toFixed(0)} ৳
                </span>
              </div>
            </div>
          </div>

          {/* Overall Fund Status */}
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-2xl p-5">
            <h2 className="text-base font-bold text-white mb-4">🏦 সামগ্রিক ফান্ড অবস্থা</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: 'আগের ব্যালেন্স', value: `${Number(sheet.previousBalance).toFixed(0)} ৳`, color: 'text-slate-300' },
                { label: 'হাতে নগদ', value: `${Number(sheet.cashInHand).toFixed(0)} ৳`, color: 'text-emerald-400' },
                { label: 'বিনিয়োগকৃত', value: `${Number(sheet.totalInvested).toFixed(0)} ৳`, color: 'text-blue-400' },
              ].map((item, i) => (
                <div key={i} className="text-center bg-slate-800/50 rounded-xl p-4">
                  <p className={`text-xl font-black ${item.color}`}>{item.value}</p>
                  <p className="text-xs text-slate-400 mt-1">{item.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-center">
              <div className="text-center bg-amber-500/10 border border-amber-500/20 rounded-xl px-8 py-3">
                <p className="text-2xl font-black text-amber-400">{Number(sheet.totalAsset).toFixed(0)} ৳</p>
                <p className="text-xs text-slate-400 mt-1">মোট সম্পদ</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          {sheet.publishedAt && (
            <div className="text-center py-3">
              <p className="text-xs text-slate-500">
                প্রকাশিত: {new Date(sheet.publishedAt).toLocaleDateString('bn-BD')}
              </p>
            </div>
          )}
          </div>
        </div>
        </div>
      </div>
    
  );
}