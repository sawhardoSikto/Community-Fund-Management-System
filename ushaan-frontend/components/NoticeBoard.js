'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { ROLE_LABELS } from '@/lib/constants';

export default function NoticeBoard({ user }) {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modals visibility
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Form states
  const [form, setForm] = useState({ title: '', content: '' });
  const [editId, setEditId] = useState(null);

  // Permissions check
  const isAuthorized = user && ['admin', 'general_secretary', 'accountant'].includes(user.role);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notices');
      setNotices(res.data.data || []);
    } catch (err) {
      console.error('Error fetching notices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOpen = () => {
    setForm({ title: '', content: '' });
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.content) return;
    setSubmitting(true);
    try {
      await api.post('/notices', form);
      setIsCreateOpen(false);
      fetchNotices();
    } catch (err) {
      console.error('Error creating notice:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditOpen = (notice, e) => {
    e.stopPropagation(); // Prevent opening detail modal
    setEditId(notice.id);
    setForm({ title: notice.title, content: notice.content });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.content) return;
    setSubmitting(true);
    try {
      await api.patch(`/notices/${editId}`, form);
      setIsEditOpen(false);
      fetchNotices();
    } catch (err) {
      console.error('Error updating notice:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (noticeId, e) => {
    e.stopPropagation(); // Prevent opening detail modal
    if (!confirm('আপনি কি নিশ্চিত যে এই নোটিশটি ডিলিট করতে চান?')) return;
    try {
      await api.delete(`/notices/${noticeId}`);
      fetchNotices();
      if (selectedNotice && selectedNotice.id === noticeId) {
        setIsDetailOpen(false);
      }
    } catch (err) {
      console.error('Error deleting notice:', err);
    }
  };

  const handleNoticeClick = (notice) => {
    setSelectedNotice(notice);
    setIsDetailOpen(true);
  };

  // Color options for date columns to match screenshot aesthetics
  const colors = [
    { text: 'text-rose-500', bg: 'bg-rose-500/10' },
    { text: 'text-amber-500', bg: 'bg-amber-500/10' },
    { text: 'text-sky-500', bg: 'bg-sky-500/10' },
  ];

  return (
    <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 text-sm">
            📢
          </span>
          নোটিশ বোর্ড (Notice)
        </h2>
        {isAuthorized && (
          <button
            onClick={handleCreateOpen}
            className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-all shadow-md active:scale-95"
          >
            + নতুন নোটিশ
          </button>
        )}
      </div>

      {/* Notices List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <span className="loading loading-spinner loading-md text-amber-400" />
        </div>
      ) : notices.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-sm">কোনো নোটিশ নেই</div>
      ) : (
        <div className="divide-y divide-white/5 max-h-[350px] overflow-y-auto pr-1">
          {notices.map((notice, index) => {
            const dateObj = new Date(notice.createdAt);
            const day = String(dateObj.getDate()).padStart(2, '0');
            const month = dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase();
            const color = colors[index % colors.length];

            return (
              <div
                key={notice.id}
                onClick={() => handleNoticeClick(notice)}
                className="flex items-center gap-3 py-3.5 hover:bg-white/5 transition-all cursor-pointer group"
              >
                {/* Date vertical badge */}
                <div className={`flex flex-col items-center justify-center w-12 py-1.5 rounded-xl ${color.bg} shrink-0 text-center`}>
                  <span className={`text-base font-black ${color.text} leading-none`}>{day}</span>
                  <span className={`text-[10px] font-bold ${color.text} mt-0.5 leading-none`}>{month}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-200 group-hover:text-white transition-colors truncate">
                    {notice.title}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1 truncate">
                    পোস্ট করেছেন: {notice.author?.name || 'অজানা'} ({ROLE_LABELS[notice.author?.role] || notice.author?.role})
                  </p>
                </div>

                {/* Admin/Staff Actions */}
                {isAuthorized && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleEditOpen(notice, e)}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 transition-colors"
                      title="সম্পাদনা"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => handleDelete(notice.id, e)}
                      className="p-1 rounded bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                      title="ডিলিট"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── DETAIL MODAL ── */}
      {isDetailOpen && selectedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative overflow-hidden">
            <button
              onClick={() => setIsDetailOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="mb-4">
              <span className="text-xs text-amber-400 font-bold tracking-wider uppercase">নোটিশ বিবরণী</span>
              <h3 className="text-lg font-black text-white mt-1">{selectedNotice.title}</h3>
              <p className="text-[11px] text-slate-500 mt-1">
                পোস্টের সময়: {new Date(selectedNotice.createdAt).toLocaleString('bn-BD')} · লেখক: {selectedNotice.author?.name} ({ROLE_LABELS[selectedNotice.author?.role] || selectedNotice.author?.role})
              </p>
            </div>
            <div className="bg-slate-950/50 rounded-xl p-4 border border-white/5 max-h-[250px] overflow-y-auto">
              <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                {selectedNotice.content}
              </p>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              {isAuthorized && (
                <>
                  <button
                    onClick={(e) => {
                      setIsDetailOpen(false);
                      handleEditOpen(selectedNotice, e);
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold rounded-xl transition-all"
                  >
                    সম্পাদনা করুন
                  </button>
                  <button
                    onClick={(e) => handleDelete(selectedNotice.id, e)}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 rounded-xl text-xs font-bold transition-all"
                  >
                    ডিলিট
                  </button>
                </>
              )}
              <button
                onClick={() => setIsDetailOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE MODAL ── */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
            <h3 className="text-base font-bold text-white mb-4">নতুন নোটিশ তৈরি করুন</h3>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">শিরোনাম (Title)</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="নোটিশের শিরোনাম লিখুন"
                  className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">বিবরণ (Description)</label>
                <textarea
                  required
                  rows={5}
                  value={form.content}
                  onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder="নোটিশের বিস্তারিত বিবরণ লিখুন"
                  className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400/50 transition-all resize-none"
                />
              </div>
              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs disabled:opacity-60 flex items-center gap-1.5"
                >
                  {submitting && <span className="loading loading-spinner loading-xs" />}
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ── */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
            <h3 className="text-base font-bold text-white mb-4">নোটিশ সম্পাদন করুন</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">শিরোনাম (Title)</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="নোটিশের শিরোনাম লিখুন"
                  className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">বিবরণ (Description)</label>
                <textarea
                  required
                  rows={5}
                  value={form.content}
                  onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder="নোটিশের বিস্তারিত বিবরণ লিখুন"
                  className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400/50 transition-all resize-none"
                />
              </div>
              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs disabled:opacity-60 flex items-center gap-1.5"
                >
                  {submitting && <span className="loading loading-spinner loading-xs" />}
                  আপডেট করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
