"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { MONTH_NAMES } from "@/lib/constants";
import PaymentForm from "@/components/PaymentForm";

const PAYMENT_METHOD_LABELS = {
  bkash: "🟣 বিকাশ",
  nagad: "🟠 নগদ",
  cash: "💵 নগদ অর্থ",
  card: "💳 কার্ড",
  other: "🔵 অন্যান্য",
};

const parseCoveredMonths = (coveredMonths) => {
  if (!coveredMonths) return [];

  try {
    const parsed = typeof coveredMonths === 'string'
      ? JSON.parse(coveredMonths)
      : coveredMonths;

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const formatCoveredMonths = (coveredMonths) =>
  parseCoveredMonths(coveredMonths)
    .map((item) => `${MONTH_NAMES[item.month - 1]} ${item.year}`)
    .join(', ');

const formatPaymentBreakdown = (payment) => {
  const coveredMonths = parseCoveredMonths(payment.coveredMonths);
  const monthlyAmount = payment.user?.monthlyAmount || (payment.amount && coveredMonths.length > 0
    ? Math.round(Number(payment.amount) / coveredMonths.length)
    : Number(payment.amount || 0));

  if (coveredMonths.length <= 1) {
    return `${monthlyAmount} current = ${Number(payment.amount || monthlyAmount).toFixed(0)} ৳`;
  }

  const dueCount = coveredMonths.length - 1;
  return `${monthlyAmount} × ${dueCount} due + ${monthlyAmount} current = ${Number(payment.amount || monthlyAmount * coveredMonths.length).toFixed(0)} ৳`;
};




export default  function AccountantDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("payments");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, msg: "", success: true });
  
  const [expenses, setExpenses] = useState([]);
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    amount: '',
    category: 'other',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  // States
  const [pendingPayments, setPendingPayments] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [overallStatus, setOverallStatus] = useState(null);
  const [salaries, setSalaries] = useState([]);
  const [sheets, setSheets] = useState([]);

  // Forms
  const [manualPayment, setManualPayment] = useState({
    userId: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    paymentMethod: "bkash",
    transactionNumber: "",
    note: "",
  });
  const [salaryForm, setSalaryForm] = useState({
    userId: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    amount: "",
    role: "",
  });
  const [sheetForm, setSheetForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });
  const [transactionForm, setTransactionForm] = useState({
    projectId: "",
    type: "profit",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [projectForm, setProjectForm] = useState({
    name: "",
    description: "",
    openingInvested: "", // ✅ নতুন ফিল্ড
    startDate: "",
    endDate: "",
  });
  

  const [processing, setProcessing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const showToast = (msg, success = true) => {
    setToast({ show: true, msg, success });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000);
  };

  useEffect(() => {
    try {
      const u = localStorage.getItem("user");
      const userData = u && u !== "undefined" ? JSON.parse(u) : null;
      if (!userData || !["accountant", "admin"].includes(userData.role)) {
        return router.push("/login");
      }
      setUser(userData);
      fetchAll();
    } catch {
      router.push("/login");
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    // Poll silently in the background every 15 seconds
    const interval = setInterval(() => {
      fetchSilent();
    }, 15000);

    return () => clearInterval(interval);
  }, [user]);

  const fetchSilent = async () => {
    try {
      const [pendingRes, overallRes] = await Promise.all([
        api.get('/payments/pending'),
        api.get('/sheets/overall-status'),
      ]);
      setPendingPayments(pendingRes.data.data || []);
      setOverallStatus(overallRes.data.data);
    } catch (err) {
      console.error("Silent background fetch failed:", err);
    }
  };

const fetchAll = async () => {
  setLoading(true);
  try {
    const [pendingRes, usersRes, projectsRes, overallRes, sheetsRes, expensesRes] =
      await Promise.all([
        api.get('/payments/pending'),
        api.get('/users'),
        api.get('/projects'),
        api.get('/sheets/overall-status'),
        api.get('/sheets'),
        api.get('/expenses'), // ✅ এখানে add করো
      ]);
    setPendingPayments(pendingRes.data.data || []);
    setAllUsers(usersRes.data || []);
    setProjects(projectsRes.data.data || []);
    setOverallStatus(overallRes.data.data);
    setSheets(sheetsRes.data.data || []);
    setExpenses(expensesRes.data || []); // ✅
  } catch (err) { console.error(err); }
  finally { setLoading(false); }
};

  const fetchSalaries = async () => {
    try {
      const res = await api.get(
        `/salaries/by-month?month=${sheetForm.month}&year=${sheetForm.year}`,
      );
      setSalaries(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };



  // Payment approve/reject
const handlePaymentStatus = async (id, status) => {
  setProcessing(id);
  try {
    const res = await api.patch(`/payments/${id}/status`, { status });

    // ✅ Warning check করো
    if (res.data.sheetWarning) {
      showToast(res.data.sheetWarning, false); // ⚠️ warning toast
    } else {
      showToast(`পেমেন্ট ${status === 'approved' ? 'অনুমোদিত' : 'বাতিল'} হয়েছে`);
    }
    fetchAll();
  } catch (err) {
    showToast(err.response?.data?.message || 'ব্যর্থ হয়েছে', false);
  } finally { setProcessing(null); }
};

  // Manual payment
  const handleManualPayment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/payments/manual", manualPayment);
      showToast("পেমেন্ট যোগ করা হয়েছে");
      setManualPayment((f) => ({
        ...f,
        userId: "",
        transactionNumber: "",
        note: "",
      }));
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || "ব্যর্থ হয়েছে", false);
    } finally {
      setSubmitting(false);
    }
  };

  // Salary add
  const handleSalaryAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const selectedUser = allUsers.find(
        (u) => u.id === parseInt(salaryForm.userId),
      );
      await api.post("/salaries", {
        ...salaryForm,
        userId: parseInt(salaryForm.userId),
        amount: parseInt(salaryForm.amount),
        role: selectedUser?.role || salaryForm.role,
      });
      showToast("বেতন যোগ করা হয়েছে");
      setSalaryForm((f) => ({ ...f, userId: "", amount: "" }));
      fetchSalaries();
    } catch (err) {
      showToast(err.response?.data?.message || "ব্যর্থ হয়েছে", false);
    } finally {
      setSubmitting(false);
    }
  };

  // Sheet generate
  const handleGenerateSheet = async () => {
    setSubmitting(true);
    try {
      await api.post("/sheets/generate", sheetForm);
      showToast("শিট তৈরি হয়েছে!");
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || "ব্যর্থ হয়েছে", false);
    } finally {
      setSubmitting(false);
    }
  };

  // Sheet publish
  const handlePublishSheet = async (id) => {
    setProcessing(id);
    try {
      await api.patch(`/sheets/${id}/publish`);
      showToast("শিট প্রকাশিত হয়েছে!");
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || "ব্যর্থ হয়েছে", false);
    } finally {
      setProcessing(null);
    }
  };

  // Project create
