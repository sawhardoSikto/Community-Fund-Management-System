"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { MONTH_NAMES } from "@/lib/constants";

export default function MemberDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [myPayments, setMyPayments] = useState([]);
  const [myDues, setMyDues] = useState([]);
  const [projects, setProjects] = useState([]);
  const [overallStatus, setOverallStatus] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    paymentMethod: "bkash",
    transactionNumber: "",
    note: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: "", success: true });

  const showToast = (msg, success = true) => {
    setToast({ show: true, msg, success });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000);
  };

  useEffect(() => {
    try {
      const u = localStorage.getItem("user");
      const userData = u && u !== "undefined" ? JSON.parse(u) : null;
      if (!userData) return router.push("/login");
      setUser(userData);
      fetchAll();
    } catch {
      router.push("/login");
    }
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [paymentsRes, duesRes, projectsRes, overallRes, totalPaidRes] =
        await Promise.all([
          api.get("/payments/my"),
          api.get("/payments/my/dues"),
          api.get("/projects"),
          api.get("/sheets/overall-status"),
          api.get("/payments/my/total-paid"),
        ]);
      setMyPayments(paymentsRes.data.data || []);
      setMyDues(duesRes.data.data || []);
      setProjects(projectsRes.data.data || []);
      setOverallStatus(overallRes.data.data);
      setOverview(totalPaidRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/payments", paymentForm);
      showToast("পেমেন্ট জমা হয়েছে! অনুমোদনের অপেক্ষায়।");
      setPaymentForm((f) => ({ ...f, bkashNumber: "" }));
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || "পেমেন্ট ব্যর্থ হয়েছে", false);
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

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const thisMonthPaid = myPayments.find(
    (p) =>
      p.month === currentMonth &&
      p.year === currentYear &&
      p.status === "approved",
  );
  const thisMonthPending = myPayments.find(
    (p) =>
      p.month === currentMonth &&
      p.year === currentYear &&
      p.status === "pending",
  );

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Toast */}
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
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            স্বাগতম, {user?.name}! 👋
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            ঊষাণ কমিউনিটি ফান্ড ম্যানেজমেন্ট
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {[
            {
              label: "মোট পরিশোধ",
              value: `${overview?.grandTotal || 0} ৳`,
              sub: `ওয়েবসাইট: ${overview?.websiteTotal || 0} ৳`,
              icon: "💰",
              color:
                "from-emerald-500/20 to-emerald-600/10 border-emerald-500/20",
              textColor: "text-emerald-400",
            },
            {
              label: "বকেয়া মাস",
              value: myDues.length,
              sub:
                myDues.length > 0
                  ? `${myDues[0].amount} ৳/মাস`
                  : "কোনো বকেয়া নেই",
              icon: "⚠️",
              color:
                myDues.length > 0
                  ? "from-red-500/20 to-red-600/10 border-red-500/20"
                  : "from-slate-800/50 to-slate-700/10 border-white/5",
              textColor: myDues.length > 0 ? "text-red-400" : "text-slate-400",
            },
            {
              label: "মাসিক চাঁদা",
              value: `${user?.monthlyAmount || 200} ৳`,
              sub: "প্রতি মাসে",
              icon: "📅",
              color: "from-blue-500/20 to-blue-600/10 border-blue-500/20",
              textColor: "text-blue-400",
            },
            {
              label: "ফান্ড অবস্থা",
              value: `${overallStatus?.cashInHand || 0} ৳`,
              sub: "হাতে আছে",
              icon: "🏦",
              color: "from-amber-500/20 to-amber-600/10 border-amber-500/20",
              textColor: "text-amber-400",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className={`bg-gradient-to-br ${stat.color} border rounded-2xl p-4`}
            >
              <div className="text-2xl mb-2">{stat.icon}</div>
              <p className={`text-xl sm:text-2xl font-black ${stat.textColor}`}>
                {stat.value}
              </p>
              <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment Form */}
          <div className="lg:col-span-1">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                পেমেন্ট পদ্ধতি
              </label>
              <div className="grid grid-cols-2 gap-2 mb-3">
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
                      setPaymentForm((f) => ({
                        ...f,
                        paymentMethod: method.value,
                        transactionNumber: "",
                      }))
                    }
                    className={`py-2 rounded-xl text-sm font-semibold transition-all ${
                      paymentForm.paymentMethod === method.value
                        ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    {method.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Transaction Number — Cash হলে hide */}
            {paymentForm.paymentMethod !== "cash" && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  {paymentForm.paymentMethod === "bkash"
                    ? "বিকাশ নম্বর"
                    : paymentForm.paymentMethod === "nagad"
                      ? "নগদ নম্বর"
                      : "ট্রানজেকশন ID"}
                </label>
                <input
                  type="text"
                  value={paymentForm.transactionNumber}
                  onChange={(e) =>
                    setPaymentForm((f) => ({
                      ...f,
                      transactionNumber: e.target.value,
                    }))
                  }
                  placeholder={
                    paymentForm.paymentMethod === "bkash"
                      ? "01XXXXXXXXX"
                      : paymentForm.paymentMethod === "nagad"
                        ? "01XXXXXXXXX"
                        : "Transaction ID"
                  }
                  className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50 transition-all"
                />
              </div>
            )}

            {/* Note */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                নোট (ঐচ্ছিক)
              </label>
              <input
                type="text"
                value={paymentForm.note}
                onChange={(e) =>
                  setPaymentForm((f) => ({ ...f, note: e.target.value }))
                }
                placeholder="কোনো তথ্য থাকলে লিখুন"
                className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50 transition-all"
              />
            </div>

            {/* Due List */}
            {myDues.length > 0 && (
              <div className="bg-slate-900/50 border border-red-500/10 rounded-2xl p-5 mt-4">
                <h3 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2">
                  ⚠️ বকেয়া তালিকা ({myDues.length} মাস)
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {myDues.map((due, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-3 py-2 bg-red-500/5 rounded-lg"
                    >
                      <span className="text-xs text-slate-300">
                        {MONTH_NAMES[due.month - 1]} {due.year}
                      </span>
                      <span className="text-xs font-bold text-red-400">
                        {due.amount} ৳
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment History */}
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
              <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 text-sm">
                  📋
                </span>
                পেমেন্ট ইতিহাস
              </h2>

              {myPayments.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  কোনো পেমেন্ট নেই
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {myPayments.slice(0, 10).map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between px-4 py-3 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${payment.status === "approved" ? "bg-emerald-400" : payment.status === "pending" ? "bg-amber-400" : "bg-red-400"}`}
                        />
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {MONTH_NAMES[payment.month - 1]} {payment.year}
                          </p>
                          <p className="text-xs text-slate-500">
                            {payment.paymentMethod === "bkash"
                              ? "🟣 বিকাশ"
                              : payment.paymentMethod === "nagad"
                                ? "🟠 নগদ"
                                : payment.paymentMethod === "cash"
                                  ? "💵 নগদ অর্থ"
                                  : payment.paymentMethod === "card"
                                    ? "💳 কার্ড"
                                    : payment.paymentMethod}
                            {payment.transactionNumber &&
                              ` · ${payment.transactionNumber}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">
                          {payment.amount} ৳
                        </p>
                        <span
                          className={`text-xs font-semibold ${payment.status === "approved" ? "text-emerald-400" : payment.status === "pending" ? "text-amber-400" : "text-red-400"}`}
                        >
                          {payment.status === "approved"
                            ? "✅ অনুমোদিত"
                            : payment.status === "pending"
                              ? "⏳ অপেক্ষায়"
                              : "❌ বাতিল"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Projects */}
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 text-sm">
                    📁
                  </span>
                  প্রজেক্টসমূহ
                </h2>
                <Link
                  href="/projects"
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
                >
                  সব দেখুন →
                </Link>
              </div>

              {projects.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  কোনো প্রজেক্ট নেই
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.slice(0, 3).map((project) => (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="flex items-center justify-between px-4 py-3 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors group"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white group-hover:text-amber-400 transition-colors">
                          {project.name}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          বিনিয়োগ: {project.totalInvested} ৳
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${project.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-700 text-slate-400"}`}
                        >
                          {project.status === "active"
                            ? "● সক্রিয়"
                            : "✓ সম্পন্ন"}
                        </span>
                        {project.summary && (
                          <p className="text-xs text-amber-400 mt-1">
                            মুনাফা: {project.summary.totalProfit} ৳
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Overall Fund Status */}
            {overallStatus && (
              <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-2xl p-5">
                <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  🏦 সামগ্রিক ফান্ড অবস্থা
                </h2>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      label: "হাতে আছে",
                      value: `${overallStatus.cashInHand} ৳`,
                      color: "text-emerald-400",
                    },
                    {
                      label: "বিনিয়োগকৃত",
                      value: `${overallStatus.totalInvested} ৳`,
                      color: "text-blue-400",
                    },
                    {
                      label: "মোট সম্পদ",
                      value: `${overallStatus.totalAsset} ৳`,
                      color: "text-amber-400",
                    },
                  ].map((item, i) => (
                    <div key={i} className="text-center">
                      <p className={`text-lg font-black ${item.color}`}>
                        {item.value}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
