'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { MONTH_NAMES } from '@/lib/constants';

export default function MemberPaymentHistory() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myPayments, setMyPayments] = useState([]);

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
      fetchPaymentHistory();
    } catch { router.push('/login'); }
  }, []);

  const fetchPaymentHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payments/my');
      setMyPayments(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <span className="loading loading-spinner loading-lg text-amber-400" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 py-10 px-4">
      <div className="max-w-xl mx-auto">
        {/* Title */}
        <div className="mb-6 text-center sm:text-left">
          <h1 className="text-2xl font-black text-white">পেমেন্ট ইতিহাস 📜</h1>
          <p className="text-slate-400 mt-1 text-sm">ঊষাণ কমিউনিটি ফান্ড ম্যানেজমেন্ট</p>
        </div>

        {/* Payment History Card */}
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 md:p-8 shadow-2xl">
          <h2 className="text-base font-bold text-white mb-6 flex items-center gap-2 border-b border-white/5 pb-4">
            <span className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 text-sm">
              <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </span>
            আমার বিগত সকল চাঁদা পেমেন্ট
          </h2>

          {myPayments.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">কোনো পেমেন্ট রেকর্ড পাওয়া যায়নি</div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {myPayments.map(payment => (
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
    </div>
  );
}
