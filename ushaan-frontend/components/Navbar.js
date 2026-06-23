"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ROLE_LABELS } from "@/lib/constants";
import api from '@/lib/api';
import UserAvatar from '@/components/UserAvatar';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
const [showNotifications, setShowNotifications] = useState(false);
const notificationRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications]);

  const loadUser = () => {
    try {
      const u = localStorage.getItem("user");
      if (u && u !== "undefined") setUser(JSON.parse(u));
      else setUser(null);
    } catch {
      setUser(null);
    }
  };
  const fetchNotifications = async () => {
  try {
    const res = await api.get('/notifications/my');
    setNotifications(res.data);
  } catch (err) {
    console.error(err);
  }
};

  const clearAllNotifications = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications([]);
      setShowNotifications(false);
    } catch (err) {
      console.error(err);
    }
  };
useEffect(() => {
  loadUser();

  window.addEventListener(
    "userChanged",
    loadUser
  );

  return () => {
    window.removeEventListener(
      "userChanged",
      loadUser
    );
  };
}, []);

useEffect(() => {
  if (!user) return;

  fetchNotifications();

  const interval = setInterval(() => {
    fetchNotifications();
  }, 30000);

  return () => clearInterval(interval);
}, [user]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    router.push("/login");
  };

  const getDashboardLink = () => {
    if (!user) return "/login";
    if (user.role === "admin") return "/dashboard/admin";
    if (user.role === "accountant") return "/dashboard/accountant";
    if (user.role === "general_secretary") return "/dashboard/secretary";
    return "/dashboard/member";
  };
 const unreadCount = notifications.filter(
  n => !n.isRead
).length;
  return (
    <nav className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-white/5 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={getDashboardLink()} className="flex items-center gap-3">
           
            <div className="relative w-9 h-9">
              <Image
                src="/ushaan.png"
                alt="ঊষাণ"
                fill
                sizes="36px"
                loading="eager"
                className="object-contain rounded-lg"
              />
            </div>
            <span className="text-lg font-black text-white">ঊষাণ</span>
          </Link>

          {/* Desktop Nav */}
          {user && (
            <div className="hidden md:flex items-center gap-1">
              <Link
                href="/projects"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === "/projects" ? "bg-amber-500/10 text-amber-400" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
              >
                প্রজেক্ট
              </Link>
              <Link
                href="/sheets"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === "/sheets" ? "bg-amber-500/10 text-amber-400" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
              >
                শিট
              </Link>
              <Link
                href="/members"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === "/members" ? "bg-amber-500/10 text-amber-400" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
              >
                সদস্য
              </Link>
            </div>
          )}

          {/* Right Side */}
          {user ? (
            <div className="flex items-center gap-3">
              {/* Role Badge */}
              <span className="hidden sm:block px-2.5 py-1 text-xs font-semibold bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
                {ROLE_LABELS[user.role]}
              </span>
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={async () => {
                    if (showNotifications) {
                      setShowNotifications(false);
                      return;
                    }

                    setShowNotifications(true);
                    try {
                      await api.patch('/notifications/read-all');
                      setNotifications((prev) =>
                        prev.map((n) => ({ ...n, isRead: true }))
                      );
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  className="relative p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20 transition-all group"
                >
                  <svg
                    className={`w-5.5 h-5.5 transition-transform group-hover:scale-110 ${unreadCount > 0 ? 'animate-bounce' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                    />
                  </svg>

                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold animate-pulse shadow-lg shadow-red-500/30">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="fixed inset-x-4 top-16 md:absolute md:right-0 md:left-auto md:inset-x-auto md:top-auto mt-2 w-auto md:w-80 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                      <h3 className="font-bold text-white">Notifications</h3>
                      {notifications.length > 0 && (
                        <button
                          onClick={clearAllNotifications}
                          className="text-xs text-amber-400 hover:text-amber-300 font-semibold transition-colors"
                        >
                          সব মুছুন
                        </button>
                      )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-sm text-slate-400">
                          কোনো নোটিফিকেশন নেই
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 ${
                              !n.isRead ? "bg-amber-500/5" : ""
                            }`}
                            onClick={async () => {
                              if (!n.isRead) {
                                try {
                                  await api.patch(`/notifications/${n.id}/read`);
                                  setNotifications((prev) =>
                                    prev.map((item) =>
                                      item.id === n.id
                                        ? { ...item, isRead: true }
                                        : item
                                    )
                                  );
                                } catch (err) {
                                  console.error(err);
                                }
                              }
                            }}
                          >
                            <p className="text-sm text-white">{n.message}</p>

                            <p className="text-xs text-slate-400 mt-1">
                              {new Date(n.createdAt).toLocaleString()}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Dropdown */}
              <div className="dropdown dropdown-end">
                <button
                  tabIndex={0}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-white/5 transition-colors"
                >
                  
                  <UserAvatar user={user} className="w-8 h-8 rounded-lg overflow-hidden shrink-0" />
                  <span className="hidden sm:block text-sm font-medium text-white max-w-[100px] truncate">
                    {user.name}
                  </span>
                  <svg
                    className="w-3.5 h-3.5 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                    />
                  </svg>
                </button>

                <ul
                  tabIndex={0}
                  className="dropdown-content z-50 mt-2 w-56 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                >
                  <li className="px-4 py-3 border-b border-white/5">
                    <p className="text-sm font-bold text-white truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {user.email}
                    </p>
                    <p className="text-xs text-amber-400 mt-0.5">
                      {ROLE_LABELS[user.role]}
                    </p>
                  </li>
                  <div className="py-1.5">
                    <li>
                      <Link
                        href={getDashboardLink()}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 transition-colors"
                      >
                        <svg
                          className="w-4 h-4 text-slate-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.8}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
                          />
                        </svg>
                        ড্যাশবোর্ড
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/profile"
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 transition-colors"
                      >
                        <svg
                          className="w-4 h-4 text-slate-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.8}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                          />
                        </svg>
                        প্রোফাইল
                      </Link>
                    </li>
                  </div>
                  <li className="border-t border-white/5 py-1.5">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-400 hover:bg-red-500/5 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.8}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                        />
                      </svg>
                      লগআউট
                    </button>
                  </li>
                </ul>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  {menuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                    />
                  )}
                </svg>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl transition-colors"
            >
              লগইন
            </Link>
          )}
        </div>

        {/* Mobile Menu */}
        {menuOpen && user && (
          <div className="md:hidden border-t border-white/5 py-3 space-y-1">
            {[
              { href: "/projects", label: "প্রজেক্ট" },
              { href: "/sheets", label: "শিট" },
              { href: "/members", label: "সদস্য" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${pathname === href ? "bg-amber-500/10 text-amber-400" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
              >
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );

}
