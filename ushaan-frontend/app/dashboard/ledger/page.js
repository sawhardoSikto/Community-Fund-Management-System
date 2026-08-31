"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function LedgerPage() {
  const router = useRouter();
  const printRef = useRef();

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchLedger();
  }, []);

  const fetchLedger = async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/reports/ledger?startDate=${startDate}&endDate=${endDate}`);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "রিপোর্ট ফেচ করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    return `${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}-${String(d.getFullYear()).slice(-2)}`;
  };

  return (
    <div className="min-h-screen bg-white print:bg-white text-slate-900 font-sans">
      {/* Header section (hidden in print) */}
      <div className="print:hidden border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-2 text-sm font-bold">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            পেছনে
          </button>
          <h1 className="text-xl font-bold text-emerald-700">তারিখ অনুযায়ী মাসিক আয় ব্যয়</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handlePrint} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-50 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            প্রিন্ট করুন
          </button>
        </div>
      </div>

      {/* Filters (hidden in print) */}
      <div className="print:hidden max-w-5xl mx-auto px-4 mt-8 mb-6">
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 flex flex-wrap gap-6 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <button 
            onClick={fetchLedger}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-emerald-700 transition-colors"
          >
            রিপোর্ট দেখুন
          </button>
        </div>
      </div>

      {error && <div className="print:hidden max-w-5xl mx-auto px-4 text-red-500 text-sm font-bold">{error}</div>}
      
      {loading && !data && (
        <div className="print:hidden flex justify-center py-10">
          <span className="loading loading-spinner text-emerald-500 loading-lg"></span>
        </div>
      )}

      {/* Printable Area */}
      {data && (
        <div className="max-w-5xl mx-auto px-4 print:px-0 print:mx-0 print:max-w-none bg-white p-8 print:p-0">
          {/* Print Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-slate-900">Ushaan Community Fund</h1>
            <p className="text-sm text-slate-600 mt-1">Income Expense Ledger ({formatDate(data.startDate)} - {formatDate(data.endDate)})</p>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {/* Left Column: Cash-in Flow */}
            <div className="flex flex-col">
              <h2 className="text-center font-bold text-slate-800 mb-3 border-b-2 border-slate-800 pb-2">Cash-in Flow (Income)</h2>
              
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-200">
                    <th className="text-left py-1.5 px-2 font-bold text-slate-700 border-b border-slate-300">GL Account Head</th>
                    <th className="text-right py-1.5 px-2 font-bold text-slate-700 border-b border-slate-300 w-32">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="2" className="font-bold py-2 px-2 text-slate-800">Opening Balance</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-2 text-slate-600 pl-4">Cash in Hand</td>
                    <td className="text-right py-1.5 px-2 text-slate-600">{Number(data.openingBalance).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                  </tr>
                  <tr>
                    <td colSpan="2" className="border-t border-slate-200 py-1"></td>
                  </tr>
                  <tr className="font-bold">
                    <td className="py-1.5 px-2 text-slate-800">Total Opening Balance</td>
                    <td className="text-right py-1.5 px-2 text-slate-800">{Number(data.openingBalance).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                  </tr>

                  <tr>
                    <td colSpan="2" className="font-bold py-2 px-2 pt-6 text-slate-800">Income Description</td>
                  </tr>
                  {data.incomes.length === 0 ? (
                    <tr>
                      <td className="py-1.5 px-2 text-slate-500 italic pl-4">No income records</td>
                      <td className="text-right py-1.5 px-2 text-slate-500">0.00</td>
                    </tr>
                  ) : (
                    data.incomes.map((inc, i) => (
                      <tr key={i}>
                        <td className="py-1.5 px-2 text-slate-600 pl-4">{inc.label}</td>
                        <td className="text-right py-1.5 px-2 text-slate-600">{Number(inc.amount).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                      </tr>
                    ))
                  )}
                  <tr>
                    <td colSpan="2" className="border-t border-slate-200 py-1"></td>
                  </tr>
                  <tr className="font-bold">
                    <td className="py-1.5 px-2 text-slate-800">Total Income</td>
                    <td className="text-right py-1.5 px-2 text-slate-800">{Number(data.totalIncome).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                  </tr>
                </tbody>
              </table>

              <div className="mt-auto border-2 border-slate-800 flex justify-between p-2 font-black text-slate-900 bg-slate-50">
                <span>Total Balance</span>
                <span>{Number(data.openingBalance + data.totalIncome).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
              </div>
            </div>

            {/* Right Column: Cash-out Flow */}
            <div className="flex flex-col">
              <h2 className="text-center font-bold text-slate-800 mb-3 border-b-2 border-slate-800 pb-2">Cash-out Flow (Expenses)</h2>
              
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-200">
                    <th className="text-left py-1.5 px-2 font-bold text-slate-700 border-b border-slate-300">GL Account Head</th>
                    <th className="text-right py-1.5 px-2 font-bold text-slate-700 border-b border-slate-300 w-32">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="2" className="font-bold py-2 px-2 text-slate-800">Expense Description</td>
                  </tr>
                  {data.expenses.length === 0 ? (
                    <tr>
                      <td className="py-1.5 px-2 text-slate-500 italic pl-4">No expense records</td>
                      <td className="text-right py-1.5 px-2 text-slate-500">0.00</td>
                    </tr>
                  ) : (
                    data.expenses.map((exp, i) => (
                      <tr key={i}>
                        <td className="py-1.5 px-2 text-slate-600 pl-4">{exp.label}</td>
                        <td className="text-right py-1.5 px-2 text-slate-600">{Number(exp.amount).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                      </tr>
                    ))
                  )}
                  <tr>
                    <td colSpan="2" className="border-t border-slate-200 py-1"></td>
                  </tr>
                  <tr className="font-bold">
                    <td className="py-1.5 px-2 text-slate-800">Total Expenses</td>
                    <td className="text-right py-1.5 px-2 text-slate-800">{Number(data.totalExpense).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                  </tr>

                  <tr>
                    <td colSpan="2" className="font-bold py-2 px-2 pt-6 text-slate-800">Current Cash/Bank Balance</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-2 text-slate-600 pl-4">Cash in Hand</td>
                    <td className="text-right py-1.5 px-2 text-slate-600">{Number(data.closingBalance).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                  </tr>
                  <tr>
                    <td colSpan="2" className="border-t border-slate-200 py-1"></td>
                  </tr>
                  <tr className="font-bold">
                    <td className="py-1.5 px-2 text-slate-800">Total Cash/Bank Balance</td>
                    <td className="text-right py-1.5 px-2 text-slate-800">{Number(data.closingBalance).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                  </tr>
                </tbody>
              </table>

              <div className="mt-auto border-2 border-slate-800 flex justify-between p-2 font-black text-slate-900 bg-slate-50">
                <span>Total Balance</span>
                <span>{Number(data.totalExpense + data.closingBalance).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
              </div>
            </div>
          </div>

          <div className="mt-24 flex justify-between px-10 text-xs font-bold text-slate-600">
            <div className="border-t border-slate-400 pt-2 text-center w-40">Finance Secretary / Treasurer</div>
            <div className="border-t border-slate-400 pt-2 text-center w-40">Secretary</div>
            <div className="border-t border-slate-400 pt-2 text-center w-40">President</div>
          </div>
          
          <div className="mt-8 text-right text-[10px] text-slate-400 print:block hidden">
            Powered by Ushaan Community Fund System
          </div>
        </div>
      )}
    </div>
  );
}
