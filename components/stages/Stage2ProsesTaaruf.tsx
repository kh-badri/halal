'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  MessageSquare,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Shield,
  Trash2,
  Loader2,
  HelpCircle,
  Edit3,
  Lightbulb,
  Check,
  FileText,
  User,
  Users,
  Search,
  Lock,
  Unlock,
  History,
  X,
  ArrowRight,
  ShieldAlert,
  Eye,
  Calendar,
  ArrowUpDown,
  Filter,
  Bell,
  BellRing,
  BellOff,
  Send,
  MessageSquareReply,
  CornerDownRight,
} from 'lucide-react';
import { QA_CATEGORIES, DEFAULT_QA_CARDS } from '@/lib/constants/qa-data';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useToast } from '@/components/ui/Toast';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  showPushNotification,
} from '@/lib/notifications/pwa-notifications';

// Date Helpers for Taaruf Sessions
function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateIndonesian(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

function formatShortDateIndonesian(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
      });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

interface Stage2Props {
  workspaceId: string;
  isReadOnly: boolean;
  userAccess?: string;
  onDataChanged?: () => void;
}

interface SubQuestionItem {
  id: string;
  createdAt: string;
  asker: 'pria' | 'wanita';
  question: string;
  answerPria?: string;
  answerWanita?: string;
  sentAtPria?: string;
  sentAtWanita?: string;
}

interface QuestionItem {
  id: string;
  asker: 'pria' | 'wanita';
  question: string;
  answerPria: string;
  answerWanita: string;
  sentAtPria?: string;
  sentAtWanita?: string;
  subQuestions?: SubQuestionItem[];
  note: string;
  status: 'belum' | 'dibahas' | 'sepakat' | 'ulang' | 'pertimbangan';
  principle: boolean;
  category?: string;
  sessionDate?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  custom?: boolean;
}

interface ActivityLogItem {
  id: string;
  timestamp: string;
  userName: string;
  userRole: string;
  action: string;
  title: string;
  questionText: string;
  oldValue: string;
  newValue: string;
  details?: string;
}

const STATUS_LABELS: Record<string, string> = {
  belum: 'Belum Dibahas',
  dibahas: 'Sedang Dibahas',
  pertimbangan: 'Dipertimbangkan',
  sepakat: 'Sepakat',
  ulang: 'Perlu Bahas Ulang',
};

