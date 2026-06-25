"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { MONTH_NAMES } from "@/lib/constants";
import PaymentForm from "@/components/PaymentForm";
import NoticeBoard from "@/components/NoticeBoard";

const getTabIcon = (key, isActive) => {
  const activeColor = isActive ? "text-white" : "text-slate-400 group-hover:text-white";
  const className = `w-4.5 h-4.5 ${activeColor} transition-colors shrink-0`;
  switch (key) {
    case 'payments':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      );
    case 'my-payment':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'manual':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      );
    case 'projects':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      );
    case 'salary':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    case 'sheets':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case 'expenses':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return null;
  }
};

const getCategoryIcon = (category, className = "w-4 h-4 shrink-0") => {
  switch (category) {
    case 'food':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" />
        </svg>
      );
    case 'transport':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      );
    case 'meeting':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    case 'utility':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case 'other':
    default:
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      );
  }
};

const getTransactionTypeIcon = (type, className = "w-4 h-4 shrink-0") => {
  switch (type) {
    case 'expense':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 13l-3 3m0 0l-3-3m3 3V8m0 13a9 9 0 110-18 9 9 0 010 18z" />
        </svg>
      );
    case 'profit':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 11l3-3m0 0l3 3m-3-3v8m0 5a9 9 0 110-18 9 9 0 010 18z" />
        </svg>
      );
    case 'capital_return':
    default:
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3m0 0l3 3" />
        </svg>
      );
  }
};