const handleCreateProject = async (e) => {
  e.preventDefault();
  setSubmitting(true);
  try {
    await api.post('/projects', {
      ...projectForm,
      openingInvested: parseFloat(projectForm.openingInvested) || 0, // ✅
    });
    showToast('প্রজেক্ট তৈরি হয়েছে!');
    setProjectForm({ name: '', description: '', openingInvested: '', startDate: '', endDate: '' });
    fetchAll();
  } catch (err) {
    showToast(err.response?.data?.message || 'ব্যর্থ হয়েছে', false);
  } finally { setSubmitting(false); }
};

  // Transaction add
  const handleAddTransaction = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/projects/${transactionForm.projectId}/transactions`, {
        type: transactionForm.type,
        amount: parseFloat(transactionForm.amount),
        description: transactionForm.description,
        date: transactionForm.date,
      });
      showToast("লেনদেন যোগ হয়েছে!");
      setTransactionForm((f) => ({ ...f, amount: "", description: "" }));
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || "ব্যর্থ হয়েছে", false);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-amber-400" />
      </div>
    );

  const TABS = [
    { key: "payments", label: "💳 পেমেন্ট", count: pendingPayments.length },
    { key: "my-payment", label: "💰 আমার পেমেন্ট" }, // ✅ নতুন
    { key: "manual", label: "✍️ ম্যানুয়াল" },
    { key: "projects", label: "📁 প্রজেক্ট" },
    { key: "salary", label: "👔 বেতন" },
    { key: "sheets", label: "📋 শিট" },
    { key: 'expenses', label: '💸 খরচ' },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      {toast.show && (
        <div className="toast toast-top toast-center z-50 pt-4">
          <div
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold ${toast.success ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}
          >
            {toast.success ? (
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
            {toast.msg}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">
              হিসাবরক্ষক প্যানেল
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              স্বাগতম, {user?.name}
            </p>
          </div>
          <span className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold rounded-xl">
            হিসাবরক্ষক
          </span>
        </div>

        {/* Overall Status */}
        {overallStatus && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              {
                label: "হাতে আছে",
                value: `${overallStatus.cashInHand} ৳`,
                color: "text-emerald-400",
                bg: "from-emerald-500/10 border-emerald-500/20",
              },
              {
                label: "বিনিয়োগকৃত",
                value: `${overallStatus.totalInvested} ৳`,
                color: "text-blue-400",
                bg: "from-blue-500/10 border-blue-500/20",
              },
              {
                label: "মোট মুনাফা",
                value: `${overallStatus.totalProfit} ৳`,
                color: "text-purple-400",
                bg: "from-purple-500/10 border-purple-500/20",
              },
              {
                label: "মোট সম্পদ",
                value: `${overallStatus.totalAsset} ৳`,
                color: "text-amber-400",
                bg: "from-amber-500/10 border-amber-500/20",
              },
            ].map((s, i) => (
              <div
                key={i}
                className={`bg-gradient-to-br ${s.bg} border rounded-2xl p-4`}
              >
                <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-900/50 border border-white/5 p-1 rounded-2xl mb-6 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${tab === t.key ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
            >
              {t.label}
              {t.count > 0 && (
                <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-black">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
               {/* My Payment */}
                {tab === 'my-payment' && (
                  <div className="max-w-md">
                    <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
                      <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 text-sm">💰</span>
                        আমার মাসিক পেমেন্ট
                      </h2>
                      <PaymentForm user={user} onSuccess={(msg) => showToast(msg)} />
                    </div>
                  </div>
                )}

        {/* ── Payments Tab ── */}
        {tab === "payments" && (
          <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
            <h2 className="text-base font-bold text-white mb-4">
              অনুমোদন অপেক্ষায় ({pendingPayments.length})
            </h2>
            {pendingPayments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">✅</p>
                <p className="text-slate-400 text-sm">
                  সব পেমেন্ট অনুমোদিত হয়েছে
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/50 rounded-xl p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 font-black text-sm shrink-0">
                        {payment.user?.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">
                          {payment.user?.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {MONTH_NAMES[payment.month - 1]} {payment.year} ·{" "}
                          {payment.amount} ৳
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {PAYMENT_METHOD_LABELS[payment.paymentMethod] ||
                            payment.paymentMethod}
                        </p>
                        {parseCoveredMonths(payment.coveredMonths).length > 0 && (
                          <p className="text-xs text-sky-400 mt-0.5">
                            📌 {formatPaymentBreakdown(payment)}
                          </p>
                        )}
                        {payment.transactionNumber && (
                          <p className="text-xs text-amber-400 mt-0.5 font-medium">
                            📱 {payment.transactionNumber}
                          </p>
                        )}
                        {payment.note && (
                          <p className="text-xs text-slate-500 mt-0.5 italic">
                            "{payment.note}"
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 sm:shrink-0">
                      <button
                        onClick={() =>
                          handlePaymentStatus(payment.id, "approved")
                        }
                        disabled={processing === payment.id}
                        className="flex-1 sm:flex-none px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/20 hover:border-emerald-500 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                      >
                        {processing === payment.id ? (
                          <span className="loading loading-spinner loading-xs" />
                        ) : (
                          "✓ অনুমোদন"
                        )}
                      </button>
                      <button
                        onClick={() =>
                          handlePaymentStatus(payment.id, "rejected")
                        }
                        disabled={processing === payment.id}
                        className="flex-1 sm:flex-none px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 hover:border-red-500 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                      >
                        ✗ বাতিল
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Manual Payment Tab ── */}
        {tab === "manual" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Manual Payment */}
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
              <h2 className="text-base font-bold text-white mb-4">
                ম্যানুয়াল পেমেন্ট যোগ করুন
              </h2>
              <form onSubmit={handleManualPayment} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    সদস্য
                  </label>
                  <select
                    value={manualPayment.userId}
                    onChange={(e) =>
                      setManualPayment((f) => ({
                        ...f,
                        userId: e.target.value,
                      }))
                    }
                    required
                    className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400/50 transition-all"
                  >
                    <option value="">সদস্য নির্বাচন করুন</option>
                    {allUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role} · {u.monthlyAmount} ৳)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                      মাস
                    </label>
                    <select
                      value={manualPayment.month}
                      onChange={(e) =>
                        setManualPayment((f) => ({
                          ...f,
                          month: parseInt(e.target.value),
                        }))
                      }
                      className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400/50 transition-all"
                    >
                      {MONTH_NAMES.map((m, i) => (
                        <option key={i} value={i + 1}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                      বছর
                    </label>
                    <input
                      type="number"
                      value={manualPayment.year}
                      onChange={(e) =>
                        setManualPayment((f) => ({
                          ...f,
                          year: parseInt(e.target.value),
                        }))
                      }
                      className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400/50 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    পেমেন্ট পদ্ধতি
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "bkash", label: "🟣 বিকাশ" },
                      { value: "nagad", label: "🟠 নগদ" },
                      { value: "cash", label: "💵 নগদ অর্থ" },
                      { value: "card", label: "💳 কার্ড" },
                    ].map((method) => (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() =>
                          setManualPayment((f) => ({
                            ...f,
                            paymentMethod: method.value,
                            transactionNumber: "",
                          }))
                        }
                        className={`py-2 rounded-xl text-xs font-semibold transition-all ${manualPayment.paymentMethod === method.value ? "bg-amber-500 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
                      >
                        {method.label}
                      </button>
                    ))}
                  </div>
                </div>

                {manualPayment.paymentMethod !== "cash" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                      {manualPayment.paymentMethod === "bkash"
                        ? "বিকাশ নম্বর"
                        : manualPayment.paymentMethod === "nagad"
                          ? "নগদ নম্বর"
                          : "ট্রানজেকশন ID"}
                    </label>
                    <input
                      type="text"
                      value={manualPayment.transactionNumber}
                      onChange={(e) =>
                        setManualPayment((f) => ({
                          ...f,
                          transactionNumber: e.target.value,
                        }))
                      }
                      placeholder="01XXXXXXXXX"
                      className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50 transition-all"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    নোট (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    value={manualPayment.note}
                    onChange={(e) =>
                      setManualPayment((f) => ({ ...f, note: e.target.value }))
                    }
                    placeholder="কোনো তথ্য থাকলে লিখুন"
                    className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-bold rounded-xl transition-all disabled:opacity-60"
                >
                  {submitting && (
                    <span className="loading loading-spinner loading-xs" />
                  )}
                  পেমেন্ট যোগ করুন
                </button>
              </form>
            </div>

            {/* Opening Balance */}
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
              <h2 className="text-base font-bold text-white mb-4">
                সদস্যের পুরনো ব্যালেন্স
              </h2>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setSubmitting(true);
                  try {
                    const fd = new FormData(e.target);
                        {parseCoveredMonths(p.coveredMonths).length > 0 && (
                          <p className="text-xs text-sky-400 mt-0.5">
                            📌 {formatPaymentBreakdown(p)}
                          </p>
                        )}
                    await api.post("/payments/opening-balance", {
                      userId: parseInt(fd.get("userId")),
                      totalPaid: parseFloat(fd.get("totalPaid")),
                      upToMonth: parseInt(fd.get("upToMonth")),
                      upToYear: parseInt(fd.get("upToYear")),
                    });
                    showToast("পুরনো ব্যালেন্স সেট হয়েছে!");
                    e.target.reset();
                  } catch (err) {
                    showToast(
                      err.response?.data?.message || "ব্যর্থ হয়েছে",
                      false,
                    );
                  } finally {
                    setSubmitting(false);
                  }
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    সদস্য
                  </label>
                  <select
                    name="userId"
                    required
                    className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400/50 transition-all"
                  >
  <option value="">সদস্য নির্বাচন করুন</option>
{allUsers.map(u => (
  <option key={u.id} value={u.id}>
    {u.name} ({u.role})
  </option>
))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    মোট পরিশোধিত (৳)
                  </label>
                  <input
                    type="number"
                    name="totalPaid"
                    required
                    placeholder="0"
                    className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50 transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                      পর্যন্ত মাস
                    </label>
                    <select
                      name="upToMonth"
                      required
                      className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400/50 transition-all"
                    >
                      {MONTH_NAMES.map((m, i) => (
                        <option key={i} value={i + 1}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                      বছর
                    </label>
                    <input
                      type="number"
                      name="upToYear"
                      defaultValue={new Date().getFullYear()}
                      className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400/50 transition-all"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all disabled:opacity-60"
                >
                  {submitting && (
                    <span className="loading loading-spinner loading-xs" />
                  )}
                  ব্যালেন্স সেট করুন
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── Projects Tab ── */}
        {tab === "projects" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Create Project */}
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
              <h2 className="text-base font-bold text-white mb-4">
                নতুন প্রজেক্ট
              </h2>
              <form onSubmit={handleCreateProject} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    প্রজেক্টের নাম
                  </label>
                  <input
                    type="text"
                    value={projectForm.name}
                    onChange={(e) =>
                      setProjectForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="যেমন: রাতুল ইনভেস্টমেন্ট"
                    required
                    className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    বিবরণ
                  </label>
                  <textarea
                    value={projectForm.description}
                    onChange={(e) =>
                      setProjectForm((f) => ({
                        ...f,
                        description: e.target.value,
                      }))
                    }
                    placeholder="প্রজেক্টের বিবরণ"
                    rows={2}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50 transition-all resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                      শুরুর তারিখ
                    </label>
                    <input
                      type="date"
                      value={projectForm.startDate}
                      onChange={(e) =>
                        setProjectForm((f) => ({
                          ...f,
                          startDate: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                      শেষের তারিখ
                    </label>
                    <input
                      type="date"
                      value={projectForm.endDate}
                      onChange={(e) =>
                        setProjectForm((f) => ({
                          ...f,
                          endDate: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400/50 transition-all"
                    />
                  </div>
                  <div>
  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
    পুরনো বিনিয়োগ (৳)
  </label>
  <input
    type="number"
    value={projectForm.openingInvested}
    onChange={e => setProjectForm(f => ({ ...f, openingInvested: e.target.value }))}
    placeholder="আগে থেকে যা invest আছে (না থাকলে 0)"
    className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50 transition-all"
  />
  <p className="text-xs text-slate-500 mt-1">
    ওয়েবসাইটের আগে যদি এই project এ invest করা থাকে
  </p>
</div>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-bold rounded-xl transition-all disabled:opacity-60"
                >
                  {submitting && (
                    <span className="loading loading-spinner loading-xs" />
                  )}
                  প্রজেক্ট তৈরি করুন
                </button>
              </form>
            </div>

            {/* Add Transaction */}
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
              <h2 className="text-base font-bold text-white mb-4">
                লেনদেন যোগ করুন
              </h2>
              <form onSubmit={handleAddTransaction} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    প্রজেক্ট
                  </label>
                  <select
                    value={transactionForm.projectId}
                    onChange={(e) =>
                      setTransactionForm((f) => ({
                        ...f,
                        projectId: e.target.value,
                      }))
                    }
                    required
                    className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400/50 transition-all"
                  >
                    <option value="">প্রজেক্ট নির্বাচন করুন</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    লেনদেনের ধরন
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "expense", label: "📤 ব্যয়" },
                      { value: "profit", label: "📈 মুনাফা" },
                      { value: "capital_return", label: "🔄 রিটার্ন" },
                    ].map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() =>
                          setTransactionForm((f) => ({
                            ...f,
                            type: type.value,
                          }))
                        }
                        className={`py-2 rounded-xl text-xs font-semibold transition-all ${transactionForm.type === type.value ? "bg-amber-500 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                      পরিমাণ (৳)
                    </label>
                    <input
                      type="number"
                      value={transactionForm.amount}
                      onChange={(e) =>
                        setTransactionForm((f) => ({
                          ...f,
                          amount: e.target.value,
                        }))
                      }
                      placeholder="0"
                      required
                      className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                      তারিখ
                    </label>
                    <input
                      type="date"
                      value={transactionForm.date}
                      onChange={(e) =>
                        setTransactionForm((f) => ({
                          ...f,
                          date: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400/50 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    বিবরণ
                  </label>
                  <input
                    type="text"
                    value={transactionForm.description}
                    onChange={(e) =>
                      setTransactionForm((f) => ({
                        ...f,
                        description: e.target.value,
                      }))
                    }
                    placeholder="লেনদেনের বিবরণ"
                    className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-bold rounded-xl transition-all disabled:opacity-60"
                >
                  {submitting && (
                    <span className="loading loading-spinner loading-xs" />
                  )}
                  লেনদেন যোগ করুন
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── Salary Tab ── */}
        {tab === "salary" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
              <h2 className="text-base font-bold text-white mb-4">
                বেতন যোগ করুন
              </h2>
              <form onSubmit={handleSalaryAdd} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    সদস্য
                  </label>
                  <select
                    value={salaryForm.userId}
                    onChange={(e) => {
                      const selectedUser = allUsers.find(
                        (u) => u.id === parseInt(e.target.value),
                      );
                      const defaultAmounts = {
                        admin: 30,
                        general_secretary: 20,
                        accountant: 50,
                      };
                      setSalaryForm((f) => ({
                        ...f,
                        userId: e.target.value,
                        role: selectedUser?.role || "",
                        amount: defaultAmounts[selectedUser?.role] || "",
                      }));
                    }}
                    required
                    className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400/50 transition-all"
                  >
                    <option value="">সদস্য নির্বাচন করুন</option>
                    {allUsers
                      .filter((u) =>
                        ["admin", "general_secretary", "accountant"].includes(
                          u.role,
                        ),
                      )
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role})
                        </option>
                      ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                      মাস
                    </label>
                    <select
                      value={salaryForm.month}
                      onChange={(e) =>
                        setSalaryForm((f) => ({
                          ...f,
                          month: parseInt(e.target.value),
                        }))
                      }
                      className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400/50 transition-all"
                    >
                      {MONTH_NAMES.map((m, i) => (
                        <option key={i} value={i + 1}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                      বছর
                    </label>
                    <input
                      type="number"
                      value={salaryForm.year}
                      onChange={(e) =>
                        setSalaryForm((f) => ({
                          ...f,
                          year: parseInt(e.target.value),
                        }))
                      }
                      className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400/50 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    পরিমাণ (৳)
                  </label>
                  <input
                    type="number"
                    value={salaryForm.amount}
                    onChange={(e) =>
                      setSalaryForm((f) => ({ ...f, amount: e.target.value }))
                    }
                    placeholder="0"
                    required
                    className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50 transition-all"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    সভাপতি: ৩০৳, সম্পাদক: ২০৳, হিসাবরক্ষক: ৫০৳
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-bold rounded-xl transition-all disabled:opacity-60"
                >
                  {submitting && (
                    <span className="loading loading-spinner loading-xs" />
                  )}
                  বেতন যোগ করুন
                </button>
              </form>
            </div>

            {/* Salary List */}
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <select
                  value={sheetForm.month}
                  onChange={(e) =>
                    setSheetForm((f) => ({
                      ...f,
                      month: parseInt(e.target.value),
                    }))
                  }
                  className="flex-1 px-3 py-2 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400/50 transition-all"
                >
                  {MONTH_NAMES.map((m, i) => (
                    <option key={i} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={sheetForm.year}
                  onChange={(e) =>
                    setSheetForm((f) => ({
                      ...f,
                      year: parseInt(e.target.value),
                    }))
                  }
                  className="w-24 px-3 py-2 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400/50 transition-all"
                />
                <button
                  onClick={fetchSalaries}
                  className="px-3 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-sm hover:bg-amber-500/20 transition-all"
                >
                  দেখুন
                </button>
              </div>
              {salaries.length === 0 ? (
                <p className="text-center text-slate-500 text-sm py-8">
                  কোনো বেতন নেই
                </p>
              ) : (
                <div className="space-y-2">
                  {salaries.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between px-4 py-3 bg-slate-800/50 rounded-xl"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {s.user?.name}
                        </p>
                        <p className="text-xs text-slate-400">{s.role}</p>
                      </div>
                      <p className="text-sm font-bold text-amber-400">
                        {s.amount} ৳
                      </p>
                    </div>
                  ))}
                  <div className="flex justify-between px-4 py-2 border-t border-white/5">
                    <span className="text-xs font-bold text-slate-400">
                      মোট
                    </span>
                    <span className="text-sm font-black text-white">
                      {salaries.reduce((sum, s) => sum + Number(s.amount), 0)} ৳
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {tab === 'expenses' && (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* Add Expense Form */}
    <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
      <h2 className="text-base font-bold text-white mb-4">নতুন খরচ যোগ করুন</h2>
      <form onSubmit={async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
          await api.post('/expenses', {
            ...expenseForm,
            amount: parseFloat(expenseForm.amount),
          });
          showToast('খরচ যোগ হয়েছে!');
          setExpenseForm(f => ({ ...f, title: '', amount: '', description: '' }));
          fetchAll();
        } catch (err) {
          showToast(err.response?.data?.message || 'ব্যর্থ হয়েছে', false);
        } finally { setSubmitting(false); }
      }} className="space-y-3">

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">খরচের নাম</label>
          <input type="text" value={expenseForm.title}
            onChange={e => setExpenseForm(f => ({ ...f, title: e.target.value }))}
            placeholder="যেমন: মিটিং খরচ" required
            className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50 transition-all" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">পরিমাণ (৳)</label>
            <input type="number" value={expenseForm.amount}
              onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))}
              placeholder="0" required
              className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50 transition-all" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">তারিখ</label>
            <input type="date" value={expenseForm.date}
              onChange={e => setExpenseForm(f => ({ ...f, date: e.target.value }))}
              className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400/50 transition-all" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">ক্যাটাগরি</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'food', label: '🍽️ খাবার' },
              { value: 'transport', label: '🚗 যাতায়াত' },
              { value: 'meeting', label: '🤝 মিটিং' },
              { value: 'utility', label: '🔧 ইউটিলিটি' },
              { value: 'other', label: '📦 অন্যান্য' },
            ].map(cat => (
              <button key={cat.value} type="button"
                onClick={() => setExpenseForm(f => ({ ...f, category: cat.value }))}
                className={`py-2 rounded-xl text-xs font-semibold transition-all ${expenseForm.category === cat.value ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">বিবরণ (ঐচ্ছিক)</label>
          <input type="text" value={expenseForm.description}
            onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))}
            placeholder="খরচের বিবরণ"
            className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50 transition-all" />
        </div>

        <button type="submit" disabled={submitting}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-bold rounded-xl transition-all disabled:opacity-60">
          {submitting && <span className="loading loading-spinner loading-xs" />}
          খরচ যোগ করুন
        </button>
      </form>
    </div>

    {/* Expense List */}
    <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
      <h2 className="text-base font-bold text-white mb-4">
        খরচের তালিকা
        <span className="ml-2 text-sm font-normal text-slate-400">
          মোট: {expenses.reduce((sum, e) => sum + Number(e.amount), 0).toFixed(0)} ৳
        </span>
      </h2>
      {expenses.length === 0 ? (
        <p className="text-center text-slate-500 text-sm py-8">কোনো খরচ নেই</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {expenses.map(expense => (
            <div key={expense.id} className="flex items-center justify-between px-4 py-3 bg-slate-800/50 rounded-xl">
              <div>
                <p className="text-sm font-semibold text-white">{expense.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-500">
                    {expense.category === 'food' ? '🍽️' :
                     expense.category === 'transport' ? '🚗' :
                     expense.category === 'meeting' ? '🤝' :
                     expense.category === 'utility' ? '🔧' : '📦'}
                    {' '}{new Date(expense.date).toLocaleDateString('bn-BD')}
                  </span>
                </div>
                {expense.description && <p className="text-xs text-slate-500 italic mt-0.5">"{expense.description}"</p>}
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm font-bold text-red-400">-{Number(expense.amount).toFixed(0)} ৳</p>
                <button onClick={async () => {
                  if (!confirm('এই খরচ মুছে ফেলবেন?')) return;
                  await api.delete(`/expenses/${expense.id}`);
                  showToast('খরচ মুছে ফেলা হয়েছে');
                  fetchAll();
                }} className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
)}

        {/* ── Sheets Tab ── */}
        {tab === "sheets" && (
          <div className="space-y-6">
            {/* Generate Sheet */}
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
              <h2 className="text-base font-bold text-white mb-4">
                মাসিক শিট তৈরি করুন
              </h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={sheetForm.month}
                  onChange={(e) =>
                    setSheetForm((f) => ({
                      ...f,
                      month: parseInt(e.target.value),
                    }))
                  }
                  className="flex-1 px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400/50 transition-all"
                >
                  {MONTH_NAMES.map((m, i) => (
                    <option key={i} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={sheetForm.year}
                  onChange={(e) =>
                    setSheetForm((f) => ({
                      ...f,
                      year: parseInt(e.target.value),
                    }))
                  }
                  className="w-full sm:w-28 px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400/50 transition-all"
                />
                <button
                  onClick={handleGenerateSheet}
                  disabled={submitting}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-bold rounded-xl transition-all disabled:opacity-60"
                >
                  {submitting && (
                    <span className="loading loading-spinner loading-xs" />
                  )}
                  শিট তৈরি করুন
                </button>
              </div>
            </div>

            {/* Sheets List */}
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
              <h2 className="text-base font-bold text-white mb-4">
                সব শিট ({sheets.length})
              </h2>
              {sheets.length === 0 ? (
                <p className="text-center text-slate-500 text-sm py-8">
                  কোনো শিট নেই
                </p>
              ) : (
                <div className="space-y-3">
                  {sheets.map((sheet) => (
                    <div
                      key={sheet.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/50 rounded-xl p-4"
                    >
                      <div>
                        <p className="text-sm font-bold text-white">
                          {MONTH_NAMES[sheet.month - 1]} {sheet.year}
                        </p>
                        <div className="flex gap-3 mt-1">
                          <span className="text-xs text-emerald-400">
                            আয়:{" "}
                            {Number(sheet.totalMemberIncome) +
                              Number(sheet.totalProjectIncome)}{" "}
                            ৳
                          </span>
                          <span className="text-xs text-red-400">
                            ব্যয়: {sheet.totalSalary} ৳
                          </span>
                          <span className="text-xs text-amber-400">
                            হাতে: {sheet.cashInHand} ৳
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg ${sheet.status === "published" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"}`}
                        >
                          {sheet.status === "published"
                            ? "✅ প্রকাশিত"
                            : "📝 খসড়া"}
                        </span>
                        <Link
                          href={`/sheets/${sheet.id}`}
                          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition-colors"
                        >
                          দেখুন
                        </Link>
                        {sheet.status === "draft" && (
                          <button
                            onClick={() => handlePublishSheet(sheet.id)}
                            disabled={processing === sheet.id}
                            className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/20 text-xs font-semibold rounded-lg transition-all disabled:opacity-50"
                          >
                            {processing === sheet.id ? (
                              <span className="loading loading-spinner loading-xs" />
                            ) : (
                              "প্রকাশ করুন"
                            )}
                          </button>
                        )}
                      </div>
                    </div> 
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