export function Stage2ProsesTaaruf({
  workspaceId,
  isReadOnly,
  userAccess: initialUserAccess,
  onDataChanged,
}: Stage2Props) {
  const { showToast, showSaveIndicator } = useToast();

  const [loading, setLoading] = useState(true);
  const [taarufData, setTaarufData] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<'pria' | 'wanita'>('pria');
  const [userAccessState, setUserAccessState] = useState<string>(initialUserAccess || 'owner');

  // Nama Calon Pria & Calon Perempuan
  const priaName = useMemo(() => {
    if (userRole === 'pria') {
      return profileData?.self?.fullName || profileData?.self?.nickname || 'Calon Pria';
    }
    return profileData?.partner?.fullName || profileData?.partner?.nickname || 'Calon Pria';
  }, [userRole, profileData]);

  const wanitaName = useMemo(() => {
    if (userRole === 'wanita') {
      return profileData?.self?.fullName || profileData?.self?.nickname || 'Calon Perempuan';
    }
    return profileData?.partner?.fullName || profileData?.partner?.nickname || 'Calon Perempuan';
  }, [userRole, profileData]);

  // Navigation tab: 'pria' = Pertanyaan Calon Pria, 'wanita' = Pertanyaan Calon Perempuan, 'all' = Semua
  const [activeTab, setActiveTab] = useState<'pria' | 'wanita' | 'all'>('pria');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unagreed' | 'principle'>('all');

  // Modals & Sheets
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isIdeaSheetOpen, setIsIdeaSheetOpen] = useState(false);
  const [isLogOpen, setIsLogOpen] = useState(false);

  // Full Text Viewer Popup Modal
  const [viewFullModal, setViewFullModal] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    content: string;
    badgeText?: string;
    badgeColor?: 'blue' | 'sky' | 'amber' | 'slate';
  } | null>(null);

  // Handle Escape key to close popup modal
  useEffect(() => {
    if (!viewFullModal?.isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setViewFullModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewFullModal?.isOpen]);

  // Sesi Tanggal Filter States
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all');
  const [dateSortOrder, setDateSortOrder] = useState<'asc' | 'desc'>('asc');

  // Edit Pertanyaan Modal
  const [editingQuestion, setEditingQuestion] = useState<QuestionItem | null>(null);
  const [editTextValue, setEditTextValue] = useState('');
  const [editCategoryValue, setEditCategoryValue] = useState('');
  const [editAskerValue, setEditAskerValue] = useState<'pria' | 'wanita'>('pria');
  const [editSessionDateValue, setEditSessionDateValue] = useState<string>('');

  // Form tambah pertanyaan
  const [formAsker, setFormAsker] = useState<'pria' | 'wanita'>('pria');
  const [formQuestion, setFormQuestion] = useState('');
  const [formCategory, setFormCategory] = useState<string>('Visi, Agama & Ibadah');
  const [formPrinciple, setFormPrinciple] = useState(false);
  const [formAnswerSelf, setFormAnswerSelf] = useState('');
  const [formSessionDate, setFormSessionDate] = useState<string>(() => getTodayDateString());

  // Push Notification States
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const previousQaCardsRef = useRef<any[] | null>(null);
  const isInitialDataLoadedRef = useRef<boolean>(false);

  // Sub-Question Modal State
  const [subQuestionModal, setSubQuestionModal] = useState<{
    isOpen: boolean;
    targetCard: QuestionItem | null;
  }>({
    isOpen: false,
    targetCard: null,
  });
  const [subQuestionText, setSubQuestionText] = useState('');
  const [subQuestionAsker, setSubQuestionAsker] = useState<'pria' | 'wanita'>('pria');

  useEffect(() => {
    setNotificationPermission(getNotificationPermission());
  }, []);

  const handleEnableNotification = async () => {
    const res = await requestNotificationPermission();
    setNotificationPermission(res);
    if (res === 'granted') {
      showToast('Notifikasi pop-up layar HP berhasil diaktifkan!', 'success');
    } else if (res === 'denied') {
      showToast('Izin notifikasi ditolak. Anda dapat mengaktifkannya di pengaturan browser HP.', 'error');
    }
  };

  const handleTestNotification = async () => {
    const partnerNameDisplay = userRole === 'pria' ? (wanitaName || 'Calon Pasangan') : (priaName || 'Calon Pasangan');
    await showPushNotification('💌 Uji Coba: Jawaban dari Calon Pasangan', {
      body: `${partnerNameDisplay} telah menjawab pertanyaan ta'aruf. Ketuk untuk membuka!`,
      url: '/tahap/proses-taaruf',
      tag: 'test-notification-' + Date.now(),
    });
    showToast('Uji coba notifikasi telah dikirim ke layar HP Anda!', 'info');
  };

  // Search in Idea Sheet & Log Sheet
  const [ideaSearch, setIdeaSearch] = useState('');
  const [ideaCategory, setIdeaCategory] = useState<string>('Semua');
  const [logSearch, setLogSearch] = useState('');
  const [logFilterAction, setLogFilterAction] = useState<string>('all');

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Ref to track field value on focus to create accurate "from -> to" diffs on blur
  const focusedFieldRef = useRef<{
    cardId: string;
    field: string;
    initialValue: string;
  } | null>(null);

  // Live Sync References
  const lastKnownUpdatedAtRef = useRef<string | null>(null);
  const syncChannelRef = useRef<BroadcastChannel | null>(null);

  // Function to fetch latest taaruf data and merge without overwriting active editing
  const fetchLatestTaaruf = useCallback(async () => {
    try {
      const res = await fetch('/api/m/taaruf?t=' + Date.now(), {
        cache: 'no-store',
      });
      if (!res.ok) return;

      const json = await res.json();
      const serverData = json.data || json;
      if (!serverData) return;

      const serverUpdatedAt = serverData.updatedAt || '';
      // If server data is identical to what we already have, skip to save performance
      if (lastKnownUpdatedAtRef.current && serverUpdatedAt === lastKnownUpdatedAtRef.current) {
        return;
      }

      lastKnownUpdatedAtRef.current = serverUpdatedAt;

      // Detect Partner Activities and Trigger Push Notification (ONLY when explicitly sent, not during typing)
      if (isInitialDataLoadedRef.current && previousQaCardsRef.current && Array.isArray(serverData.qaCards)) {
        const prevCards: any[] = previousQaCardsRef.current;
        const newCards: any[] = serverData.qaCards;

        const currentRole = userRole || 'pria';
        const partnerRole = currentRole === 'pria' ? 'wanita' : 'pria';
        const partnerNameDisplay = partnerRole === 'pria' ? (priaName || 'Calon Pria') : (wanitaName || 'Calon Pasangan');

        for (const card of newCards) {
          if (card.deletedAt) continue;
          const oldCard = prevCards.find((oc: any) => oc.id === card.id);

          // 1. Detect new question asked by partner
          if (!oldCard && card.asker === partnerRole) {
            showPushNotification('💬 Pertanyaan Baru Masuk', {
              body: `${partnerNameDisplay}: "${card.question}"`,
              tag: `new-question-${card.id}`,
              url: '/tahap/proses-taaruf',
            });
            continue;
          }

          if (oldCard) {
            // 2. Detect partner's answer explicitly SENT (sentAt changed, never during typing)
            const partnerSentField = partnerRole === 'pria' ? 'sentAtPria' : 'sentAtWanita';
            const oldSentAt = oldCard[partnerSentField];
            const newSentAt = card[partnerSentField];

            if (newSentAt && newSentAt !== oldSentAt) {
              const partnerAnswerField = partnerRole === 'pria' ? 'answerPria' : 'answerWanita';
              const answerText = (card[partnerAnswerField] || '').trim();
              if (answerText) {
                showPushNotification('💌 Jawaban Masuk dari Pasangan', {
                  body: `${partnerNameDisplay} telah mengirim jawaban: "${card.question.slice(0, 42)}${card.question.length > 42 ? '...' : ''}"`,
                  tag: `new-answer-${card.id}-${newSentAt}`,
                  url: '/tahap/proses-taaruf',
                });
              }
            }

            // 3. Detect new sub-question / sanggahan from partner
            const oldSubs: any[] = oldCard.subQuestions || [];
            const newSubs: any[] = card.subQuestions || [];
            for (const sub of newSubs) {
              const oldSub = oldSubs.find((os: any) => os.id === sub.id);
              if (!oldSub && sub.asker === partnerRole) {
                showPushNotification('💬 Sanggahan / Sub-Pertanyaan Baru', {
                  body: `${partnerNameDisplay}: "${sub.question.slice(0, 45)}${sub.question.length > 45 ? '...' : ''}"`,
                  tag: `new-sub-q-${sub.id}`,
                  url: '/tahap/proses-taaruf',
                });
              } else if (oldSub) {
                // Check if partner answered the sub-question
                const subPartnerSentField = partnerRole === 'pria' ? 'sentAtPria' : 'sentAtWanita';
                if (sub[subPartnerSentField] && sub[subPartnerSentField] !== oldSub[subPartnerSentField]) {
                  showPushNotification('💬 Tanggapan Sanggahan Masuk', {
                    body: `${partnerNameDisplay} menanggapi sanggahan pada: "${card.question.slice(0, 35)}..."`,
                    tag: `sub-ans-${sub.id}-${sub[subPartnerSentField]}`,
                    url: '/tahap/proses-taaruf',
                  });
                }
              }
            }

            // 4. Detect question status changed to agreed
            if (oldCard.status !== 'sepakat' && card.status === 'sepakat') {
              showPushNotification('🎉 Poin Pertanyaan Disepakati!', {
                body: `"${card.question.slice(0, 45)}..." telah disepakati bersama.`,
                tag: `agreed-${card.id}`,
                url: '/tahap/proses-taaruf',
              });
            }
          }
        }
      }

      previousQaCardsRef.current = serverData.qaCards || [];

      // Merge gracefully: never overwrite the field currently focused by the local user
      setTaarufData((prevData: any) => {
        if (!prevData) return serverData;

        // If local user is actively typing in a field, preserve that field
        if (focusedFieldRef.current) {
          const focusedCardId = focusedFieldRef.current.cardId;
          const focusedField = focusedFieldRef.current.field;
          const localCard = (prevData.qaCards || []).find((c: any) => c.id === focusedCardId);

          if (localCard) {
            const mergedCards = (serverData.qaCards || []).map((sCard: any) => {
              if (sCard.id === focusedCardId) {
                return {
                  ...sCard,
                  [focusedField]: localCard[focusedField],
                };
              }
              return sCard;
            });

            return {
              ...serverData,
              qaCards: mergedCards,
            };
          }
        }

        return serverData;
      });

      onDataChanged?.();
    } catch (err) {
      console.warn('Live sync poll error (retrying):', err);
    }
  }, [onDataChanged, userRole, priaName, wanitaName]);

  useEffect(() => {
    async function loadData() {
      try {
        const [taarufRes, profileRes, authRes, routeRes] = await Promise.all([
          fetch('/api/m/taaruf?t=' + Date.now(), { cache: 'no-store' }),
          fetch('/api/m/profile'),
          fetch('/api/auth/me'),
          fetch('/api/route'),
        ]);

        if (taarufRes.ok) {
          const tJson = await taarufRes.json();
          const tData = tJson.data || tJson;
          setTaarufData(tData);
          if (tData?.updatedAt) {
            lastKnownUpdatedAtRef.current = tData.updatedAt;
          }
          previousQaCardsRef.current = tData?.qaCards || [];
          isInitialDataLoadedRef.current = true;
        }
        if (profileRes.ok) {
          const pJson = await profileRes.json();
          setProfileData(pJson.data || pJson);
        }
        if (authRes.ok) {
          const aJson = await authRes.json();
          if (aJson.user) {
            setCurrentUser(aJson.user);
            if (aJson.user.role) {
              const role = aJson.user.role === 'wanita' ? 'wanita' : 'pria';
              setUserRole(role);
              setActiveTab(role);
              setFormAsker(role);
            }
          }
        }
        if (routeRes.ok) {
          const rJson = await routeRes.json();
          if (rJson.access) {
            setUserAccessState(rJson.access);
          }
        }
      } catch (err) {
        console.error('Error loading taaruf Q&A:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Setup BroadcastChannel & Ultra-fast Live Polling (1.5s interval)
  useEffect(() => {
    // 1. BroadcastChannel for 0ms cross-tab sync
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel('rth_taaruf_sync');
      syncChannelRef.current = bc;
      bc.onmessage = (event) => {
        if (event.data?.type === 'TAARUF_UPDATED') {
          fetchLatestTaaruf();
        }
      };
    }

    // 2. High-speed live polling (1.5s when active, 8s when tab hidden)
    let timer: NodeJS.Timeout;
    const runPoll = () => {
      const intervalMs = document.hidden ? 8000 : 1500;
      timer = setTimeout(async () => {
        await fetchLatestTaaruf();
        runPoll();
      }, intervalMs);
    };
    runPoll();

    // 3. Immediate sync on window focus or visibility change
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchLatestTaaruf();
      }
    };
    const handleFocus = () => {
      fetchLatestTaaruf();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      if (syncChannelRef.current) {
        syncChannelRef.current.close();
      }
    };
  }, [fetchLatestTaaruf]);

  // Determine if current user is Workspace Owner
  const isOwner = useMemo(() => {
    return userAccessState === 'owner';
  }, [userAccessState]);

  // Permission: Apakah pasangan (undangan) diizinkan mengisi & mengedit jawaban?
  const allowPartnerAnswers = useMemo(() => {
    return Boolean(taarufData?.allowPartnerAnswers);
  }, [taarufData]);

  // Apakah user saat ini boleh mengedit kolom jawaban?
  // Pemilik SELALU boleh. Undangan HANYA boleh jika allowPartnerAnswers = true.
  const canEditAnswers = useMemo(() => {
    if (isReadOnly) return false;
    if (isOwner) return true;
    return allowPartnerAnswers;
  }, [isReadOnly, isOwner, allowPartnerAnswers]);

  // Current actor display name & role
  const currentActorName = useMemo(() => {
    if (currentUser?.name) return currentUser.name;
    if (isOwner) return 'Pemilik';
    return 'Pasangan (Undangan)';
  }, [currentUser, isOwner]);

  const currentActorRoleText = useMemo(() => {
    return isOwner ? 'Pemilik' : 'Pasangan (Undangan)';
  }, [isOwner]);

  // Helper to append a structured activity log
  const createLogEntry = (
    action: string,
    title: string,
    questionText: string,
    oldValue: string,
    newValue: string,
    details?: string
  ): ActivityLogItem => {
    return {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      userName: currentActorName,
      userRole: currentActorRoleText,
      action,
      title,
      questionText: questionText || '',
      oldValue: oldValue || '',
      newValue: newValue || '',
      details: details || '',
    };
  };

  const saveTaarufWithLog = (newData: any, newLog?: ActivityLogItem) => {
    const nowIso = new Date().toISOString();
    let dataToSave = { ...newData, updatedAt: nowIso };
    lastKnownUpdatedAtRef.current = nowIso;

    if (newLog) {
      const existingLogs: ActivityLogItem[] = newData?.activityLogs || [];
      dataToSave.activityLogs = [newLog, ...existingLogs].slice(0, 100);
    }

    setTaarufData(dataToSave);
    previousQaCardsRef.current = dataToSave.qaCards || [];
    if (isReadOnly) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/m/taaruf', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSave),
        });
        if (res.ok) {
          const resJson = await res.json();
          if (resJson.data?.updatedAt) {
            lastKnownUpdatedAtRef.current = resJson.data.updatedAt;
          }
        }
        showSaveIndicator();
        onDataChanged?.();

        // Broadcast to other tabs immediately
        if (syncChannelRef.current) {
          syncChannelRef.current.postMessage({
            type: 'TAARUF_UPDATED',
            updatedAt: nowIso,
          });
        }
      } catch (err) {
        console.error('Failed to save taaruf Q&A:', err);
      }
    }, 600);
  };

  // Filter out legacy unedited 57-card template items so the page remains clean and focused
  const questions: QuestionItem[] = useMemo(() => {
    const rawCards = taarufData?.qaCards || [];
    return rawCards
      .filter((c: any) => {
        if (c.deletedAt) return false;
        // Check if it's an untouched legacy template card
        const isLegacyTemplate = !c.custom && typeof c.id === 'string' && /^qa-\d+$/.test(c.id);
        const hasBeenEdited =
          Boolean(c.answerPria?.trim()) ||
          Boolean(c.answerWanita?.trim()) ||
          Boolean(c.answerSelf?.trim()) ||
          Boolean(c.answerPartner?.trim()) ||
          Boolean(c.note?.trim()) ||
          c.status !== 'belum';

        if (isLegacyTemplate && !hasBeenEdited) {
          return false;
        }
        return true;
      })
      .map((c: any) => {
        // Map answer fields
        const answerPria = c.answerPria ?? (userRole === 'pria' ? c.answerSelf : c.answerPartner) ?? '';
        const answerWanita = c.answerWanita ?? (userRole === 'wanita' ? c.answerSelf : c.answerPartner) ?? '';
        const asker = c.asker || (c.id?.includes('wanita') ? 'wanita' : 'pria');

        let sessionDate = c.sessionDate;
        if (!sessionDate && c.createdAt) {
          try {
            sessionDate = new Date(c.createdAt).toISOString().slice(0, 10);
          } catch {
            sessionDate = c.createdAt.slice(0, 10);
          }
        }
        if (!sessionDate) {
          sessionDate = getTodayDateString();
        }

        return {
          ...c,
          asker,
          answerPria,
          answerWanita,
          sentAtPria: c.sentAtPria,
          sentAtWanita: c.sentAtWanita,
          subQuestions: c.subQuestions || [],
          status: c.status || 'belum',
          principle: Boolean(c.principle),
          note: c.note || '',
          sessionDate,
        };
      });
  }, [taarufData, userRole]);

  // Statistics
  const totalCount = questions.length;
  const agreedCount = questions.filter((q) => q.status === 'sepakat').length;
  const discussedCount = questions.filter((q) => q.status === 'dibahas').length;
  const considerationCount = questions.filter((q) => q.status === 'pertimbangan').length;
  const rediscussCount = questions.filter((q) => q.status === 'ulang').length;
  const unhandledCount = questions.filter((q) => q.status === 'belum').length;
  const principleQuestions = questions.filter((q) => q.principle);
  const principleAgreedCount = principleQuestions.filter((q) => q.status === 'sepakat').length;

  const progressPercent = totalCount > 0 ? Math.round((agreedCount / totalCount) * 100) : 0;

  // Questions count by asker
  const priaQuestions = useMemo(() => questions.filter((q) => q.asker === 'pria'), [questions]);
  const wanitaQuestions = useMemo(() => questions.filter((q) => q.asker === 'wanita'), [questions]);

  // Available session dates from all questions, generating sequence from start date up to today
  const availableSessionDates = useMemo(() => {
    const today = getTodayDateString();
    const dateMap = new Map<string, number>();

    // Initial min date default: 2026-11-10 as requested by user ("misal tanggal 10, tanggal 11...")
    let minDateStr = '2026-11-10';
    if (minDateStr > today) minDateStr = today;

    questions.forEach((q) => {
      const d = q.sessionDate || today;
      if (d < minDateStr) minDateStr = d;

      const matchesTab = activeTab === 'all' || q.asker === activeTab;
      if (matchesTab) {
        dateMap.set(d, (dateMap.get(d) || 0) + 1);
      }
    });

    // Generate continuous sequence of dates from minDateStr to today
    const allDates: string[] = [];
    try {
      const startDate = new Date(minDateStr + 'T00:00:00');
      const endDate = new Date(today + 'T00:00:00');
      const diffDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays >= 0 && diffDays <= 60) {
        const cur = new Date(startDate);
        while (cur <= endDate) {
          const y = cur.getFullYear();
          const m = String(cur.getMonth() + 1).padStart(2, '0');
          const day = String(cur.getDate()).padStart(2, '0');
          allDates.push(`${y}-${m}-${day}`);
          cur.setDate(cur.getDate() + 1);
        }
      } else {
        dateMap.set(today, dateMap.get(today) || 0);
        allDates.push(...Array.from(dateMap.keys()));
      }
    } catch {
      dateMap.set(today, dateMap.get(today) || 0);
      allDates.push(...Array.from(dateMap.keys()));
    }

    // Sort order: 'asc' = 10, 11, 12 ... Hari Ini; 'desc' = Hari Ini ... 12, 11, 10
    const uniqueSorted = Array.from(new Set(allDates)).sort((a, b) => {
      return dateSortOrder === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
    });

    return uniqueSorted.map((d) => ({
      date: d,
      count: dateMap.get(d) || 0,
      isToday: d === today,
    }));
  }, [questions, activeTab, dateSortOrder]);

  // Filtered by active tab, status, and selected date session
  const visibleQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (activeTab === 'pria' && q.asker !== 'pria') return false;
      if (activeTab === 'wanita' && q.asker !== 'wanita') return false;
      if (statusFilter === 'unagreed' && q.status === 'sepakat') return false;
      if (statusFilter === 'principle' && !q.principle) return false;
      if (selectedDateFilter !== 'all' && q.sessionDate !== selectedDateFilter) return false;
      return true;
    });
  }, [questions, activeTab, statusFilter, selectedDateFilter]);

  // Grouped questions by session date for 'all' mode
  const groupedQuestionsByDate = useMemo(() => {
    const groups: Record<string, QuestionItem[]> = {};
    visibleQuestions.forEach((q) => {
      const dateKey = q.sessionDate || getTodayDateString();
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(q);
    });

    const sortedDates = Object.keys(groups).sort((a, b) => {
      return dateSortOrder === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
    });

    return sortedDates.map((date) => ({
      date,
      items: groups[date],
    }));
  }, [visibleQuestions, dateSortOrder]);

  // Activity logs list
  const activityLogs: ActivityLogItem[] = useMemo(() => {
    return taarufData?.activityLogs || [];
  }, [taarufData]);

  // Update question card with logging
  const updateQuestion = (questionId: string, patch: Partial<QuestionItem>, logMeta?: { title: string; action: string; oldValue: string; newValue: string; details?: string }) => {
    if (isReadOnly) return;
    const now = new Date().toISOString();
    let targetQuestionText = '';

    const updatedCards = (taarufData?.qaCards || []).map((c: any) => {
      if (c.id === questionId) {
        targetQuestionText = c.question || '';
        const merged = { ...c, ...patch, updatedAt: now };
        // Sync backward-compatible fields
        if ('answerPria' in patch || 'answerWanita' in patch) {
          merged.answerSelf = userRole === 'wanita' ? merged.answerWanita : merged.answerPria;
          merged.answerPartner = userRole === 'wanita' ? merged.answerPria : merged.answerWanita;
        }
        return merged;
      }
      return c;
    });

    let newLog: ActivityLogItem | undefined;
    if (logMeta) {
      newLog = createLogEntry(
        logMeta.action,
        logMeta.title,
        targetQuestionText,
        logMeta.oldValue,
        logMeta.newValue,
        logMeta.details
      );
    }

    saveTaarufWithLog({ ...taarufData, qaCards: updatedCards }, newLog);
  };

  // Blur handler for answer textareas & notes to log precise "From -> To" diffs
  const handleFieldBlur = (card: QuestionItem, field: 'answerPria' | 'answerWanita' | 'note', currentValue: string) => {
    if (isReadOnly) return;
    const tracked = focusedFieldRef.current;
    if (!tracked || tracked.cardId !== card.id || tracked.field !== field) return;

    const initialVal = tracked.initialValue.trim();
    const finalVal = (currentValue || '').trim();

    if (initialVal !== finalVal) {
      let title = '';
      let action = '';
      if (field === 'answerPria') {
        title = `Edit Jawaban Calon Pria (${priaName})`;
        action = 'edit_answer_pria';
      } else if (field === 'answerWanita') {
        title = `Edit Jawaban Calon Perempuan (${wanitaName})`;
        action = 'edit_answer_wanita';
      } else {
        title = 'Edit Catatan Kesepakatan';
        action = 'edit_note';
      }

      const log = createLogEntry(
        action,
        title,
        card.question,
        initialVal || '(Kosong / Belum ada isian)',
        finalVal || '(Dikosongkan)',
        `${currentActorName} mengubah isian pada pertanyaan: "${card.question}"`
      );

      saveTaarufWithLog(taarufData, log);
    }

    focusedFieldRef.current = null;
  };

  // Status Change with Log
  const handleStatusChange = (card: QuestionItem, newStatus: 'belum' | 'dibahas' | 'sepakat' | 'ulang' | 'pertimbangan') => {
    if (isReadOnly || card.status === newStatus) return;

    const oldLabel = STATUS_LABELS[card.status] || card.status;
    const newLabel = STATUS_LABELS[newStatus] || newStatus;

    updateQuestion(
      card.id,
      { status: newStatus },
      {
        action: 'change_status',
        title: 'Ubah Status Kesepakatan',
        oldValue: oldLabel,
        newValue: newLabel,
        details: `${currentActorName} mengubah status kesepakatan dari "${oldLabel}" menjadi "${newLabel}"`,
      }
    );
  };

  // Principle Toggle with Log
  const handlePrincipleToggle = (card: QuestionItem, isChecked: boolean) => {
    if (isReadOnly) return;

    updateQuestion(
      card.id,
      { principle: isChecked },
      {
        action: 'toggle_principle',
        title: 'Ubah Label Prinsip (Dealbreaker)',
        oldValue: card.principle ? 'Prinsip (Dealbreaker)' : 'Bukan Prinsip',
        newValue: isChecked ? 'Prinsip (Dealbreaker)' : 'Bukan Prinsip',
        details: isChecked
          ? `${currentActorName} menandai pertanyaan ini sebagai Prinsip (Dealbreaker)`
          : `${currentActorName} menghapus tanda Prinsip dari pertanyaan ini`,
      }
    );
  };

  // Toggle Izin Pasangan Mengisi Jawaban (HANYA PEMILIK)
  const handleTogglePartnerPermission = () => {
    if (!isOwner || isReadOnly) return;
    const newPermission = !allowPartnerAnswers;

    const log = createLogEntry(
      'toggle_permission',
      'Ubah Izin Pengisian Jawaban Pasangan',
      '-',
      allowPartnerAnswers ? 'Diizinkan (Pasangan Boleh Mengisi)' : 'Dikunci (Hanya Pemilik)',
      newPermission ? 'Diizinkan (Pasangan Boleh Mengisi)' : 'Dikunci (Hanya Pemilik)',
      newPermission
        ? 'Pemilik memberikan izin kepada pasangan untuk mengisi dan mengedit jawaban ta’aruf.'
        : 'Pemilik mengunci pengisian jawaban pasangan sehingga hanya pemilik yang dapat mengedit.'
    );

    saveTaarufWithLog({ ...taarufData, allowPartnerAnswers: newPermission }, log);
    showToast(
      newPermission
        ? 'Izin dibuka: Pasangan kini dapat mengisi & mengedit jawaban.'
        : 'Izin dikunci: Pengisian jawaban pasangan dinonaktifkan.',
      'info'
    );
  };

  // Buka Modal Edit Pertanyaan
  const handleOpenEditModal = (card: QuestionItem) => {
    setEditingQuestion(card);
    setEditTextValue(card.question);
    setEditCategoryValue(card.category || 'Visi, Agama & Ibadah');
    setEditAskerValue(card.asker || 'pria');
    setEditSessionDateValue(card.sessionDate || getTodayDateString());
  };

  // Simpan Perubahan Teks Pertanyaan (dengan Log yang jelas)
  const handleSaveEditQuestion = () => {
    if (!editingQuestion || !editTextValue.trim() || isReadOnly) return;

    const oldText = editingQuestion.question;
    const newText = editTextValue.trim();
    const oldAsker = editingQuestion.asker === 'pria' ? 'Calon Pria' : 'Calon Perempuan';
    const newAsker = editAskerValue === 'pria' ? 'Calon Pria' : 'Calon Perempuan';
    const oldDate = editingQuestion.sessionDate || '';
    const newDate = editSessionDateValue || getTodayDateString();

    const hasTextChanged = oldText !== newText;
    const hasAskerChanged = editingQuestion.asker !== editAskerValue;
    const hasCategoryChanged = editingQuestion.category !== editCategoryValue;
    const hasDateChanged = oldDate !== newDate;

    if (!hasTextChanged && !hasAskerChanged && !hasCategoryChanged && !hasDateChanged) {
      setEditingQuestion(null);
      return;
    }

    let details = `${currentActorName} memperbarui pertanyaan.`;
    if (hasTextChanged) {
      details += ` Teks diubah.`;
    }
    if (hasAskerChanged) {
      details += ` Penanya diubah dari ${oldAsker} ke ${newAsker}.`;
    }
    if (hasDateChanged) {
      details += ` Sesi tanggal diubah ke ${formatDateIndonesian(newDate)}.`;
    }

    updateQuestion(
      editingQuestion.id,
      {
        question: newText,
        asker: editAskerValue,
        category: editCategoryValue,
        sessionDate: newDate,
      },
      {
        action: 'edit_question',
        title: 'Edit Pertanyaan Pranikah',
        oldValue: `[${oldAsker}] ${oldText}`,
        newValue: `[${newAsker}] ${newText}`,
        details,
      }
    );

    setEditingQuestion(null);
    showToast('Pertanyaan berhasil diperbarui', 'success');
  };

  // Delete Question with Log
  const handleDeleteQuestion = (card: QuestionItem) => {
    if (isReadOnly) return;
    if (!window.confirm(`Hapus pertanyaan: "${card.question}"?`)) return;

    const now = new Date().toISOString();
    const updatedCards = (taarufData?.qaCards || []).map((c: any) => {
      if (c.id === card.id) {
        return { ...c, deletedAt: now };
      }
      return c;
    });

    const deletedDetails = [
      card.answerPria ? `Jawaban Pria: ${card.answerPria}` : null,
      card.answerWanita ? `Jawaban Wanita: ${card.answerWanita}` : null,
      card.note ? `Catatan: ${card.note}` : null,
    ]
      .filter(Boolean)
      .join(' | ');

    const log = createLogEntry(
      'delete_question',
      'Hapus Pertanyaan Pranikah',
      card.question,
      `Pertanyaan: "${card.question}" (Penanya: ${card.asker === 'pria' ? 'Calon Pria' : 'Calon Perempuan'})`,
      'Dihapus dari daftar tanya jawab',
      deletedDetails ? `Data yang ikut terhapus: ${deletedDetails}` : `${currentActorName} menghapus pertanyaan ini`
    );

    saveTaarufWithLog({ ...taarufData, qaCards: updatedCards }, log);
    showToast('Pertanyaan berhasil dihapus', 'info');
  };

  // Send Answer to Partner (marks as sent, triggers notification only on send)
  const handleSendAnswer = (card: QuestionItem, role: 'pria' | 'wanita') => {
    if (isReadOnly) return;
    const nowIso = new Date().toISOString();
    const sentField = role === 'pria' ? 'sentAtPria' : 'sentAtWanita';
    const answerField = role === 'pria' ? 'answerPria' : 'answerWanita';
    const currentAnswer = (card[answerField] || '').trim();

    if (!currentAnswer) {
      showToast('Tuliskan jawaban terlebih dahulu sebelum mengirim.', 'error');
      return;
    }

    const roleName = role === 'pria' ? (priaName || 'Calon Pria') : (wanitaName || 'Calon Perempuan');

    const log = createLogEntry(
      'send_answer',
      `Kirim Jawaban ${roleName}`,
      card.question,
      '(Jawaban dikirim)',
      currentAnswer,
      `${roleName} telah mengirim jawaban untuk pertanyaan: "${card.question.slice(0, 35)}..."`
    );

    const updatedCards = (taarufData?.qaCards || []).map((c: any) => {
      if (c.id === card.id) {
        return {
          ...c,
          [sentField]: nowIso,
          updatedAt: nowIso,
        };
      }
      return c;
    });

    saveTaarufWithLog({ ...taarufData, qaCards: updatedCards }, log);
    showToast('Jawaban berhasil dikirim ke calon pasangan!', 'success');
  };

  // Open Add Sub-Question Modal
  const handleOpenAddSubQuestion = (card: QuestionItem) => {
    setSubQuestionModal({ isOpen: true, targetCard: card });
    setSubQuestionAsker(userRole);
    setSubQuestionText('');
  };

  // Save New Sub-Question / Sanggahan
  const handleSaveSubQuestion = () => {
    if (isReadOnly || !subQuestionModal.targetCard || !subQuestionText.trim()) return;
    const targetCard = subQuestionModal.targetCard;
    const nowIso = new Date().toISOString();

    const newSub: SubQuestionItem = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: nowIso,
      asker: subQuestionAsker,
      question: subQuestionText.trim(),
      answerPria: '',
      answerWanita: '',
    };

    const askerText = subQuestionAsker === 'pria' ? `Calon Pria (${priaName})` : `Calon Perempuan (${wanitaName})`;
    const log = createLogEntry(
      'add_sub_question',
      'Tambah Sub-Pertanyaan / Sanggahan',
      targetCard.question,
      '(Sub-pertanyaan baru)',
      `Sanggahan: "${subQuestionText.trim()}" oleh ${askerText}`,
      `${currentActorName} menambahkan sanggahan / sub-pertanyaan pada "${targetCard.question.slice(0, 35)}..."`
    );

    const updatedCards = (taarufData?.qaCards || []).map((c: any) => {
      if (c.id === targetCard.id) {
        const existingSubs = c.subQuestions || [];
        return {
          ...c,
          subQuestions: [...existingSubs, newSub],
          updatedAt: nowIso,
        };
      }
      return c;
    });

    saveTaarufWithLog({ ...taarufData, qaCards: updatedCards }, log);
    setSubQuestionModal({ isOpen: false, targetCard: null });
    setSubQuestionText('');
    showToast('Sub-pertanyaan / sanggahan berhasil ditambahkan!', 'success');
  };

  // Delete Sub-Question
  const handleDeleteSubQuestion = (card: QuestionItem, subId: string) => {
    if (isReadOnly) return;
    if (!window.confirm('Hapus sub-pertanyaan / sanggahan ini?')) return;
    const nowIso = new Date().toISOString();

    const updatedCards = (taarufData?.qaCards || []).map((c: any) => {
      if (c.id === card.id) {
        const existingSubs = (c.subQuestions || []).filter((s: any) => s.id !== subId);
        return {
          ...c,
          subQuestions: existingSubs,
          updatedAt: nowIso,
        };
      }
      return c;
    });

    const log = createLogEntry(
      'delete_sub_question',
      'Hapus Sub-Pertanyaan / Sanggahan',
      card.question,
      'Sub-pertanyaan dihapus',
      '-',
      `${currentActorName} menghapus sub-pertanyaan pada "${card.question.slice(0, 35)}..."`
    );

    saveTaarufWithLog({ ...taarufData, qaCards: updatedCards }, log);
    showToast('Sub-pertanyaan berhasil dihapus', 'info');
  };

  // Update Sub-Answer (draft while typing)
  const handleUpdateSubAnswer = (cardId: string, subId: string, role: 'pria' | 'wanita', value: string) => {
    if (isReadOnly) return;
    const answerField = role === 'pria' ? 'answerPria' : 'answerWanita';

    const updatedCards = (taarufData?.qaCards || []).map((c: any) => {
      if (c.id === cardId) {
        const subs = (c.subQuestions || []).map((s: any) => {
          if (s.id === subId) {
            return { ...s, [answerField]: value };
          }
          return s;
        });
        return { ...c, subQuestions: subs };
      }
      return c;
    });

    setTaarufData({ ...taarufData, qaCards: updatedCards });
    previousQaCardsRef.current = updatedCards;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch('/api/m/taaruf', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...taarufData, qaCards: updatedCards, updatedAt: new Date().toISOString() }),
        });
        showSaveIndicator();
      } catch (err) {
        console.warn('Draft save error:', err);
      }
    }, 1200);
  };

  // Send Sub-Answer (marks as sent, triggers notification only on send)
  const handleSendSubAnswer = (cardId: string, subId: string, role: 'pria' | 'wanita') => {
    if (isReadOnly) return;
    const nowIso = new Date().toISOString();
    const sentField = role === 'pria' ? 'sentAtPria' : 'sentAtWanita';
    const roleName = role === 'pria' ? (priaName || 'Calon Pria') : (wanitaName || 'Calon Perempuan');

    let questionTitle = '';
    const updatedCards = (taarufData?.qaCards || []).map((c: any) => {
      if (c.id === cardId) {
        questionTitle = c.question || '';
        const subs = (c.subQuestions || []).map((s: any) => {
          if (s.id === subId) {
            return { ...s, [sentField]: nowIso };
          }
          return s;
        });
        return { ...c, subQuestions: subs, updatedAt: nowIso };
      }
      return c;
    });

    const log = createLogEntry(
      'send_sub_answer',
      `Kirim Tanggapan Sanggahan ${roleName}`,
      questionTitle,
      '(Tanggapan dikirim)',
      'Terkirim',
      `${roleName} telah mengirim tanggapan atas sanggahan pada: "${questionTitle.slice(0, 35)}..."`
    );

    saveTaarufWithLog({ ...taarufData, qaCards: updatedCards }, log);
    showToast('Tanggapan sanggahan berhasil dikirim!', 'success');
  };

  // Helper buka Modal Tambah Pertanyaan dengan Tanggal Sesi terisi
  const handleOpenAddModal = (targetAsker?: 'pria' | 'wanita', initialDate?: string) => {
    setFormAsker(targetAsker || (activeTab === 'wanita' ? 'wanita' : 'pria'));
    setFormSessionDate(initialDate || (selectedDateFilter !== 'all' ? selectedDateFilter : getTodayDateString()));
    setFormQuestion('');
    setFormAnswerSelf('');
    setFormPrinciple(false);
    setIsAddOpen(true);
  };

  // Add New Question with Log
  const handleSaveNewQuestion = () => {
    if (isReadOnly || !formQuestion.trim()) return;
    const now = new Date().toISOString();
    const targetSessionDate = formSessionDate || getTodayDateString();
    const newId = `qa_${formAsker}_${Date.now()}`;

    const newCard: any = {
      id: newId,
      createdAt: now,
      updatedAt: now,
      sessionDate: targetSessionDate,
      category: formCategory || 'Umum',
      asker: formAsker,
      question: formQuestion.trim(),
      custom: true,
      answerPria: formAsker === 'pria' ? formAnswerSelf.trim() : '',
      answerWanita: formAsker === 'wanita' ? formAnswerSelf.trim() : '',
      answerSelf: userRole === formAsker ? formAnswerSelf.trim() : '',
      answerPartner: '',
      note: '',
      principle: formPrinciple,
      status: 'belum',
    };

    const askerText = formAsker === 'pria' ? `Calon Pria (${priaName})` : `Calon Perempuan (${wanitaName})`;

    const log = createLogEntry(
      'add_question',
      'Tambah Pertanyaan Baru',
      formQuestion.trim(),
      '(Pertanyaan baru)',
      `Pertanyaan: "${formQuestion.trim()}" · Penanya: ${askerText} · Sesi: ${formatDateIndonesian(targetSessionDate)}${formPrinciple ? ' · (Bertanda Prinsip)' : ''}`,
      `${currentActorName} menambahkan pertanyaan baru pada sesi ${formatDateIndonesian(targetSessionDate)} (topik: ${formCategory})`
    );

    const existingCards = taarufData?.qaCards || [];
    saveTaarufWithLog({ ...taarufData, qaCards: [...existingCards, newCard] }, log);

    setFormQuestion('');
    setFormAnswerSelf('');
    setFormPrinciple(false);
    setIsAddOpen(false);
    showToast(`Pertanyaan untuk ${formAsker === 'pria' ? 'Calon Pria' : 'Calon Perempuan'} berhasil ditambahkan`, 'success');
  };

  // Add from Preset Ideas with Log
  const handleAddFromIdea = (card: typeof DEFAULT_QA_CARDS[0], targetAsker: 'pria' | 'wanita') => {
    if (isReadOnly) return;
    const now = new Date().toISOString();
    const targetSessionDate = selectedDateFilter !== 'all' ? selectedDateFilter : getTodayDateString();
    const newId = `qa_${targetAsker}_idea_${Date.now()}`;

    const newCard: any = {
      id: newId,
      createdAt: now,
      updatedAt: now,
      sessionDate: targetSessionDate,
      category: card.category,
      asker: targetAsker,
      question: card.question,
      custom: true,
      answerPria: '',
      answerWanita: '',
      answerSelf: '',
      answerPartner: '',
      note: '',
      principle: Boolean(card.principle),
      status: 'belum',
    };

    const askerText = targetAsker === 'pria' ? `Calon Pria (${priaName})` : `Calon Perempuan (${wanitaName})`;

    const log = createLogEntry(
      'add_question',
      'Tambah Pertanyaan dari Ide Topik',
      card.question,
      '(Pertanyaan baru)',
      `Pertanyaan: "${card.question}" · Penanya: ${askerText} · Sesi: ${formatDateIndonesian(targetSessionDate)}`,
      `${currentActorName} menambahkan pertanyaan dari ide topik ${card.category} ke sesi ${formatDateIndonesian(targetSessionDate)}`
    );

    const existingCards = taarufData?.qaCards || [];
    saveTaarufWithLog({ ...taarufData, qaCards: [...existingCards, newCard] }, log);
    showToast(`Pertanyaan ditambahkan ke kolom ${targetAsker === 'pria' ? 'Calon Pria' : 'Calon Perempuan'} (Sesi ${formatShortDateIndonesian(targetSessionDate)})`, 'success');
  };

  const renderQuestionCard = (q: QuestionItem) => {
    return (
      <div
        key={q.id}
        className={`bg-white border rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xs transition-all space-y-3 sm:space-y-3.5 ${
          q.status === 'sepakat'
            ? 'border-emerald-200/90 ring-1 ring-emerald-100/70 shadow-emerald-50/50'
            : q.status === 'dibahas'
            ? 'border-sky-200/90 ring-1 ring-rose-100/70 shadow-rose-50/50'
            : q.status === 'pertimbangan'
            ? 'border-purple-200/90 ring-1 ring-purple-100/70 shadow-purple-50/50'
            : q.status === 'ulang'
            ? 'border-amber-200/90 ring-1 ring-amber-100/70 shadow-amber-50/50'
            : 'border-slate-200/90'
        }`}
      >
        {/* Header Pertanyaan */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            {/* Penanya Badge */}
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                q.asker === 'pria'
                  ? 'bg-blue-50/80 border-blue-200/80 text-blue-700'
                  : 'bg-sky-50 border-sky-200 text-azure-700'
              }`}
            >
              <span>{q.asker === 'pria' ? '👨' : '👩'}</span>
              <span className="truncate max-w-[130px] sm:max-w-none">
                {q.asker === 'pria' ? (priaName || 'Calon Pria') : (wanitaName || 'Calon Perempuan')}
              </span>
            </span>

            {/* Tanggal Sesi Badge */}
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-azure-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full shrink-0">
              <Calendar className="w-2.5 h-2.5" />
              {formatShortDateIndonesian(q.sessionDate || getTodayDateString())}
            </span>

            {/* Category Badge */}
            {q.category && (
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded-full border border-slate-200/60 hidden xs:inline-block">
                {q.category}
              </span>
            )}

            {/* Principle Badge */}
            {q.principle && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-azure-700 bg-sky-100/80 px-2 py-0.5 rounded-full border border-sky-200">
                <Shield className="w-2.5 h-2.5" /> Prinsip
              </span>
            )}
          </div>

          {/* Actions & Status */}
          <div className="flex items-center gap-1 shrink-0">
            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                q.status === 'sepakat'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : q.status === 'dibahas'
                  ? 'bg-sky-50 text-azure-700 border-sky-300'
                  : q.status === 'pertimbangan'
                  ? 'bg-purple-50 text-purple-700 border-purple-300'
                  : q.status === 'ulang'
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-slate-50 text-slate-500 border-slate-200'
              }`}
            >
              {q.status === 'sepakat'
                ? 'Sepakat'
                : q.status === 'dibahas'
                ? 'Dibahas'
                : q.status === 'pertimbangan'
                ? 'Dipertimbangkan'
                : q.status === 'ulang'
                ? 'Bahas Ulang'
                : 'Belum'}
            </span>

            {!isReadOnly && (
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(q)}
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                  title="Edit teks pertanyaan & sesi"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteQuestion(q)}
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-azure-700 hover:bg-sky-50 transition-colors"
                  title="Hapus pertanyaan ini"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Colom Pertanyaan */}
        <div className="p-3 sm:p-3.5 bg-gradient-to-r from-slate-50 to-rose-50/30 rounded-2xl border border-slate-200/80">
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-start gap-2.5 min-w-0 flex-1">
              <span className="w-5 h-5 rounded-md bg-sky-500/10 text-azure-700 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                ?
              </span>
              <h4 className="text-[13px] sm:text-[14px] font-bold text-slate-900 leading-relaxed break-words">
                {q.question}
              </h4>
            </div>
            <button
              type="button"
              onClick={() =>
                setViewFullModal({
                  isOpen: true,
                  title: 'Pertanyaan Lengkap',
                  subtitle: `${q.category ? q.category + ' · ' : ''}Sesi ${formatDateIndonesian(q.sessionDate || getTodayDateString())}`,
                  content: q.question,
                  badgeText: q.category || 'Pertanyaan',
                  badgeColor: 'sky',
                })
              }
              className="p-1.5 text-slate-400 hover:text-azure-700 hover:bg-sky-50 rounded-lg transition-colors shrink-0"
              title="Lihat pertanyaan full"
              aria-label="Lihat pertanyaan full"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* DUA KOLOM JAWABAN (RESPONSIF: 1 KOLOM DI MOBILE, 2 KOLOM DI TABLET/DESKTOP) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {/* Kolom Jawaban Calon Pria */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-2.5 sm:p-3 space-y-1.5 focus-within:border-blue-400 focus-within:bg-blue-50/20 transition-all">
            <div className="flex items-center justify-between gap-1">
              <label className="text-[11px] font-black text-slate-700 flex items-center gap-1.5 min-w-0">
                <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] shrink-0">
                  👨
                </span>
                <span className="truncate">Jawaban {priaName ? priaName : 'Calon Pria'}</span>
              </label>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setViewFullModal({
                      isOpen: true,
                      title: `Jawaban ${priaName ? priaName : 'Calon Pria'}`,
                      subtitle: q.question,
                      content: q.answerPria || '',
                      badgeText: priaName ? priaName : 'Calon Pria',
                      badgeColor: 'blue',
                    })
                  }
                  className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-100/70 rounded-md transition-colors"
                  title="Lihat jawaban full"
                  aria-label="Lihat jawaban full"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                {!canEditAnswers && (
                  <span className="text-[9px] text-amber-700 bg-amber-100/90 px-1.5 py-0.2 rounded-md flex items-center gap-0.5 font-bold">
                    <Lock size={9} /> Terkunci
                  </span>
                )}
                {userRole === 'pria' && (
                  <span className="text-[9px] font-bold text-blue-700 bg-blue-100/90 px-1.5 py-0.2 rounded-md">
                    Anda
                  </span>
                )}
              </div>
            </div>
            <textarea
              rows={3}
              disabled={!canEditAnswers}
              value={q.answerPria || ''}
              onFocus={() => {
                focusedFieldRef.current = {
                  cardId: q.id,
                  field: 'answerPria',
                  initialValue: q.answerPria || '',
                };
              }}
              onBlur={(e) => handleFieldBlur(q, 'answerPria', e.target.value)}
              onChange={(e) => updateQuestion(q.id, { answerPria: e.target.value })}
              placeholder={
                canEditAnswers
                  ? `Tulis jawaban dari ${priaName ? priaName : 'calon pria'}...`
                  : 'Pengisian jawaban terkunci...'
              }
              className={`w-full px-3 py-2 text-[12px] sm:text-[13px] bg-white border border-slate-200/90 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all leading-relaxed placeholder:text-slate-400 resize-none ${
                !canEditAnswers ? 'opacity-70 bg-slate-100/60 cursor-not-allowed' : ''
              }`}
            />
            {userRole === 'pria' && canEditAnswers && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-400">
                  {q.sentAtPria ? (
                    <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                      <Check className="w-2.5 h-2.5" /> Terkirim ke calon
                    </span>
                  ) : (
                    <span className="italic text-slate-400">Draf (belum dikirim)</span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => handleSendAnswer(q, 'pria')}
                  disabled={!q.answerPria?.trim()}
                  className="flex items-center gap-1 px-3 py-1 bg-azure hover:bg-azure-700 disabled:opacity-40 text-white rounded-lg text-[11px] font-bold shadow-2xs transition-all active:scale-95"
                >
                  <Send className="w-3 h-3" />
                  <span>Kirim Jawaban</span>
                </button>
              </div>
            )}
          </div>

          {/* Kolom Jawaban Calon Perempuan */}
          <div className="bg-sky-50/40 border border-sky-200/70 rounded-2xl p-2.5 sm:p-3 space-y-1.5 focus-within:border-rose-400 focus-within:bg-sky-50/60 transition-all">
            <div className="flex items-center justify-between gap-1">
              <label className="text-[11px] font-black text-rose-950 flex items-center gap-1.5 min-w-0">
                <span className="w-4 h-4 rounded-full bg-sky-100 text-azure-700 flex items-center justify-center text-[10px] shrink-0">
                  👩
                </span>
                <span className="truncate">Jawaban {wanitaName ? wanitaName : 'Calon Perempuan'}</span>
              </label>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setViewFullModal({
                      isOpen: true,
                      title: `Jawaban ${wanitaName ? wanitaName : 'Calon Perempuan'}`,
                      subtitle: q.question,
                      content: q.answerWanita || '',
                      badgeText: wanitaName ? wanitaName : 'Calon Perempuan',
                      badgeColor: 'sky',
                    })
                  }
                  className="p-1 text-slate-400 hover:text-azure-700 hover:bg-sky-100/70 rounded-md transition-colors"
                  title="Lihat jawaban full"
                  aria-label="Lihat jawaban full"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                {!canEditAnswers && (
                  <span className="text-[9px] text-amber-700 bg-amber-100/90 px-1.5 py-0.2 rounded-md flex items-center gap-0.5 font-bold">
                    <Lock size={9} /> Terkunci
                  </span>
                )}
                {userRole === 'wanita' && (
                  <span className="text-[9px] font-bold text-azure-700 bg-sky-100/90 px-1.5 py-0.2 rounded-md">
                    Anda
                  </span>
                )}
              </div>
            </div>
            <textarea
              rows={3}
              disabled={!canEditAnswers}
              value={q.answerWanita || ''}
              onFocus={() => {
                focusedFieldRef.current = {
                  cardId: q.id,
                  field: 'answerWanita',
                  initialValue: q.answerWanita || '',
                };
              }}
              onBlur={(e) => handleFieldBlur(q, 'answerWanita', e.target.value)}
              onChange={(e) => updateQuestion(q.id, { answerWanita: e.target.value })}
              placeholder={
                canEditAnswers
                  ? `Tulis jawaban dari ${wanitaName ? wanitaName : 'calon perempuan'}...`
                  : 'Pengisian jawaban terkunci...'
              }
              className={`w-full px-3 py-2 text-[12px] sm:text-[13px] bg-white border border-sky-200/90 rounded-xl focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-100 transition-all leading-relaxed placeholder:text-slate-400 resize-none ${
                !canEditAnswers ? 'opacity-70 bg-slate-100/60 cursor-not-allowed' : ''
              }`}
            />
            {userRole === 'wanita' && canEditAnswers && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-400">
                  {q.sentAtWanita ? (
                    <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                      <Check className="w-2.5 h-2.5" /> Terkirim ke calon
                    </span>
                  ) : (
                    <span className="italic text-slate-400">Draf (belum dikirim)</span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => handleSendAnswer(q, 'wanita')}
                  disabled={!q.answerWanita?.trim()}
                  className="flex items-center gap-1 px-3 py-1 bg-azure hover:bg-azure-700 disabled:opacity-40 text-white rounded-lg text-[11px] font-bold shadow-2xs transition-all active:scale-95"
                >
                  <Send className="w-3 h-3" />
                  <span>Kirim Jawaban</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* SUB-PERTANYAAN & SANGGAHAN (DISKUSI LANJUTAN) */}
        <div className="p-3 bg-gradient-to-r from-slate-50 via-sky-50/20 to-slate-50 rounded-2xl border border-slate-200/90 space-y-2.5">
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-5 h-5 rounded-md bg-sky-100 text-azure-700 flex items-center justify-center text-xs shrink-0 font-bold">
                <MessageSquareReply className="w-3 h-3" />
              </span>
              <span className="text-xs font-black text-slate-800 truncate">
                Sub-Pertanyaan & Sanggahan
              </span>
              {q.subQuestions && q.subQuestions.length > 0 && (
                <span className="text-[10px] font-bold bg-sky-100 text-azure-700 px-1.5 py-0.2 rounded-full">
                  {q.subQuestions.length}
                </span>
              )}
            </div>

            {!isReadOnly && (
              <button
                type="button"
                onClick={() => handleOpenAddSubQuestion(q)}
                className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-sky-50 border border-sky-200 text-azure-700 rounded-lg text-[11px] font-bold transition-all shadow-2xs shrink-0 active:scale-95"
              >
                <Plus className="w-3 h-3" />
                <span>+ Sanggahan / Sub-Tanya</span>
              </button>
            )}
          </div>

          {/* List of Sub-Questions */}
          {q.subQuestions && q.subQuestions.length > 0 ? (
            <div className="space-y-2.5 pt-0.5">
              {q.subQuestions.map((sub, sIdx) => {
                const isSubPria = sub.asker === 'pria';
                const subAskerName = isSubPria ? (priaName || 'Calon Pria') : (wanitaName || 'Calon Perempuan');

                return (
                  <div
                    key={sub.id || sIdx}
                    className="p-2.5 sm:p-3 bg-white border border-slate-200 rounded-xl space-y-2 shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${
                          isSubPria
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-sky-50 text-azure-700 border-sky-200'
                        }`}>
                          {isSubPria ? '👨 ' : '👩 '} {subAskerName}
                        </span>
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.2 rounded-full">
                          Sanggahan #{sIdx + 1}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setViewFullModal({
                              isOpen: true,
                              title: `Sanggahan #${sIdx + 1} (${subAskerName})`,
                              subtitle: q.question,
                              content: sub.question,
                              badgeText: isSubPria ? 'Calon Pria' : 'Calon Perempuan',
                              badgeColor: isSubPria ? 'blue' : 'sky',
                            })
                          }
                          className="p-1 text-slate-400 hover:text-navy-900 hover:bg-slate-100 rounded-md transition-colors"
                          title="Lihat teks sanggahan full"
                          aria-label="Lihat teks sanggahan full"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => handleDeleteSubQuestion(q, sub.id)}
                            className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            title="Hapus sanggahan ini"
                            aria-label="Hapus sanggahan ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Teks Sub-Pertanyaan / Sanggahan */}
                    <div className="p-2 bg-slate-50/80 rounded-lg border border-slate-200/70 text-xs text-slate-800 font-bold leading-relaxed break-words">
                      “{sub.question}”
                    </div>

                    {/* Dua Kolom Tanggapan Kecil */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                      {/* Tanggapan Pria */}
                      <div className="p-2 bg-slate-50/60 border border-slate-200 rounded-lg space-y-1">
                        <div className="flex items-center justify-between gap-1 text-[10px] font-bold text-slate-600">
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="truncate">👨 Jawaban {priaName ? priaName : 'Pria'}</span>
                            {userRole === 'pria' && <span className="text-blue-600 font-extrabold text-[9px] bg-blue-50 px-1 rounded">Anda</span>}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setViewFullModal({
                                isOpen: true,
                                title: `Jawaban Sanggahan: ${priaName || 'Calon Pria'}`,
                                subtitle: `Sanggahan #${sIdx + 1}: "${sub.question}"`,
                                content: sub.answerPria || '',
                                badgeText: priaName || 'Calon Pria',
                                badgeColor: 'blue',
                              })
                            }
                            className="p-0.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100/70 rounded transition-colors shrink-0"
                            title="Lihat tanggapan full"
                            aria-label="Lihat tanggapan full"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          disabled={userRole !== 'pria' || !canEditAnswers}
                          value={sub.answerPria || ''}
                          onChange={(e) => handleUpdateSubAnswer(q.id, sub.id, 'pria', e.target.value)}
                          placeholder={userRole === 'pria' ? 'Tulis tanggapan...' : 'Menunggu tanggapan...'}
                          className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 resize-none leading-relaxed"
                        />
                        {userRole === 'pria' && canEditAnswers && (
                          <div className="flex items-center justify-between pt-0.5">
                            <span className="text-[9px] text-slate-400">
                              {sub.sentAtPria ? (
                                <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                                  <Check className="w-2.5 h-2.5" /> Terkirim
                                </span>
                              ) : (
                                <span>Draf</span>
                              )}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleSendSubAnswer(q.id, sub.id, 'pria')}
                              disabled={!sub.answerPria?.trim()}
                              className="px-2.5 py-0.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded text-[10px] font-bold flex items-center gap-1 transition-all"
                            >
                              <Send className="w-2.5 h-2.5" /> Kirim
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Tanggapan Wanita */}
                      <div className="p-2 bg-sky-50/30 border border-sky-200/70 rounded-lg space-y-1">
                        <div className="flex items-center justify-between gap-1 text-[10px] font-bold text-rose-900">
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="truncate">👩 Jawaban {wanitaName ? wanitaName : 'Perempuan'}</span>
                            {userRole === 'wanita' && <span className="text-azure-600 font-extrabold text-[9px] bg-sky-50 px-1 rounded">Anda</span>}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setViewFullModal({
                                isOpen: true,
                                title: `Jawaban Sanggahan: ${wanitaName || 'Calon Perempuan'}`,
                                subtitle: `Sanggahan #${sIdx + 1}: "${sub.question}"`,
                                content: sub.answerWanita || '',
                                badgeText: wanitaName || 'Calon Perempuan',
                                badgeColor: 'sky',
                              })
                            }
                            className="p-0.5 text-slate-400 hover:text-azure-700 hover:bg-sky-100/70 rounded transition-colors shrink-0"
                            title="Lihat tanggapan full"
                            aria-label="Lihat tanggapan full"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          disabled={userRole !== 'wanita' || !canEditAnswers}
                          value={sub.answerWanita || ''}
                          onChange={(e) => handleUpdateSubAnswer(q.id, sub.id, 'wanita', e.target.value)}
                          placeholder={userRole === 'wanita' ? 'Tulis tanggapan...' : 'Menunggu tanggapan...'}
                          className="w-full text-xs p-1.5 bg-white border border-sky-200 rounded-lg focus:outline-none focus:border-rose-400 resize-none leading-relaxed"
                        />
                        {userRole === 'wanita' && canEditAnswers && (
                          <div className="flex items-center justify-between pt-0.5">
                            <span className="text-[9px] text-slate-400">
                              {sub.sentAtWanita ? (
                                <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                                  <Check className="w-2.5 h-2.5" /> Terkirim
                                </span>
                              ) : (
                                <span>Draf</span>
                              )}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleSendSubAnswer(q.id, sub.id, 'wanita')}
                              disabled={!sub.answerWanita?.trim()}
                              className="px-2.5 py-0.5 bg-azure hover:bg-azure-700 disabled:opacity-40 text-white rounded text-[10px] font-bold flex items-center gap-1 transition-all"
                            >
                              <Send className="w-2.5 h-2.5" /> Kirim
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 italic">
              Belum ada sub-pertanyaan atau sanggahan lanjutan pada topik ini.
            </p>
          )}
        </div>

        {/* Colom Kesimpulan / Catatan Kesepakatan Bersama */}
        <div className="bg-amber-50/40 border border-amber-200/80 rounded-2xl p-2.5 sm:p-3 space-y-1.5 focus-within:border-amber-400 focus-within:bg-amber-50/70 transition-all">
          <div className="flex items-center justify-between gap-1">
            <label className="text-[11px] font-black text-amber-900 flex items-center gap-1.5 min-w-0">
              <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[10px] shrink-0">
                📝
              </span>
              <span className="truncate">Kesimpulan / Catatan Bersama</span>
            </label>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() =>
                  setViewFullModal({
                    isOpen: true,
                    title: 'Kesimpulan / Catatan Bersama',
                    subtitle: q.question,
                    content: q.note || '',
                    badgeText: 'Kesepakatan',
                    badgeColor: 'amber',
                  })
                }
                className="p-1 text-amber-700 hover:text-amber-900 hover:bg-amber-100/80 rounded-md transition-colors"
                title="Lihat catatan full"
                aria-label="Lihat catatan full"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <span className="text-[9px] text-amber-700/80 font-medium hidden xs:inline">
                Diteruskan ke Tahap 3
              </span>
            </div>
          </div>
          <textarea
            rows={2}
            disabled={isReadOnly}
            value={q.note || ''}
            onFocus={() => {
              focusedFieldRef.current = {
                cardId: q.id,
                field: 'note',
                initialValue: q.note || '',
              };
            }}
            onBlur={(e) => handleFieldBlur(q, 'note', e.target.value)}
            onChange={(e) => updateQuestion(q.id, { note: e.target.value })}
            placeholder="Tuliskan poin yang telah Anda berdua sepakati terkait hal ini..."
            className="w-full px-3 py-2 text-[12px] sm:text-[13px] bg-white border border-amber-200/90 rounded-xl focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-100 transition-all leading-relaxed placeholder:text-slate-400 resize-none"
          />
        </div>

        {/* Baris Status & Prinsip Dealbreaker */}
        <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 border-t border-slate-100">
          <label className="flex items-center gap-2 cursor-pointer text-[11px] sm:text-xs font-bold text-slate-700 select-none">
            <input
              type="checkbox"
              disabled={isReadOnly}
              checked={Boolean(q.principle)}
              onChange={(e) => handlePrincipleToggle(q, e.target.checked)}
              className="w-3.5 h-3.5 rounded border-sky-300 text-azure-700 accent-rose-500"
            />
            <span>Tandai sebagai Prinsip (Dealbreaker)</span>
          </label>

          <div className="flex flex-wrap gap-1 sm:gap-1.5 w-full sm:w-auto">
            {(['belum', 'dibahas', 'pertimbangan', 'sepakat', 'ulang'] as const).map((st) => (
              <button
                key={st}
                type="button"
                disabled={isReadOnly}
                onClick={() => handleStatusChange(q, st)}
                className={`flex-1 sm:flex-none px-2 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all text-center whitespace-nowrap ${
                  q.status === st
                    ? st === 'sepakat'
                      ? 'bg-emerald-600 text-white shadow-xs font-black'
                      : st === 'dibahas'
                      ? 'bg-sky-500 text-white shadow-xs font-black'
                      : st === 'pertimbangan'
                      ? 'bg-purple-600 text-white shadow-xs font-black'
                      : st === 'ulang'
                      ? 'bg-amber-500 text-white shadow-xs font-black'
                      : 'bg-slate-700 text-white shadow-xs font-black'
                    : 'bg-slate-50/80 text-slate-600 border border-slate-200/90 hover:bg-slate-100'
                }`}
              >
                {st === 'belum'
                  ? 'Belum'
                  : st === 'dibahas'
                  ? 'Dibahas'
                  : st === 'pertimbangan'
                  ? 'Dipertimbangkan'
                  : st === 'sepakat'
                  ? 'Sepakat'
                  : 'Bahas Ulang'}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-azure-600" />
        <p className="text-xs font-bold text-slate-600">Memuat Tanya Jawab Pranikah...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress & Summary Bar */}
      <div className="bg-white border border-line rounded-3xl p-5 shadow-subtle space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-azure-600 block mb-0.5">
              Progres Tanya Jawab Pranikah
            </span>
            <h3 className="text-lg font-black text-slate-900">
              {totalCount === 0 ? 'Belum Ada Pertanyaan' : `${agreedCount} dari ${totalCount} Sepakat (${progressPercent}%)`}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Button Log Khusus Pemilik */}
            {isOwner && (
              <button
                type="button"
                onClick={() => setIsLogOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-bold transition-all shadow-xs"
                title="Lihat riwayat aktivitas edit, add, delete"
              >
                <History className="w-3.5 h-3.5 text-sky-300" />
                <span className="hidden sm:inline">Log</span>
                {activityLogs.length > 0 && (
                  <span className="text-[10px] bg-sky-500 text-white px-1.5 py-0.2 rounded-full font-black">
                    {activityLogs.length}
                  </span>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsSummaryOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-full text-xs font-bold text-azure-700 transition-all shadow-xs"
            >
              <FileText className="w-3.5 h-3.5" /> Ringkasan
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-sky-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-line">
          <div
            className="h-full bg-azure rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Stats Pills */}
        <div className="grid grid-cols-5 gap-1.5 pt-0.5 text-center">
          <div className="p-1.5 sm:p-2 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl">
            <span className="text-xs font-black text-emerald-800 block">{agreedCount}</span>
            <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 truncate block">Sepakat</span>
          </div>
          <div className="p-1.5 sm:p-2 bg-sky-50 border border-sky-200 rounded-2xl">
            <span className="text-xs font-black text-azure-700 block">{discussedCount}</span>
            <span className="text-[9px] sm:text-[10px] font-bold text-azure-600 truncate block">Dibahas</span>
          </div>
          <div className="p-1.5 sm:p-2 bg-purple-50/80 border border-purple-200/80 rounded-2xl">
            <span className="text-xs font-black text-purple-800 block">{considerationCount}</span>
            <span className="text-[9px] sm:text-[10px] font-bold text-purple-600 truncate block" title="Dipertimbangkan">Dipertimbangkan</span>
          </div>
          <div className="p-1.5 sm:p-2 bg-amber-50/80 border border-amber-200/80 rounded-2xl">
            <span className="text-xs font-black text-amber-800 block">{rediscussCount}</span>
            <span className="text-[9px] sm:text-[10px] font-bold text-amber-600 truncate block">Bahas Ulang</span>
          </div>
          <div className="p-1.5 sm:p-2 bg-slate-50 border border-slate-200 rounded-2xl">
            <span className="text-xs font-black text-slate-700 block">{unhandledCount}</span>
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 truncate block">Belum</span>
          </div>
        </div>

        {principleQuestions.length > 0 && principleAgreedCount < principleQuestions.length && (
          <div className="flex items-center gap-2 px-3 py-2 bg-sky-50 rounded-2xl border border-sky-200 text-xs text-navy-900 font-bold">
            <Shield className="w-4 h-4 shrink-0 text-azure-700" />
            <span>
              {principleQuestions.length - principleAgreedCount} pertanyaan berlabel <strong>Prinsip (Dealbreaker)</strong> belum berstatus Sepakat.
            </span>
          </div>
        )}
      </div>

      {/* Kontrol Hak Akses Pengisian Jawaban Pasangan */}
      {isOwner ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 border ${
                allowPartnerAnswers
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-amber-50 border-amber-200 text-amber-700'
              }`}
            >
              {allowPartnerAnswers ? <Unlock size={18} /> : <Lock size={18} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900">
                  Izin Pengisian Jawaban Pasangan
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    allowPartnerAnswers
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {allowPartnerAnswers ? 'Diizinkan' : 'Terkunci'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {allowPartnerAnswers
                  ? 'Pasangan dapat mengisi dan mengedit jawaban di kolom jawabannya.'
                  : 'Jawaban dikunci. Pasangan hanya dapat membaca dan belum dapat mengedit.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTogglePartnerPermission}
            className={`px-3.5 py-2 rounded-xl text-xs font-black border transition-all shrink-0 w-full sm:w-auto shadow-xs ${
              allowPartnerAnswers
                ? 'bg-sky-50 border-sky-300 text-azure-700 hover:bg-sky-100'
                : 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {allowPartnerAnswers ? 'Kunci Jawaban Pasangan' : 'Beri Izin Pasangan Mengisi'}
          </button>
        </div>
      ) : (
        /* Status Banner untuk Pasangan (Undangan) */
        <div
          className={`p-3.5 rounded-2xl border text-xs font-medium flex items-center gap-2.5 ${
            allowPartnerAnswers
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              : 'bg-amber-50/80 border-amber-200 text-amber-900'
          }`}
        >
          {allowPartnerAnswers ? (
            <>
              <Unlock className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>
                Anda telah <strong>diizinkan oleh pemilik</strong> untuk mengisi dan mengedit kolom jawaban Anda.
              </span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                <strong>Mode Baca:</strong> Pengisian jawaban saat ini dikunci oleh pemilik. Hubungi pemilik untuk membuka izin pengisian jawaban.
              </span>
            </>
          )}
        </div>
      )}

      {/* Banner Notifikasi Pop-up HP */}
      {notificationPermission !== 'unsupported' && (
        <div className="animate-fade-in">
          {notificationPermission === 'default' && (
            <div className="p-3.5 bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50/50 border border-sky-200 rounded-2xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-azure text-white flex items-center justify-center shrink-0 shadow-xs">
                  <BellRing className="w-4 h-4 animate-bounce" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">
                    Aktifkan Notifikasi Pop-Up Layar HP
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    Dapatkan pemberitahuan di layar HP saat calon pasangan mengirim pertanyaan atau jawaban baru.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleEnableNotification}
                className="w-full sm:w-auto px-4 py-2 bg-azure hover:bg-azure-700 text-white rounded-xl text-xs font-black shadow-subtle shrink-0 active:scale-95 transition-all text-center"
              >
                Aktifkan Notifikasi
              </button>
            </div>
          )}

          {notificationPermission === 'granted' && (
            <div className="px-3.5 py-2 bg-emerald-50/80 border border-emerald-200/90 rounded-2xl flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-900 font-bold min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                <span className="truncate">Notifikasi Pop-Up Layar HP: <strong>Aktif</strong></span>
              </div>
              <button
                type="button"
                onClick={handleTestNotification}
                className="px-2.5 py-1 bg-white hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-lg text-[11px] font-black shrink-0 transition-colors shadow-2xs"
                title="Kirim notifikasi uji coba sekarang ke layar HP Anda"
              >
                Uji Coba Notifikasi
              </button>
            </div>
          )}

          {notificationPermission === 'denied' && (
            <div className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-2 text-[11px] text-slate-600">
              <div className="flex items-center gap-1.5 min-w-0">
                <BellOff className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">Izin notifikasi diblokir di browser HP Anda.</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium shrink-0">Buka izin di info situs</span>
            </div>
          )}
        </div>
      )}

      {/* Main Tab Switcher: Pria vs Wanita vs Semua */}
      <div className="bg-white border border-line rounded-2xl p-2 shadow-xs space-y-2">
        <div className="grid grid-cols-3 gap-1 bg-slate-100/90 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('pria')}
            className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1 sm:px-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
              activeTab === 'pria'
                ? 'bg-white text-blue-700 shadow-xs border border-blue-100 font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="shrink-0">👨</span>
            <span className="truncate">Calon Pria</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full shrink-0 ${activeTab === 'pria' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>
              {priaQuestions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('wanita')}
            className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1 sm:px-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
              activeTab === 'wanita'
                ? 'bg-white text-azure-700 shadow-xs border border-line font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="shrink-0">👩</span>
            <span className="truncate">Calon Wanita</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full shrink-0 ${activeTab === 'wanita' ? 'bg-sky-100 text-azure-700' : 'bg-slate-200 text-slate-600'}`}>
              {wanitaQuestions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1 sm:px-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="shrink-0">📋</span>
            <span>Semua</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full shrink-0 ${activeTab === 'all' ? 'bg-slate-200 text-slate-800' : 'bg-slate-200 text-slate-600'}`}>
              {totalCount}
            </span>
          </button>
        </div>

        {/* Action & Filter Bar */}
        <div className="flex items-center justify-between gap-2 pt-1">
          {/* Quick Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setStatusFilter((prev) => (prev === 'all' ? 'unagreed' : 'all'))}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border shrink-0 transition-all ${
                statusFilter === 'unagreed'
                  ? 'bg-sky-50 border-sky-300 text-azure-700 font-black'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              Belum Sepakat ({questions.filter((q) => q.status !== 'sepakat').length})
            </button>

            {principleQuestions.length > 0 && (
              <button
                type="button"
                onClick={() => setStatusFilter((prev) => (prev === 'principle' ? 'all' : 'principle'))}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border shrink-0 transition-all ${
                  statusFilter === 'principle'
                    ? 'bg-sky-50 border-sky-300 text-azure-700 font-black'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <Shield className="w-3 h-3" /> Prinsip ({principleQuestions.length})
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsIdeaSheetOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-full text-xs font-bold transition-all shadow-xs"
              title="Lihat ide pertanyaan pranikah"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Ide Topik</span>
            </button>

            {!isReadOnly && (
              <button
                type="button"
                onClick={() => {
                  setFormAsker(activeTab === 'wanita' ? 'wanita' : 'pria');
                  setFormQuestion('');
                  setFormAnswerSelf('');
                  setFormPrinciple(false);
                  setIsAddOpen(true);
                }}
                className="flex items-center gap-1 px-3.5 py-1.5 bg-azure text-white rounded-full text-xs font-bold shadow-subtle active:scale-95 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sesi Diskusi Berdasarkan Tanggal (Filter Bar) */}
      <div className="bg-white border border-line rounded-2xl p-3 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-5 h-5 rounded-md bg-sky-100 text-azure-700 flex items-center justify-center text-xs shrink-0 font-bold">
              <Calendar className="w-3 h-3" />
            </span>
            <span className="text-xs font-black text-slate-800 truncate">
              Sesi Tanya Jawab per Tanggal
            </span>
            {selectedDateFilter !== 'all' && (
              <span className="text-[10px] font-bold text-azure-700 bg-sky-50 border border-sky-200 px-2 py-0.2 rounded-full hidden sm:inline-block">
                Sesi: {formatDateIndonesian(selectedDateFilter)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Sort Order Toggle */}
            <button
              type="button"
              onClick={() => setDateSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              title="Urutan tanggal"
            >
              <ArrowUpDown className="w-3 h-3 text-slate-500" />
              <span>{dateSortOrder === 'asc' ? 'Lama → Baru' : 'Baru → Lama'}</span>
            </button>

            {/* Custom Date Picker Pill */}
            <div className="relative">
              <button
                type="button"
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-azure-700 bg-sky-50 border border-sky-200 hover:bg-sky-100 transition-colors"
              >
                <Filter className="w-3 h-3" />
                <span>Pilih Tgl</span>
              </button>
              <input
                type="date"
                value={selectedDateFilter !== 'all' ? selectedDateFilter : getTodayDateString()}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedDateFilter(e.target.value);
                  }
                }}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                title="Pilih tanggal sesi spesifik"
              />
            </div>
          </div>
        </div>

        {/* Horizontal Scrollable Date Session Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5 pb-0.5">
          {/* Semua Sesi Pill */}
          <button
            type="button"
            onClick={() => setSelectedDateFilter('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
              selectedDateFilter === 'all'
                ? 'bg-navy-900 text-white shadow-xs font-black'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>Semua Sesi</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedDateFilter === 'all' ? 'bg-white/20 text-white font-bold' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {activeTab === 'pria' ? priaQuestions.length : activeTab === 'wanita' ? wanitaQuestions.length : totalCount}
            </span>
          </button>

          {/* Individual Date Session Pills */}
          {availableSessionDates.map((item) => {
            const isSelected = selectedDateFilter === item.date;
            const shortLabel = formatShortDateIndonesian(item.date);

            return (
              <button
                key={item.date}
                type="button"
                onClick={() => setSelectedDateFilter(item.date)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all border ${
                  isSelected
                    ? 'bg-azure border-azure-600 text-white shadow-xs font-black'
                    : item.count > 0
                    ? 'bg-white border-slate-200 text-slate-800 hover:border-sky-300'
                    : 'bg-slate-50/70 border-slate-200 text-slate-400 hover:text-slate-600'
                }`}
              >
                <span>{item.isToday ? `Hari Ini (${shortLabel})` : shortLabel}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected
                      ? 'bg-white/25 text-white'
                      : item.count > 0
                      ? 'bg-sky-100 text-azure-700'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {item.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Info Context Bar */}
      <div className="px-1 text-xs text-slate-500 flex items-center justify-between">
        <p>
          {activeTab === 'pria' && (
            <span>Menampilkan pertanyaan yang diajukan oleh <strong>👨 {priaName}</strong></span>
          )}
          {activeTab === 'wanita' && (
            <span>Menampilkan pertanyaan yang diajukan oleh <strong>👩 {wanitaName}</strong></span>
          )}
          {activeTab === 'all' && (
            <span>Menampilkan semua pertanyaan dari kedua calon pengantin</span>
          )}
        </p>
      </div>

      {/* List of Questions with Dedicated Columns (Mobile Responsive) */}
      {visibleQuestions.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-sky-200 rounded-3xl p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-sky-50 border border-line flex items-center justify-center mx-auto text-azure-600">
            <MessageSquare className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-black text-slate-800">
              {selectedDateFilter !== 'all'
                ? `Belum Ada Pertanyaan di Sesi ${formatDateIndonesian(selectedDateFilter)}`
                : `Belum Ada Pertanyaan ${activeTab === 'pria' ? 'dari Calon Pria' : activeTab === 'wanita' ? 'dari Calon Perempuan' : ''}`}
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              {selectedDateFilter !== 'all'
                ? 'Belum ada pertanyaan diskusi yang dicatat pada tanggal sesi ini. Klik tombol di bawah untuk menambah pertanyaan ke sesi ini.'
                : 'Tuliskan pertanyaan penting yang ingin Anda diskusikan bersama pasangan untuk menyatukan visi pranikah.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => handleOpenAddModal(activeTab === 'wanita' ? 'wanita' : 'pria', selectedDateFilter !== 'all' ? selectedDateFilter : undefined)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-azure text-white rounded-full text-xs font-bold shadow-subtle hover:scale-[1.02] active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" /> Tulis Pertanyaan {selectedDateFilter !== 'all' ? 'di Sesi Ini' : 'Baru'}
              </button>
            )}
            {selectedDateFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedDateFilter('all')}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-bold active:scale-95 transition-all"
              >
                Lihat Semua Sesi
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsIdeaSheetOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-sky-50 border border-sky-200 text-azure-700 rounded-full text-xs font-bold hover:bg-sky-100 active:scale-95 transition-all"
            >
              <Lightbulb className="w-4 h-4" /> Buka Ide Pertanyaan
            </button>
          </div>
        </div>
      ) : selectedDateFilter === 'all' ? (
        /* Render per session date group when viewing All */
        <div className="space-y-6">
          {groupedQuestionsByDate.map((group) => (
            <div key={group.date} className="space-y-3">
              {/* Session Group Header */}
              <div className="flex items-center justify-between px-1 pt-2 pb-1 border-b border-slate-200/80">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-azure shadow-xs" />
                  <h4 className="text-xs sm:text-sm font-black text-slate-800">
                    Sesi {formatDateIndonesian(group.date)}
                  </h4>
                  {group.date === getTodayDateString() && (
                    <span className="text-[10px] font-bold text-azure-700 bg-sky-100 border border-sky-200 px-2 py-0.2 rounded-full">
                      Hari Ini
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {group.items.length} Pertanyaan
                  </span>
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => handleOpenAddModal(activeTab === 'wanita' ? 'wanita' : 'pria', group.date)}
                      className="text-[11px] font-bold text-azure-700 hover:text-azure-900 flex items-center gap-0.5 px-2 py-0.5 hover:bg-sky-50 rounded-lg transition-colors"
                      title={`Tambah pertanyaan ke sesi ${formatShortDateIndonesian(group.date)}`}
                    >
                      <Plus className="w-3 h-3" /> Tambah
                    </button>
                  )}
                </div>
              </div>

              {/* Questions Cards in this Session Date */}
              <div className="space-y-3.5">
                {group.items.map((q) => renderQuestionCard(q))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Render questions for single selected session date */
        <div className="space-y-3.5">
          <div className="flex items-center justify-between px-3 py-2 bg-sky-50/70 border border-sky-200 rounded-2xl">
            <div className="flex items-center gap-2 min-w-0">
              <Calendar className="w-3.5 h-3.5 text-azure-600 shrink-0" />
              <span className="text-xs font-black text-slate-800 truncate">
                Sesi Diskusi: <strong>{formatDateIndonesian(selectedDateFilter)}</strong>
              </span>
              {selectedDateFilter === getTodayDateString() && (
                <span className="text-[10px] font-bold text-azure-700 bg-sky-100 px-1.5 py-0.2 rounded-full shrink-0">
                  Hari Ini
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSelectedDateFilter('all')}
              className="text-xs font-bold text-azure-700 hover:underline shrink-0 ml-2"
            >
              Lihat Semua Sesi
            </button>
          </div>

          <div className="space-y-3.5">
            {visibleQuestions.map((q) => renderQuestionCard(q))}
          </div>
        </div>
      )}

      {/* BOTTOM SHEET: EDIT PERTANYAAN */}
      <BottomSheet
        isOpen={Boolean(editingQuestion)}
        onClose={() => setEditingQuestion(null)}
        title="Edit Pertanyaan Pranikah"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Penanya</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setEditAskerValue('pria')}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-black transition-all ${
                  editAskerValue === 'pria'
                    ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <span>👨 Calon Pria</span>
              </button>
              <button
                type="button"
                onClick={() => setEditAskerValue('wanita')}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-black transition-all ${
                  editAskerValue === 'wanita'
                    ? 'bg-sky-50 border-rose-400 text-azure-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <span>👩 Calon Perempuan</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Sesi Diskusi</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={editSessionDateValue}
                onChange={(e) => setEditSessionDateValue(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-rose-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setEditSessionDateValue(getTodayDateString())}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold shrink-0 transition-colors"
              >
                Hari Ini
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Kategori / Topik</label>
            <select
              value={editCategoryValue}
              onChange={(e) => setEditCategoryValue(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-rose-400 focus:outline-none"
            >
              {QA_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Teks Pertanyaan <span className="text-azure-600">*</span>
            </label>
            <textarea
              rows={3}
              value={editTextValue}
              onChange={(e) => setEditTextValue(e.target.value)}
              placeholder="Tuliskan pertanyaan penting..."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-rose-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditingQuestion(null)}
              className="px-4 py-2.5 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveEditQuestion}
              disabled={!editTextValue.trim()}
              className="px-5 py-2.5 bg-azure text-white rounded-full text-xs font-bold shadow-subtle disabled:opacity-40"
            >
              Simpan Perubahan
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* BOTTOM SHEET: FORM TAMBAH PERTANYAAN */}
      <BottomSheet
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Tulis Pertanyaan Pranikah Baru"
      >
        <div className="space-y-4">
          {/* Penanya Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Pertanyaan dari Siapa?</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormAsker('pria')}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-black transition-all ${
                  formAsker === 'pria'
                    ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <span>👨</span>
                <span>Calon Pria ({priaName})</span>
              </button>

              <button
                type="button"
                onClick={() => setFormAsker('wanita')}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-black transition-all ${
                  formAsker === 'wanita'
                    ? 'bg-sky-50 border-rose-400 text-azure-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <span>👩</span>
                <span>Calon Perempuan ({wanitaName})</span>
              </button>
            </div>
          </div>

          {/* Tanggal Sesi Diskusi */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">Tanggal Sesi Diskusi</label>
              <span className="text-[10px] text-slate-400">Pilihan sesi harian (10, 11, dst)</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={formSessionDate}
                onChange={(e) => setFormSessionDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-rose-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setFormSessionDate(getTodayDateString())}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold shrink-0 transition-colors"
              >
                Hari Ini
              </button>
            </div>
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Kategori / Topik</label>
            <select
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-rose-400 focus:outline-none"
            >
              {QA_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Pertanyaan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Teks Pertanyaan <span className="text-azure-600">*</span>
            </label>
            <textarea
              rows={3}
              value={formQuestion}
              onChange={(e) => setFormQuestion(e.target.value)}
              placeholder="Tuliskan pertanyaan penting yang ingin diajukan kepada pasangan..."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-rose-400 focus:outline-none"
            />
          </div>

          {/* Jawaban Awal Penanya (Opsional) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Jawaban / Harapan Awal Penanya (Opsional)
            </label>
            <textarea
              rows={2}
              value={formAnswerSelf}
              onChange={(e) => setFormAnswerSelf(e.target.value)}
              placeholder="Bagikan pandangan atau ekspektasi Anda terlebih dahulu terkait pertanyaan ini..."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-rose-400 focus:outline-none"
            />
          </div>

          {/* Tandai sebagai Prinsip */}
          <label className="flex items-center gap-2 cursor-pointer p-3 bg-sky-50/70 rounded-2xl border border-sky-200">
            <input
              type="checkbox"
              checked={formPrinciple}
              onChange={(e) => setFormPrinciple(e.target.checked)}
              className="w-4 h-4 rounded border-sky-300 text-azure-700 accent-rose-500"
            />
            <span className="text-xs font-bold text-rose-900">
              Tandai sebagai <strong>Prinsip (Dealbreaker / Tidak dapat ditawar)</strong>
            </span>
          </label>

          <button
            type="button"
            onClick={handleSaveNewQuestion}
            disabled={!formQuestion.trim()}
            className="w-full py-3 bg-azure text-white rounded-full text-xs font-black shadow-subtle disabled:opacity-40 hover:opacity-90 active:scale-95 transition-all"
          >
            Simpan Pertanyaan
          </button>
        </div>
      </BottomSheet>

      {/* BOTTOM SHEET: IDE PERTANYAAN PRANIKAH */}
      <BottomSheet
        isOpen={isIdeaSheetOpen}
        onClose={() => setIsIdeaSheetOpen(false)}
        title="Ide Pertanyaan Pranikah"
      >
        <div className="space-y-4 max-h-[72vh] overflow-y-auto pr-1">
          <p className="text-xs text-slate-500 leading-relaxed">
            Pilih pertanyaan pranikah islami di bawah ini untuk langsung dimasukkan ke kolom Calon Pria atau Calon Perempuan.
          </p>

          {/* Sesi Tanggal Notice */}
          <div className="p-2.5 bg-sky-50 border border-sky-200 rounded-xl flex items-center justify-between text-xs text-azure-800">
            <span className="flex items-center gap-1.5 font-medium truncate">
              <Calendar className="w-3.5 h-3.5 text-azure-600 shrink-0" />
              <span>Dimasukkan ke sesi: <strong>{formatDateIndonesian(selectedDateFilter !== 'all' ? selectedDateFilter : getTodayDateString())}</strong></span>
            </span>
            {selectedDateFilter !== getTodayDateString() && (
              <button
                type="button"
                onClick={() => setSelectedDateFilter(getTodayDateString())}
                className="text-[11px] font-bold text-azure-700 underline shrink-0 ml-2"
              >
                Ganti ke Hari Ini
              </button>
            )}
          </div>

          {/* Search & Category Filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={ideaSearch}
                onChange={(e) => setIdeaSearch(e.target.value)}
                placeholder="Cari ide pertanyaan (misal: nafkah, mertua, anak)..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-rose-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              <button
                type="button"
                onClick={() => setIdeaCategory('Semua')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 transition-all ${
                  ideaCategory === 'Semua'
                    ? 'bg-sky-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua
              </button>
              {QA_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setIdeaCategory(cat)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 transition-all ${
                    ideaCategory === cat
                      ? 'bg-sky-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* List of Ideas */}
          <div className="space-y-2.5 pt-1">
            {DEFAULT_QA_CARDS.filter((item) => {
              if (ideaCategory !== 'Semua' && item.category !== ideaCategory) return false;
              if (ideaSearch.trim() && !item.question.toLowerCase().includes(ideaSearch.toLowerCase())) {
                return false;
              }
              return true;
            }).map((item) => {
              const alreadyAdded = questions.some((q) => q.question === item.question);

              return (
                <div
                  key={item.id}
                  className="p-3 bg-white border border-slate-200 rounded-2xl hover:border-sky-200 transition-all space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {item.category}
                    </span>
                    {item.principle && (
                      <span className="text-[10px] font-bold text-azure-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                        Prinsip
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-bold text-slate-800 leading-snug">{item.question}</p>

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                    {alreadyAdded ? (
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Sudah Ada di Daftar
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5 ml-auto">
                        <button
                          type="button"
                          onClick={() => handleAddFromIdea(item, 'pria')}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-lg text-[11px] font-bold transition-all"
                        >
                          + Calon Pria
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddFromIdea(item, 'wanita')}
                          className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-azure-700 rounded-lg text-[11px] font-bold transition-all"
                        >
                          + Calon Perempuan
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </BottomSheet>

      {/* BOTTOM SHEET: LOG AKTIVITAS (KHUSUS PEMILIK) */}
      <BottomSheet
        isOpen={isLogOpen}
        onClose={() => setIsLogOpen(false)}
        title="Log Aktivitas Tanya Jawab"
      >
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
            Catatan riwayat lengkap aktivitas yang dilakukan oleh <strong>Pemilik</strong> maupun <strong>Pasangan (Undangan)</strong>, termasuk penambahan, pengeditan teks dan jawaban dari apa menjadi apa, perubahan status, serta pengaturan izin.
          </div>

          {/* Search & Action Filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Cari log (nama pengguna, kata kunci, dll)..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-rose-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {[
                { id: 'all', label: 'Semua Aktivitas' },
                { id: 'edit_answer', label: 'Edit Jawaban' },
                { id: 'edit_question', label: 'Edit Pertanyaan' },
                { id: 'add_question', label: 'Pertanyaan Baru' },
                { id: 'change_status', label: 'Status' },
                { id: 'toggle_permission', label: 'Izin' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setLogFilterAction(f.id)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold shrink-0 transition-all ${
                    logFilterAction === f.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Log Timeline List */}
          {activityLogs.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-2">
              <History className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-500">Belum ada riwayat aktivitas tercatat.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activityLogs
                .filter((item) => {
                  if (logFilterAction === 'edit_answer' && !item.action.startsWith('edit_answer')) return false;
                  if (logFilterAction === 'edit_question' && item.action !== 'edit_question') return false;
                  if (logFilterAction === 'add_question' && item.action !== 'add_question') return false;
                  if (logFilterAction === 'change_status' && item.action !== 'change_status') return false;
                  if (logFilterAction === 'toggle_permission' && item.action !== 'toggle_permission') return false;
                  if (logSearch.trim()) {
                    const query = logSearch.toLowerCase();
                    const matchText = `${item.userName} ${item.title} ${item.questionText} ${item.oldValue} ${item.newValue} ${item.details || ''}`.toLowerCase();
                    if (!matchText.includes(query)) return false;
                  }
                  return true;
                })
                .map((log) => {
                  const dateStr = new Date(log.timestamp).toLocaleString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  const isOwnerLog = log.userRole.toLowerCase().includes('pemilik');

                  return (
                    <div
                      key={log.id}
                      className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2 hover:border-slate-300 transition-all"
                    >
                      {/* Top Bar of Log Card */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                              isOwnerLog
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-sky-100 text-azure-700'
                            }`}
                          >
                            {isOwnerLog ? '👨' : '👩'}
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black text-slate-800">{log.userName}</span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                                  isOwnerLog
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-sky-50 text-azure-700 border border-sky-200'
                                }`}
                              >
                                {log.userRole}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block">{dateStr}</span>
                          </div>
                        </div>

                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          {log.title}
                        </span>
                      </div>

                      {/* Pertanyaan yang Terkait */}
                      {log.questionText && log.questionText !== '-' && (
                        <div className="px-2.5 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700">
                          Pertanyaan: “{log.questionText}”
                        </div>
                      )}

                      {/* DIFF BOX: DARI APA MENJADI APA */}
                      {(log.oldValue || log.newValue) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          <div className="p-2.5 bg-sky-50/60 border border-sky-200 rounded-xl space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-wider text-azure-700 block">
                              Sebelumnya:
                            </span>
                            <p className="text-xs text-rose-950 font-medium break-words whitespace-pre-wrap">
                              {log.oldValue || '(Kosong / Belum ada isian)'}
                            </p>
                          </div>
                          <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
                              Menjadi:
                            </span>
                            <p className="text-xs text-emerald-950 font-medium break-words whitespace-pre-wrap">
                              {log.newValue || '(Kosong)'}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Details if any */}
                      {log.details && (
                        <p className="text-[11px] text-slate-500 italic pt-0.5">
                          {log.details}
                        </p>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </BottomSheet>

      {/* BOTTOM SHEET: RINGKASAN KESEPAKATAN */}
      <BottomSheet
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        title="Ringkasan Kesepakatan Ta’aruf"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <p className="text-xs text-slate-600 leading-relaxed">
            Ringkasan ini merangkum poin-poin yang sudah Anda berdua sepakati dan yang masih perlu dibahas. Ringkasan ini otomatis tersambung ke <strong>Tahap 3 (Kesepakatan Khitbah)</strong>.
          </p>

          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Poin Sepakat ({agreedCount})
            </h4>
            {agreedCount === 0 ? (
              <p className="text-xs text-slate-400 italic pl-5">Belum ada pertanyaan yang berstatus Sepakat.</p>
            ) : (
              <div className="space-y-2">
                {questions
                  .filter((q) => q.status === 'sepakat')
                  .map((q) => (
                    <div key={q.id} className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                          {q.asker === 'pria' ? '👨 Calon Pria' : '👩 Calon Perempuan'}
                        </span>
                        {q.principle && (
                          <span className="text-[10px] font-bold text-azure-700 bg-sky-100 px-1.5 py-0.5 rounded-md">
                            Prinsip
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-black text-slate-900">{q.question}</p>
                      {q.note && (
                        <p className="text-xs text-emerald-900 font-medium pl-2 border-l-2 border-emerald-500">
                          Kesepakatan: {q.note}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-purple-600" /> Sedang Dipertimbangkan ({considerationCount})
            </h4>
            {considerationCount === 0 ? (
              <p className="text-xs text-slate-400 italic pl-5">Tidak ada poin yang sedang dipertimbangkan.</p>
            ) : (
              <div className="space-y-2">
                {questions
                  .filter((q) => q.status === 'pertimbangan')
                  .map((q) => (
                    <div key={q.id} className="p-3 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                          {q.asker === 'pria' ? '👨 Calon Pria' : '👩 Calon Perempuan'}
                        </span>
                        {q.principle && (
                          <span className="text-[10px] font-bold text-azure-700 bg-sky-100 px-1.5 py-0.5 rounded-md">
                            Prinsip
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-black text-slate-900">{q.question}</p>
                      {q.note && (
                        <p className="text-xs text-purple-900 font-medium pl-2 border-l-2 border-purple-500">
                          Catatan: {q.note}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4 text-amber-600" /> Perlu Dibahas Lagi ({rediscussCount})
            </h4>
            {rediscussCount === 0 ? (
              <p className="text-xs text-slate-400 italic pl-5">Tidak ada poin yang perlu dibahas ulang.</p>
            ) : (
              <div className="space-y-2">
                {questions
                  .filter((q) => q.status === 'ulang')
                  .map((q) => (
                    <div key={q.id} className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                          {q.asker === 'pria' ? '👨 Calon Pria' : '👩 Calon Perempuan'}
                        </span>
                      </div>
                      <p className="text-xs font-black text-slate-900">{q.question}</p>
                      {q.note && (
                        <p className="text-xs text-amber-900 font-medium pl-2 border-l-2 border-amber-500">
                          Catatan: {q.note}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </BottomSheet>

      {/* BOTTOM SHEET: TAMBAH SUB-PERTANYAAN / SANGGAHAN */}
      <BottomSheet
        isOpen={subQuestionModal.isOpen}
        onClose={() => setSubQuestionModal({ isOpen: false, targetCard: null })}
        title="Tambah Sub-Pertanyaan / Sanggahan"
      >
        <div className="space-y-4">
          {subQuestionModal.targetCard && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                Menanggapi Pertanyaan:
              </span>
              <p className="text-xs font-bold text-slate-800 leading-snug">
                “{subQuestionModal.targetCard.question}”
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Diajukan Oleh</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSubQuestionAsker('pria')}
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-black transition-all ${
                  subQuestionAsker === 'pria'
                    ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <span>👨 Calon Pria ({priaName})</span>
              </button>
              <button
                type="button"
                onClick={() => setSubQuestionAsker('wanita')}
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-black transition-all ${
                  subQuestionAsker === 'wanita'
                    ? 'bg-sky-50 border-sky-300 text-azure-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <span>👩 Calon Perempuan ({wanitaName})</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Teks Sub-Pertanyaan / Sanggahan <span className="text-azure-600">*</span>
            </label>
            <textarea
              rows={3}
              value={subQuestionText}
              onChange={(e) => setSubQuestionText(e.target.value)}
              placeholder="Contoh: Namun jika setelah menikah ada tawaran tugas kerja di luar kota, bagaimana kesiapanmu?"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-rose-400 focus:outline-none leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setSubQuestionModal({ isOpen: false, targetCard: null })}
              className="px-4 py-2.5 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveSubQuestion}
              disabled={!subQuestionText.trim()}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-azure text-white rounded-full text-xs font-black shadow-subtle disabled:opacity-40 hover:opacity-90 active:scale-95 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Kirim Sub-Pertanyaan</span>
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* POPUP MODAL: LIHAT TEKS LENGKAP (FULL) */}
      {viewFullModal && viewFullModal.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setViewFullModal(null)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-3xl border border-line shadow-sheet p-5 sm:p-6 space-y-4 max-h-[85vh] flex flex-col animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-line">
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {viewFullModal.badgeText && (
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        viewFullModal.badgeColor === 'blue'
                          ? 'bg-blue-100 text-blue-700'
                          : viewFullModal.badgeColor === 'sky'
                          ? 'bg-sky-100 text-azure-700'
                          : viewFullModal.badgeColor === 'amber'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {viewFullModal.badgeText}
                    </span>
                  )}
                  <h3 className="text-sm sm:text-base font-extrabold text-navy-900 truncate">
                    {viewFullModal.title}
                  </h3>
                </div>
                {viewFullModal.subtitle && (
                  <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
                    {viewFullModal.subtitle}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setViewFullModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-navy-900 flex items-center justify-center transition-colors shrink-0"
                aria-label="Tutup dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Isi Konten Lengkap (Scrollable) */}
            <div className="flex-1 overflow-y-auto pr-1">
              {viewFullModal.content && viewFullModal.content.trim() ? (
                <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 text-slate-800 text-[13px] sm:text-sm leading-relaxed whitespace-pre-wrap break-words select-text font-medium">
                  {viewFullModal.content}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs italic">
                  (Belum ada jawaban atau catatan yang ditulis)
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="pt-2 border-t border-line flex items-center justify-end">
              <button
                type="button"
                onClick={() => setViewFullModal(null)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs transition-colors shadow-subtle flex items-center justify-center gap-1.5"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