const PAYMENT_METHOD_LABELS = {
  bkash: "বিকাশ",
  nagad: "নগদ",
  cash: "নগদ অর্থ",
  card: "কার্ড",
  other: "অন্যান্য",
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
  const [allPayments, setAllPayments] = useState([]); // ✅ অনুমোদিত পেমেন্টের ইতিহাস
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
  const [manualDueInfo, setManualDueInfo] = useState([]);
  const [manualPaymentType, setManualPaymentType] = useState("dues"); // dues or future
  const [nextUnpaid, setNextUnpaid] = useState(null);
  const [futureMonthsCount, setFutureMonthsCount] = useState(1);
  const [loadingNextUnpaid, setLoadingNextUnpaid] = useState(false);

  const getFutureCoveredMonths = () => {
    if (!nextUnpaid) return [];
    const list = [];
    let currMonth = nextUnpaid.month;
    let currYear = nextUnpaid.year;
    for (let i = 0; i < futureMonthsCount; i++) {
      list.push({ month: currMonth, year: currYear });
      currMonth++;
      if (currMonth > 12) {
        currMonth = 1;
        currYear++;
      }
    }
    return list;
  };

  useEffect(() => {
    if (!manualPayment.userId) {
      setManualDueInfo([]);
      setNextUnpaid(null);
      return;
    }
    
    if (manualPaymentType === 'dues') {
      const fetchManualDues = async () => {
        try {
          const res = await api.get(`/payments/dues/${manualPayment.userId}?month=${manualPayment.month}&year=${manualPayment.year}`);
          const dues = res.data.data || [];
          const relevantDues = dues.filter((d) =>
            d.year < manualPayment.year || (d.year === manualPayment.year && d.month < manualPayment.month)
          );
          setManualDueInfo(relevantDues);
        } catch (err) {
          console.error(err);
        }
      };
      fetchManualDues();
    } else if (manualPaymentType === 'future') {
      const fetchNextUnpaid = async () => {
        setLoadingNextUnpaid(true);
        try {
          const res = await api.get(`/payments/next-unpaid/${manualPayment.userId}`);
          setNextUnpaid(res.data || null);
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingNextUnpaid(false);
        }
      };
      fetchNextUnpaid();
    }
  }, [manualPayment.userId, manualPayment.month, manualPayment.year, manualPaymentType]);

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
    const [pendingRes, usersRes, projectsRes, overallRes, sheetsRes, expensesRes, allPaymentsRes] =
      await Promise.all([
        api.get('/payments/pending'),
        api.get('/users'),
        api.get('/projects'),
        api.get('/sheets/overall-status'),
        api.get('/sheets'),
        api.get('/expenses'),
        api.get('/payments'), // ✅ approved history এর জন্য
      ]);
    setPendingPayments(pendingRes.data.data || []);
    setAllUsers(usersRes.data || []);
    setProjects(projectsRes.data.data || []);
    setOverallStatus(overallRes.data.data);
    setSheets(sheetsRes.data.data || []);
    setExpenses(expensesRes.data || []);
    setAllPayments(allPaymentsRes.data.data || []); // ✅
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



  // Payment approve/reject/revert
const handlePaymentStatus = async (id, status) => {
  setProcessing(id);
  try {
    const res = await api.patch(`/payments/${id}/status`, { status });

    // ✅ Warning check করো
    if (res.data.sheetWarning) {
      showToast(res.data.sheetWarning, false); // ⚠️ warning toast
    } else {
      if (status === 'approved') {
        showToast('পেমেন্ট অনুমোদিত হয়েছে');
      } else if (status === 'rejected') {
        showToast('পেমেন্ট বাতিল হয়েছে');
      } else if (status === 'pending') {
        showToast('পেমেন্টের অনুমোদন বাতিল করে পেন্ডিং করা হয়েছে');
      } else {
        showToast('পেমেন্ট স্ট্যাটাস আপডেট হয়েছে');
      }
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
      let payload = { ...manualPayment };
      if (manualPaymentType === 'future') {
        const list = getFutureCoveredMonths();
        if (list.length === 0) {
          showToast("কোনো বকেয়া/চলতি মাস পাওয়া যায়নি", false);
          setSubmitting(false);
          return;
        }
        const lastMonthObj = list[list.length - 1];
        payload.month = lastMonthObj.month;
        payload.year = lastMonthObj.year;
      }
      await api.post("/payments/manual", payload);
      showToast("পেমেন্ট যোগ করা হয়েছে");
      setManualPayment((f) => ({
        ...f,
        userId: "",
        transactionNumber: "",
        note: "",
      }));
      setNextUnpaid(null);
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
    { key: "payments", label: "পেমেন্ট", count: pendingPayments.length },
    { key: "my-payment", label: "আমার পেমেন্ট" },
    { key: "manual", label: "ম্যানুয়াল" },
    { key: "projects", label: "প্রজেক্ট" },
    { key: "salary", label: "বেতন" },
    { key: "sheets", label: "শিট" },
    { key: 'expenses', label: 'খরচ' },
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
            <h1 className="text-2xl font-black text-white">স্বাগতম, {user?.name}! 👋</h1>
            <p className="text-slate-400 text-sm mt-0.5">হিসাবরক্ষক প্যানেল</p>
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
                label: "নিট লাভ/ক্ষতি",
                value: `${overallStatus.totalProfit} ৳`,
                color: Number(overallStatus.totalProfit) >= 0 ? "text-purple-400" : "text-red-400",
                bg: Number(overallStatus.totalProfit) >= 0 ? "from-purple-500/10 border-purple-500/20" : "from-red-500/10 border-red-500/20",
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

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Left Column - Tabs and Tab Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 bg-slate-900/50 border border-white/5 p-1.5 rounded-2xl">
          {TABS.map((t) => {
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all group ${isActive ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
              >
                {getTabIcon(t.key, isActive)}
                <span>{t.label}</span>
                {t.count > 0 && (
                  <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-black shrink-0">
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
               {/* My Payment */}
                {tab === 'my-payment' && (
                  <div className="max-w-md">
                    <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
                      <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 text-sm">
                          <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </span>
                        আমার মাসিক পেমেন্ট
                      </h2>
                      <PaymentForm user={user} onSuccess={(msg) => showToast(msg)} />
                    </div>
                  </div>
                )}

        {/* ── Payments Tab ── */}
        {tab === "payments" && (
          <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 space-y-6">
            <div>
              <h2 className="text-base font-bold text-white mb-4">
                অনুমোদন অপেক্ষায় ({pendingPayments.length})
              </h2>
              {pendingPayments.length === 0 ? (
                <div className="text-center py-12 flex flex-col items-center justify-center bg-slate-800/20 rounded-xl border border-white/5">
                  <span className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-3">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
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
                          onClick={() => {
                            if (confirm('আপনি কি নিশ্চিত যে এই পেমেন্টটি অনুমোদন করতে চান?')) {
                              handlePaymentStatus(payment.id, "approved");
                            }
                          }}
                          disabled={processing === payment.id}
                          className="flex-1 sm:flex-none px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/20 hover:border-emerald-500 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                        >
                          {processing === payment.id ? (
                            <span className="loading loading-spinner loading-xs" />
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              অনুমোদন
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('আপনি কি নিশ্চিত যে এই পেমেন্টটি বাতিল করতে চান?')) {
                              handlePaymentStatus(payment.id, "rejected");
                            }
                          }}
                          disabled={processing === payment.id}
                          className="flex-1 sm:flex-none px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 hover:border-red-500 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                        >
                          {processing === payment.id ? (
                            <span className="loading loading-spinner loading-xs" />
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              বাতিল
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Approved Payments History */}
            <div className="pt-6 border-t border-white/5">
              <h2 className="text-base font-bold text-white mb-4">
                অনুমোদিত পেমেন্টের ইতিহাস
              </h2>
              {allPayments.filter(p => p.status === 'approved').length === 0 ? (
                <div className="text-center py-8 bg-slate-800/10 rounded-xl border border-white/5">
                  <p className="text-slate-500 text-sm">কোনো অনুমোদিত পেমেন্ট নেই</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {allPayments
                    .filter(p => p.status === 'approved')
                    .map((payment) => (
                      <div
                        key={payment.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/30 rounded-xl p-4 border border-white/5"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-black text-sm shrink-0">
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
                            {payment.capturedInMonth && payment.capturedInYear && (
                              <p className="text-xs text-emerald-400 mt-0.5">
                                📅 শিটে যুক্ত: {MONTH_NAMES[payment.capturedInMonth - 1]} {payment.capturedInYear}
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
                            onClick={() => {
                              if (confirm('আপনি কি নিশ্চিত যে এই পেমেন্টটির অনুমোদন বাতিল করে পেন্ডিং করতে চান? এর ফলে সংশ্লিষ্ট শিটের ব্যালেন্স পুনরায় হিসাব করা হবে।')) {
                                handlePaymentStatus(payment.id, "pending");
                              }
                            }}
                            disabled={processing === payment.id}
                            className="flex-1 sm:flex-none px-4 py-2 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-white border border-amber-500/20 hover:border-amber-500 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                          >
                            {processing === payment.id ? (
                              <span className="loading loading-spinner loading-xs" />
                            ) : (
                              "অনুমোদন বাতিল করুন"
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Manual Payment Tab ── */}
        {tab === "manual" && (
          <div className="max-w-md mx-auto">
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

                {/* পেমেন্ট ধরণ */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    পেমেন্ট ধরণ
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "dues", label: "বকেয়া ও চলতি পেমেন্ট" },
                      { value: "future", label: "অগ্রিম পেমেন্ট" }
                    ].map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setManualPaymentType(type.value)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${manualPaymentType === type.value ? "bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20" : "bg-slate-800 border-white/5 text-slate-300 hover:bg-slate-700 hover:text-white"}`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {manualPaymentType === "dues" ? (
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
                ) : (
                  <div className="bg-slate-800/50 border border-white/5 rounded-xl p-3.5 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400 font-semibold">অগ্রিম শুরুর মাস:</span>
                      <span className="text-sm text-amber-400 font-black">
                        {loadingNextUnpaid ? (
                          "লোডিং..."
                        ) : nextUnpaid ? (
                          `${MONTH_NAMES[nextUnpaid.month - 1]} ${nextUnpaid.year}`
                        ) : (
                          "সদস্য সিলেক্ট করুন"
                        )}
                      </span>
                    </div>
                    {nextUnpaid && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                          অগ্রিম মাসের সংখ্যা
                        </label>
                        <select
                          value={futureMonthsCount}
                          onChange={(e) => setFutureMonthsCount(parseInt(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400/50 transition-all"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                            <option key={num} value={num}>
                              {num} মাস
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    পেমেন্ট পদ্ধতি
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        value: "bkash",
                        label: "বিকাশ",
                        icon: <span className="w-4 h-4 rounded bg-[#E2136E] text-white flex items-center justify-center text-[9px] font-black shrink-0">b</span>
                      },
                      {
                        value: "nagad",
                        label: "নগদ",
                        icon: <span className="w-4 h-4 rounded bg-[#F04923] text-white flex items-center justify-center text-[9px] font-black shrink-0">n</span>
                      },
                      {
                        value: "cash",
                        label: "নগদ অর্থ",
                        icon: (
                          <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        )
                      },
                      {
                        value: "card",
                        label: "কার্ড",
                        icon: (
                          <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        )
                      },
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
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all border ${manualPayment.paymentMethod === method.value ? "bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20" : "bg-slate-800 border-white/5 text-slate-300 hover:bg-slate-700 hover:text-white"}`}
                      >
                        {method.icon}
                        <span>{method.label}</span>
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

                {manualPayment.userId && (
                  <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 space-y-2">
                    {manualPaymentType === 'dues' ? (
                      manualDueInfo.length > 0 ? (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2.5 space-y-1">
                          <p className="text-xs font-bold text-red-400 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            {manualDueInfo.length} মাস বকেয়া আছে
                          </p>
                          <p className="text-xs text-slate-400">
                            <span className="text-amber-400 font-bold">
                              {(allUsers.find(u => u.id === parseInt(manualPayment.userId))?.monthlyAmount || 200)} × {manualDueInfo.length} due + {(allUsers.find(u => u.id === parseInt(manualPayment.userId))?.monthlyAmount || 200)} current = {(manualDueInfo.length + 1) * (allUsers.find(u => u.id === parseInt(manualPayment.userId))?.monthlyAmount || 200)} ৳
                            </span>
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">
                          পরিমাণ: <span className="text-amber-400 font-bold">{(allUsers.find(u => u.id === parseInt(manualPayment.userId))?.monthlyAmount || 200)} current = {(allUsers.find(u => u.id === parseInt(manualPayment.userId))?.monthlyAmount || 200)} ৳</span>
                        </p>
                      )
                    ) : (
                      nextUnpaid ? (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5 space-y-1">
                          <p className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            অগ্রিম পেমেন্ট বিবরণ ({futureMonthsCount} মাস)
                          </p>
                          <p className="text-xs text-slate-300">
                            মাসের তালিকা: <span className="text-amber-400 font-semibold">{getFutureCoveredMonths().map(m => `${MONTH_NAMES[m.month - 1]} ${m.year}`).join(', ')}</span>
                          </p>
                          <p className="text-xs text-white font-bold border-t border-emerald-500/20 pt-1.5 mt-1.5 flex justify-between">
                            <span>মোট পরিমাণ:</span>
                            <span className="text-amber-400">{(allUsers.find(u => u.id === parseInt(manualPayment.userId))?.monthlyAmount || 200) * futureMonthsCount} ৳</span>
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">শুরুর মাস লোড হচ্ছে...</p>
                      )
                    )}
                    <p className="text-xs text-slate-500 mt-0.5">ম্যানুয়ালি পেমেন্ট নেওয়ার পর এই ফর্ম পূরণ করুন</p>
                  </div>
                )}

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
          </div>
        )}

        {/* ── Projects Tab ── */}
        {tab === "projects" && (
          <div className="max-w-md mx-auto">
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
                      { value: "expense", label: "ব্যয়" },
                      { value: "profit", label: "মুনাফা" },
                      { value: "capital_return", label: "রিটার্ন" },
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
                        className={`inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all border ${transactionForm.type === type.value ? "bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20" : "bg-slate-800 border-white/5 text-slate-400 hover:bg-slate-700 hover:text-white"}`}
                      >
                        {getTransactionTypeIcon(type.value, `w-3.5 h-3.5 ${transactionForm.type === type.value ? 'text-white' : 'text-slate-455'}`)}
                        <span>{type.label}</span>
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
              { value: 'food', label: 'খাবার' },
              { value: 'transport', label: 'যাতায়াত' },
              { value: 'meeting', label: 'মিটিং' },
              { value: 'utility', label: 'ইউটিলিটি' },
              { value: 'other', label: 'অন্যান্য' },
            ].map(cat => (
              <button key={cat.value} type="button"
                onClick={() => setExpenseForm(f => ({ ...f, category: cat.value }))}
                className={`inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all border ${expenseForm.category === cat.value ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20' : 'bg-slate-800 border-white/5 text-slate-400 hover:bg-slate-700 hover:text-white'}`}>
                {getCategoryIcon(cat.value, `w-3.5 h-3.5 ${expenseForm.category === cat.value ? 'text-white' : 'text-slate-450'}`)}
                <span>{cat.label}</span>
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
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-800/80 px-2 py-0.5 rounded-md border border-white/5">
                    {getCategoryIcon(expense.category, "w-3 h-3 text-slate-400")}
                    <span>{new Date(expense.date).toLocaleDateString('bn-BD')}</span>
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
                        <Link
                          href={`/sheets/${sheet.id}`}
                          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition-colors"
                        >
                          দেখুন
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
          </div>

          {/* Right Column - Notice Board */}
          <div className="lg:col-span-1">
            <NoticeBoard user={user} />
          </div>
        </div>
      </div>
    </div>
  );
}
