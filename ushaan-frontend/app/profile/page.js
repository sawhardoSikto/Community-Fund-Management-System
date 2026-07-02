'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ROLE_LABELS } from '@/lib/constants';
import UserAvatar from '@/components/UserAvatar';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', nid: '' });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: '', success: true });
  const [totalPaid, setTotalPaid] = useState(null);
  const [myDues, setMyDues] = useState([]);

  const showToast = (msg, success = true) => {
    setToast({ show: true, msg, success });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  };

  useEffect(() => {
    try {
      const u = localStorage.getItem('user');
      const userData = u && u !== 'undefined' ? JSON.parse(u) : null;
      if (!userData) return router.push('/login');
      setUser(userData);
      fetchAll();
    } catch { router.push('/login'); }
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [profileRes, totalPaidRes, duesRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/payments/my/total-paid'),
        api.get('/payments/my/dues'),
      ]);
      const profileData = profileRes.data.data;
      setProfile(profileData);
      setForm({ name: profileData.name, phone: profileData.phone || '', nid: profileData.nid || '' });
      setTotalPaid(totalPaidRes.data);
      setMyDues(duesRes.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('phone', form.phone);
      formData.append('nid', form.nid);
      if (photoFile) {
        formData.append('photo', photoFile);
      }

      const res = await api.patch('/users/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const updatedProfile = res.data.data;
      const updatedUser = { 
        ...user, 
        name: updatedProfile.name,
        photoUrl: updatedProfile.photoUrl
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('userChanged'));

      showToast('প্রোফাইল আপডেট হয়েছে!');
      setEditing(false);
      setPhotoFile(null);
      setPhotoPreview(null);
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'আপডেট ব্যর্থ হয়েছে', false);
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <span className="loading loading-spinner loading-lg text-amber-400" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950">
      {toast.show && (
        <div className="toast toast-top toast-center z-50 pt-4">
          <div className={`flex items-center gap-2 px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold ${toast.success ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
            {toast.success
              ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
              : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>}
            {toast.msg}
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">

        {/* Profile Card */}
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <UserAvatar user={profile} className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 text-xl" />
              <div>
                <h1 className="text-xl font-black text-white">{profile?.name}</h1>
                <p className="text-slate-400 text-sm">{profile?.email}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${
                    profile?.role === 'admin' ? 'bg-amber-500/10 text-amber-400' :
                    profile?.role === 'accountant' ? 'bg-blue-500/10 text-blue-400' :
                    profile?.role === 'general_secretary' ? 'bg-purple-500/10 text-purple-400' :
                    'bg-slate-700 text-slate-300'
                  }`}>
                    {ROLE_LABELS[profile?.role]}
                  </span>
                  {profile?.isVerified && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      যাচাইকৃত
                    </span>
                  )}
                </div>
              </div>
            </div>
            {!editing && (
              <button onClick={() => setEditing(true)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                সম্পাদনা
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">প্রোফাইল ছবি</label>
                <div className="flex items-center gap-4 p-3 bg-slate-800/30 rounded-xl border border-white/5">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-16 h-16 rounded-2xl object-cover" />
                  ) : (
                    <UserAvatar user={profile} className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 text-xl" />
                  )}
                  <input type="file" accept="image/*" onChange={handlePhotoChange}
                    className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">নাম</label>
                <input type="text" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400/50 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">ফোন নম্বর</label>
                <input type="tel" value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">জাতীয় পরিচয়পত্র নম্বর</label>
                <input type="text" value={form.nid}
                  onChange={e => setForm(f => ({ ...f, nid: e.target.value }))}
                  placeholder="NID নম্বর"
                  className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50 transition-all" />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => { setEditing(false); setPhotoFile(null); setPhotoPreview(null); }}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition-colors">
                  বাতিল
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60">
                  {saving && <span className="loading loading-spinner loading-xs" />}
                  সংরক্ষণ করুন
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'ফোন', value: profile?.phone || '—' },
                { label: 'NID', value: profile?.nid || '—' },
                { label: 'মাসিক চাঁদা', value: `${profile?.monthlyAmount} ৳` },
                { label: 'যোগদান', value: profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('bn-BD') : '—' },
              ].map((item, i) => (
                <div key={i} className="bg-slate-800/50 rounded-xl px-4 py-3">
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className="text-sm font-semibold text-white mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Stats */}
        {totalPaid && (
          <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 mb-6">
            <h2 className="text-base font-bold text-white mb-4">💰 পেমেন্ট সারসংক্ষেপ</h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'পুরনো পরিশোধ', value: `${totalPaid.openingTotal || 0} ৳`, color: 'text-slate-300' },
                { label: 'ওয়েবসাইটে', value: `${totalPaid.websiteTotal || 0} ৳`, color: 'text-blue-400' },
                { label: 'সর্বমোট', value: `${totalPaid.grandTotal || 0} ৳`, color: 'text-emerald-400' },
              ].map((s, i) => (
                <div key={i} className="text-center bg-slate-800/50 rounded-xl p-3">
                  <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dues */}
        {myDues.length > 0 && (
          <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-5">
            <h2 className="text-base font-bold text-red-400 mb-3">⚠️ বকেয়া তালিকা ({myDues.length} মাস)</h2>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {myDues.map((due, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 bg-red-500/5 rounded-lg">
                  <span className="text-sm text-slate-300">{['January','February','March','April','May','June','July','August','September','October','November','December'][due.month - 1]} {due.year}</span>
                  <span className="text-sm font-bold text-red-400">{due.amount} ৳</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}