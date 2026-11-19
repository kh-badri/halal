'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCheck,
  X,
  ExternalLink,
  MessageCircle,
  Mail,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Clock,
} from 'lucide-react';

export interface NotificationItem {
  id: string;
  type?: 'question' | 'answer' | 'sub_question' | 'agreed' | 'taaruf_activity' | 'system';
  title: string;
  body: string;
  url: string;
  targetRole?: 'pria' | 'wanita';
  senderRole?: 'pria' | 'wanita' | 'system';
  senderName?: string;
  createdAt: string;
  isRead?: boolean;
}

function formatRelativeTime(isoString?: string): string {
  if (!isoString) return 'Baru saja';
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return 'Baru saja';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} mnt lalu`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} jam lalu`;
    if (diffSec < 172800) return 'Kemarin';

    const day = date.getDate();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const month = monthNames[date.getMonth()];
    const hours = String(date.getHours()).padStart(2, '0');
    const mins = String(date.getMinutes()).padStart(2, '0');
    return `${day} ${month}, ${hours}:${mins}`;
  } catch {
    return 'Baru saja';
  }
}

export const NotificationBell: React.FC = () => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const lastCloseTimeRef = useRef<number>(0);

  // Close popup with timestamp record to prevent ghost click
  const closePopup = useCallback(() => {
    lastCloseTimeRef.current = Date.now();
    setIsOpen(false);
  }, []);

  // Toggle bell button
  const handleToggleBell = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Guard against ghost-click from closing backdrop touch
    if (Date.now() - lastCloseTimeRef.current < 450) {
      return;
    }
    if (isOpen) {
      closePopup();
    } else {
      setIsOpen(true);
      fetchNotifications();
    }
  };

  // Client-side mount flag
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch notifications from server
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(Number(data.unreadCount) || 0);
      }
    } catch (err) {
      // Quiet fail if offline
      console.debug('Failed to fetch notifications:', err);
    }
  }, []);

  // Initial fetch and periodic polling
  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 12000); // Check every 12s
    const handleFocus = () => fetchNotifications();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchNotifications]);

  // Lock body scroll when popup is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key and click outside (touch + mouse)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePopup();
    };

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (dropdownRef.current && dropdownRef.current.contains(target)) {
        return;
      }
      if (modalRef.current && modalRef.current.contains(target)) {
        return;
      }
      closePopup();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, closePopup]);

  // Mark a single notification as read and directly navigate to question/answer chat column
  const handleItemClick = async (notif: NotificationItem) => {
    closePopup();

    try {
      // Mark as read in local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
      if (!notif.isRead) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }

      // Sync read state with backend
      fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notif.id }),
      }).catch(() => {});
    } catch (err) {
      console.warn('Failed to mark read:', err);
    }

    if (!notif.url) return;

    // Extract target card ID
    const hashIndex = notif.url.indexOf('#');
    const cardId = hashIndex !== -1 ? notif.url.substring(hashIndex + 1) : '';

    // Determine target column focus
    let focusType = '';
    if (notif.type === 'answer') {
      focusType = notif.senderRole === 'pria' ? 'answer-pria' : 'answer-wanita';
    } else if (notif.type === 'sub_question') {
      focusType = 'sub';
    } else if (notif.type === 'question') {
      focusType = 'question';
    }

    if (typeof window !== 'undefined' && window.location.pathname.includes('/tahap/proses-taaruf')) {
      if (cardId) {
        window.location.hash = cardId;
      }
      // Broadcast instant navigation event to Stage2ProsesTaaruf component
      window.dispatchEvent(
        new CustomEvent('rth_navigate_card', {
          detail: { cardId, focusType, notifType: notif.type },
        })
      );
    } else {
      const targetUrl = cardId && focusType
        ? `/tahap/proses-taaruf?cardId=${encodeURIComponent(cardId)}&focus=${encodeURIComponent(focusType)}#${encodeURIComponent(cardId)}`
        : notif.url;
      router.push(targetUrl);
    }
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    try {
      setIsLoading(true);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);

      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
    } catch (err) {
      console.warn('Failed to mark all as read:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filterTab === 'unread') return !n.isRead;
    return true;
  });

  const getNotifIcon = (type?: string) => {
    switch (type) {
      case 'answer':
        return (
          <div className="w-8 h-8 rounded-full bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4" />
          </div>
        );
      case 'question':
      case 'sub_question':
        return (
          <div className="w-8 h-8 rounded-full bg-sky-100 text-azure-700 flex items-center justify-center shrink-0">
            <MessageCircle className="w-4 h-4" />
          </div>
        );
      case 'agreed':
        return (
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={handleToggleBell}
        className={`w-9 h-9 rounded-2xl bg-white border flex items-center justify-center transition-all relative active:scale-95 shadow-xs ${
          isOpen
            ? 'border-azure-500 bg-sky-50 text-azure-700 ring-2 ring-sky-100'
            : 'border-line hover:border-azure-300 text-slate-600 hover:text-navy-900'
        }`}
        title="Daftar Notifikasi Pertanyaan & Pesan"
        aria-label="Notifikasi"
      >
        <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'text-navy-900 animate-pulse' : ''}`} />

        {/* Red Badge with Count */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#EF4444] text-white text-[10px] font-black rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center shadow-xs border-2 border-white animate-scale-up pointer-events-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Pop-up Dialog Portalled directly to body to bypass any header overflow/backdrop-filter constraint */}
      {isOpen &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-[999] flex flex-col justify-end sm:justify-start sm:items-end pointer-events-none">
            {/* Fullscreen Backdrop */}
            <div
              className="fixed inset-0 bg-navy-950/45 backdrop-blur-2xs pointer-events-auto transition-opacity animate-fade-in"
              onClick={closePopup}
              onTouchEnd={(e) => {
                e.preventDefault();
                closePopup();
              }}
              aria-hidden="true"
            />

            {/* Modal Card: Native Bottom Sheet on Mobile, Floating Dropdown on Desktop */}
            <div
              ref={modalRef}
              className="relative z-10 pointer-events-auto w-full max-w-md mx-auto sm:max-w-none sm:w-96 max-h-[85vh] sm:max-h-[540px] bg-white rounded-t-3xl sm:rounded-3xl border border-line shadow-sheet overflow-hidden flex flex-col animate-scale-up sm:mt-14 sm:mr-4 mb-0 sm:mb-auto pb-safe"
            >
              {/* Mobile Drag Indicator Handle */}
              <div className="pt-2.5 pb-1 flex justify-center sm:hidden bg-slate-50/80 cursor-grab">
                <div className="w-10 h-1 bg-slate-300 rounded-full" />
              </div>

              {/* Header */}
              <div className="p-3.5 sm:p-4 bg-slate-50/80 border-b border-line flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-azure-50 text-azure-700 flex items-center justify-center font-bold">
                    <Bell className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs sm:text-sm font-extrabold text-navy-950">Notifikasi Masuk</h3>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.2 bg-[#FEE2E2] text-[#DC2626] text-[10px] font-black rounded-full">
                          {unreadCount} Baru
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500">Pertanyaan & jawaban dari calon pasangan</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      disabled={isLoading}
                      className="p-1 px-2 text-[10px] font-bold text-azure-700 hover:bg-sky-100/70 rounded-lg transition-colors flex items-center gap-1"
                      title="Tandai semua sudah dibaca"
                    >
                      <CheckCheck className="w-3 h-3" />
                      <span className="hidden xs:inline">Semua Dibaca</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="w-7 h-7 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
                    aria-label="Tutup notifikasi"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center px-3 pt-2 pb-1 border-b border-slate-100 gap-1 bg-white">
                <button
                  type="button"
                  onClick={() => setFilterTab('all')}
                  className={`flex-1 py-1 text-[11px] font-extrabold rounded-lg transition-all ${
                    filterTab === 'all'
                      ? 'bg-slate-100 text-navy-950 shadow-2xs'
                      : 'text-slate-500 hover:text-navy-900'
                  }`}
                >
                  Semua ({notifications.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab('unread')}
                  className={`flex-1 py-1 text-[11px] font-extrabold rounded-lg transition-all ${
                    filterTab === 'unread'
                      ? 'bg-[#FEE2E2] text-[#DC2626] shadow-2xs'
                      : 'text-slate-500 hover:text-navy-900'
                  }`}
                >
                  Belum Dibaca ({unreadCount})
                </button>
              </div>

              {/* Notification List Body */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-1">
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.map((notif) => (
                    <button
                      key={notif.id}
                      type="button"
                      onClick={() => handleItemClick(notif)}
                      className={`w-full text-left p-3 rounded-2xl flex items-start gap-2.5 transition-all group ${
                        notif.isRead
                          ? 'hover:bg-slate-50 opacity-80'
                          : 'bg-sky-50/40 hover:bg-sky-50/90 font-medium'
                      }`}
                    >
                      {/* Icon Avatar */}
                      {getNotifIcon(notif.type)}

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[11px] font-extrabold text-navy-950 truncate group-hover:text-azure-700 transition-colors">
                            {notif.title}
                          </span>
                          {!notif.isRead && (
                            <span className="w-2 h-2 rounded-full bg-[#EF4444] shrink-0 shadow-2xs" title="Belum dibaca" />
                          )}
                        </div>

                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                          {notif.body}
                        </p>

                        <div className="flex items-center gap-2 pt-1 text-[9px] text-slate-400">
                          {notif.senderName && (
                            <span className="font-bold text-azure-700 bg-sky-100/70 px-1.5 py-0.2 rounded">
                              {notif.senderName}
                            </span>
                          )}
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {formatRelativeTime(notif.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Arrow action indicator */}
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-azure-600 group-hover:translate-x-0.5 transition-all self-center shrink-0" />
                    </button>
                  ))
                ) : (
                  <div className="py-12 px-4 text-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h4 className="text-xs font-bold text-navy-950">Semua Beres!</h4>
                    <p className="text-[11px] text-slate-500 max-w-[220px] mx-auto leading-relaxed">
                      {filterTab === 'unread'
                        ? 'Tidak ada pertanyaan atau pesan yang belum dibaca.'
                        : 'Belum ada notifikasi pesan atau aktivitas baru saat ini.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-2.5 bg-slate-50 border-t border-line flex items-center justify-between text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    router.push('/tahap/proses-taaruf');
                  }}
                  className="w-full py-1.5 bg-white hover:bg-sky-50 border border-sky-200 text-azure-700 font-extrabold rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1"
                >
                  <span>Buka Sesi Tanya Jawab Ta'aruf</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
