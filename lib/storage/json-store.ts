import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { writeAtomic } from './atomic-write';
import { withLock } from './lock';
import { ProfileFileSchema } from '../schemas/profile';
import { SettingsFileSchema } from '../schemas/profile';
import { TaarufFileSchema } from '../schemas/taaruf';
import { KhitbahFileSchema } from '../schemas/khitbah';
import { BudgetFileSchema } from '../schemas/budget';
import { KUAFileSchema } from '../schemas/kua';
import { HariHFileSchema } from '../schemas/harih';
import { ExtraFileSchema } from '../schemas/extra';
import { WorkspaceSchema, RouteStateSchema } from '../schemas/workspace';
import { DEFAULT_QA_CARDS } from '../constants/qa-data';
import {
  DEFAULT_SESERAHAN_ITEMS,
  DEFAULT_KHITBAH_RUNDOWN,
  DEFAULT_KUA_DOCUMENTS_PRIA,
  DEFAULT_KUA_DOCUMENTS_WANITA,
  DEFAULT_COMMITTEE_ROLES,
  DEFAULT_HARIH_RUNDOWN,
  DEFAULT_CHECKLIST_HMIN1,
  DEFAULT_HOUSEHOLD_ITEMS,
} from '../constants/default-data';

export const WORKSPACE_MODULE_NAMES = [
  'workspace',
  'route',
  'settings',
  'profile',
  'taaruf',
  'khitbah',
  'budget',
  'kua',
  'harih',
  'extra',
] as const;

export type WorkspaceModuleName = (typeof WORKSPACE_MODULE_NAMES)[number];

// Alias for backwards compatibility
export const MODULE_NAMES = WORKSPACE_MODULE_NAMES;
export type ModuleName = WorkspaceModuleName;

// Base data directory from ENV or default to ./roadtohalal-data
export function getDataDir(): string {
  const dir = process.env.DATA_DIR || path.join(process.cwd(), 'roadtohalal-data');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  }
  return dir;
}

export function getUserDir(userId: string): string {
  const userDir = path.join(getDataDir(), 'users', userId);
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true, mode: 0o700 });
  }
  return userDir;
}

export function getWorkspaceDir(workspaceId: string): string {
  const wsDir = path.join(getDataDir(), 'workspaces', workspaceId);
  if (!fs.existsSync(wsDir)) {
    fs.mkdirSync(wsDir, { recursive: true, mode: 0o700 });
  }
  return wsDir;
}

export function getUploadsDir(workspaceId?: string): string {
  const uploadsDir = workspaceId
    ? path.join(getDataDir(), 'uploads', workspaceId)
    : path.join(getDataDir(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true, mode: 0o700 });
  }
  return uploadsDir;
}

export function getWorkspaceModuleFilePath(workspaceId: string, moduleName: WorkspaceModuleName): string {
  return path.join(getWorkspaceDir(workspaceId), `${moduleName}.json`);
}

// Backwards compatibility helper
export function getModuleFilePath(targetId: string, moduleName: ModuleName): string {
  // If target starts with ws_, it's a workspace, otherwise fallback to user dir
  if (targetId.startsWith('ws_')) {
    return getWorkspaceModuleFilePath(targetId, moduleName);
  }
  // Try workspace first, then fallback
  const wsPath = path.join(getDataDir(), 'workspaces', targetId, `${moduleName}.json`);
  if (fs.existsSync(path.dirname(wsPath))) {
    return wsPath;
  }
  return path.join(getUserDir(targetId), `${moduleName}.json`);
}

// Memory Cache with mtime checking for fast read operations
interface CacheEntry {
  mtimeMs: number;
  data: any;
}

const memoryCache = new Map<string, CacheEntry>();

function getFromCache(filePath: string): any | null {
  if (!fs.existsSync(filePath)) return null;
  const stat = fs.statSync(filePath);
  const cached = memoryCache.get(filePath);
  if (cached && cached.mtimeMs === stat.mtimeMs) {
    return JSON.parse(JSON.stringify(cached.data));
  }
  return null;
}

function setToCache(filePath: string, data: any): void {
  try {
    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      memoryCache.set(filePath, {
        mtimeMs: stat.mtimeMs,
        data: JSON.parse(JSON.stringify(data)),
      });
    }
  } catch {
    // Ignore cache error
  }
}

export function invalidateCache(filePath: string): void {
  memoryCache.delete(filePath);
}

// Generate default initial data for a workspace module
export function getDefaultWorkspaceModuleData(
  moduleName: WorkspaceModuleName,
  context?: { workspaceId?: string; ownerId?: string; ownerName?: string; targetDate?: string }
): any {
  const now = new Date().toISOString();
  const base = {
    schemaVersion: 1,
    rev: 1,
    updatedAt: now,
  };

  switch (moduleName) {
    case 'workspace':
      return {
        id: context?.workspaceId || `ws_${Date.now()}`,
        ownerId: context?.ownerId || '',
        members: context?.ownerId
          ? [
              {
                userId: context.ownerId,
                name: context.ownerName || 'Pemilik',
                relation: 'Pemilik',
                access: 'full',
                joinedAt: now,
              },
            ]
          : [],
        invites: [],
        quotaMB: 50,
        createdAt: now,
        updatedAt: now,
      };

    case 'route':
      return {
        ...base,
        currentStage: 'persetujuan-taaruf',
        status: 'berjalan',
        completed: {},
        reopenLog: [],
      };

    case 'settings':
      return {
        ...base,
        targetDate: context?.targetDate || '',
        weddingLocation: '',
        timezone: 'Asia/Jakarta',
        emailNotifications: true,
        reminderDaysBefore: [7, 3, 1],
      };

    case 'profile':
      return {
        ...base,
        self: {
          fullName: context?.ownerName || '',
          nickname: context?.ownerName?.split(' ')[0] || '',
          status: 'lajang',
          education: '',
          occupation: '',
          dob: '',
          domicile: '',
          phone: '',
        },
        partner: {
          fullName: '',
          nickname: '',
          status: 'lajang',
          education: '',
          occupation: '',
          dob: '',
          domicile: '',
          phone: '',
        },
      };

    case 'taaruf':
      return {
        ...base,
        mediator: {
          name: '',
          phone: '',
          relation: '',
        },
        nadzor: {
          checked: false,
          date: '',
          notes: '',
        },
        istikharah: {
          checked: false,
          date: '',
          notes: '',
        },
        healthExchanged: false,
        familyExchanged: false,
        healthSelf: {
          bloodType: '',
          rhesus: '',
          allergies: '',
          chronicIllness: '',
          surgeries: '',
          routineMeds: '',
          notes: '',
        },
        healthPartner: {
          bloodType: '',
          rhesus: '',
          allergies: '',
          chronicIllness: '',
          surgeries: '',
          routineMeds: '',
          notes: '',
        },
        familySelf: {
          fatherName: '',
          fatherJob: '',
          motherName: '',
          motherJob: '',
          waliNasab: '',
          siblingsCount: 0,
          siblingOrder: 1,
          familyNotes: '',
        },
        familyPartner: {
          fatherName: '',
          fatherJob: '',
          motherName: '',
          motherJob: '',
          waliNasab: '',
          siblingsCount: 0,
          siblingOrder: 1,
          familyNotes: '',
        },
        privacyBlurEnabled: false,
        decisions: {
          selfDecision: 'belum', // setuju | belum | tidak
          selfNotes: '',
          partnerDecision: 'belum', // setuju | belum | tidak
          partnerNotes: '',
        },
        qaCards: DEFAULT_QA_CARDS.map((card) => ({
          id: card.id,
          createdAt: now,
          updatedAt: now,
          category: card.category,
          questionNumber: card.questionNumber,
          question: card.question,
          custom: false,
          answerSelf: '',
          answerPartner: '',
          note: '',
          principle: card.principle || false,
          status: 'belum', // belum | dibahas | sepakat | ulang
        })),
        stage: {
          currentStage: 'kenal',
          decision: 'belum',
          notes: '',
          pros: [],
          cons: [],
        },
      };

    case 'khitbah':
      return {
        ...base,
        summaryReviewed: false,
        familyConsent: {
          selfFamilyAgreed: false,
          selfFamilyDate: '',
          selfFamilyNotes: '',
          partnerFamilyAgreed: false,
          partnerFamilyDate: '',
          partnerFamilyNotes: '',
        },
        eventDate: '',
        eventStartTime: '09:00',
        locationName: '',
        locationAddress: '',
        gmapsUrl: '',
        maleFamilyCount: 0,
        femaleFamilyCount: 0,
        spokesperson: '',
        agreedRulesNotes: '',
        decisions: {
          selfDecision: 'belum', // lanjut | belum | tidak
          partnerDecision: 'belum', // lanjut | belum | tidak
        },
        execution: {
          completed: false,
          executionDate: '',
          weddingTargetDate: '',
          notes: '',
        },
        gifts: DEFAULT_SESERAHAN_ITEMS.map((item, index) => ({
          id: `gift-${index + 1}`,
          createdAt: now,
          updatedAt: now,
          name: item.name,
          category: item.category,
          forWho: item.forWho,
          qty: item.qty,
          sizeColor: item.sizeColor,
          estimate: item.estimate,
          actual: 0,
          storeUrl: item.storeUrl,
          notes: item.notes,
          status: 'ingin', // ingin | dibeli | dikirim | diterima | dikemas
          syncToBudget: true,
        })),
        rundown: DEFAULT_KHITBAH_RUNDOWN.map((item) => ({
          id: `khitbah-run-${item.step}`,
          createdAt: now,
          updatedAt: now,
          step: item.step,
          title: item.title,
          durationMinutes: item.durationMinutes,
          pic: item.pic,
          notes: item.notes,
        })),
        prepChecklist: [
          { id: 'prep-1', createdAt: now, updatedAt: now, item: 'Konfirmasi MC dan Tokoh Agama Pembaca Doa', completed: false, pic: 'Keluarga' },
          { id: 'prep-2', createdAt: now, updatedAt: now, item: 'Penataan Meja Display Seserahan & Cincin', completed: false, pic: 'Dekorasi' },
          { id: 'prep-3', createdAt: now, updatedAt: now, item: 'Pemesanan Katering Prasmanan / Snack Lamaran', completed: false, pic: 'Konsumsi' },
          { id: 'prep-4', createdAt: now, updatedAt: now, item: 'Sound System & Mikrofon Wireless Tes H-1', completed: false, pic: 'Perlengkapan' },
        ],
      };

    case 'budget':
      return {
        ...base,
        categories: [
          { id: 'khitbah', name: 'Biaya Khitbah / Lamaran', targetBudget: 5000000, color: '#FFE4EE' },
          { id: 'mahar', name: 'Mahar & Mas Kawin', targetBudget: 10000000, color: '#D6EBFF' },
          { id: 'akad_walimah', name: 'Biaya Akad & Walimah', targetBudget: 45000000, color: '#1E3A5F' },
        ],
        items: [
          { id: 'b-item-1', createdAt: now, updatedAt: now, posId: 'khitbah', name: 'Konsumsi & Snack Acara Lamaran', category: 'Konsumsi', estimate: 2500000, actual: 0, paymentStatus: 'belum' },
          { id: 'b-item-2', createdAt: now, updatedAt: now, posId: 'khitbah', name: 'Dekorasi Backdrop Minimalis Lamaran', category: 'Dekorasi', estimate: 1200000, actual: 0, paymentStatus: 'belum' },
          { id: 'b-item-3', createdAt: now, updatedAt: now, posId: 'mahar', name: 'Logam Mulia / Emas Antam 10 Gram', category: 'Mahar', estimate: 14000000, actual: 0, paymentStatus: 'belum' },
          { id: 'b-item-4', createdAt: now, updatedAt: now, posId: 'akad_walimah', name: 'Sewa Gedung / Venue Pernikahan', category: 'Venue', estimate: 12000000, actual: 0, paymentStatus: 'belum' },
          { id: 'b-item-5', createdAt: now, updatedAt: now, posId: 'akad_walimah', name: 'Paket Katering 500 Porsi', category: 'Katering', estimate: 25000000, actual: 0, paymentStatus: 'belum' },
          { id: 'b-item-6', createdAt: now, updatedAt: now, posId: 'akad_walimah', name: 'Paket Rias Pengantin & Busana (MUA)', category: 'MUA', estimate: 6000000, actual: 0, paymentStatus: 'belum' },
          { id: 'b-item-7', createdAt: now, updatedAt: now, posId: 'akad_walimah', name: 'Dokumentasi Foto & Video Cinematic', category: 'Dokumentasi', estimate: 4500000, actual: 0, paymentStatus: 'belum' },
        ],
        mahar: {
          formType: 'emas',
          description: 'Emas Batangan 10 Gram + Seperangkat Alat Salat',
          value: 14000000,
          unit: 'Gram / Rupiah',
          notes: 'Dibeli di butik Antam resmi bersertifikat LBMA',
          status: 'belum',
        },
        agreement: {
          akadDate: '',
          location: '',
          waliNasab: '',
          familyConsent: false,
          costSharingNotes: '',
        },
        fundingSources: [
          { id: 'fund-1', createdAt: now, updatedAt: now, name: 'Tabungan Pribadi Catin Pria', category: 'tabungan_pria', amount: 30000000, targetAmount: 35000000, notes: 'Rekening khusus pernikahan' },
          { id: 'fund-2', createdAt: now, updatedAt: now, name: 'Tabungan Bersama Catin Wanita', category: 'tabungan_wanita', amount: 15000000, targetAmount: 20000000, notes: 'Alokasi perlengkapan dan seserahan' },
        ],
        vendors: [
          {
            id: 'v-1',
            createdAt: now,
            updatedAt: now,
            name: 'Katering Berkah Rasa',
            category: 'Katering',
            contact: '081234567890',
            total: 25000000,
            downPayment: 5000000,
            dueDate: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString().split('T')[0],
            notes: 'Termasuk menu buffet utama dan 4 gubukan',
            payments: [
              { id: 'p-1', date: new Date().toISOString().split('T')[0], amount: 5000000, note: 'Tanda Jadi / Booking Tanggal' },
            ],
          },
        ],
      };

    case 'kua':
      return {
        ...base,
        registrationTargetDate: '',
        registeredDate: '',
        documents: [
          ...DEFAULT_KUA_DOCUMENTS_PRIA.map((doc, idx) => ({
            id: `kua-pria-${idx + 1}`,
            createdAt: now,
            updatedAt: now,
            title: doc.title,
            forWho: 'pria' as const,
            category: doc.category,
            copies: doc.copies,
            status: 'belum' as const,
            agency: doc.agency,
            notes: doc.notes,
          })),
          ...DEFAULT_KUA_DOCUMENTS_WANITA.map((doc, idx) => ({
            id: `kua-wanita-${idx + 1}`,
            createdAt: now,
            updatedAt: now,
            title: doc.title,
            forWho: 'wanita' as const,
            category: doc.category,
            copies: doc.copies,
            status: 'belum' as const,
            agency: doc.agency,
            notes: doc.notes,
          })),
        ],
        recommendationLetter: {
          isRequired: false,
          originKua: '',
          destinationKua: '',
          submissionDate: '',
          status: 'belum', // belum | diajukan | terbit | diserahkan
          letterNumber: '',
          notes: '',
        },
        ttInjections: [
          { id: 'tt-1', createdAt: now, updatedAt: now, stage: 'TT1 (Kunjungan Pertama)', targetDate: '', healthFacility: 'Puskesmas Domisili', status: 'belum', notes: 'Langkah awal kekebalan tetanus' },
          { id: 'tt-2', createdAt: now, updatedAt: now, stage: 'TT2 (1 Bulan setelah TT1)', targetDate: '', healthFacility: 'Puskesmas Domisili', status: 'belum', notes: 'Perlindungan tetanus selama 3 tahun' },
        ],
        healthCheckups: [
          { id: 'hc-1', createdAt: now, updatedAt: now, title: 'Cek Darah Lengkap, Hb, dan Golongan Darah', forWho: 'pria', date: '', facility: 'Puskesmas', resultsSummary: '', status: 'belum' },
          { id: 'hc-2', createdAt: now, updatedAt: now, title: 'Cek Hb, Thalassemia, Hepatitis B, & Rubella', forWho: 'wanita', date: '', facility: 'Puskesmas', resultsSummary: '', status: 'belum' },
        ],
        bimwin: {
          date: '',
          time: '08:00 - 15:00 WIB',
          location: 'KUA Setempat / Daring via Simkah',
          method: 'tatap_muka',
          status: 'belum', // belum | selesai
          certificateNumber: '',
          notes: 'Wajib diikuti kedua calon pengantin untuk mendapatkan Buku Nikah',
        },
        elsimil: {
          status: 'belum',
          certificateNumber: '',
          notes: 'Aplikasi Elektronik Siap Nikah & Siap Hamil (BKKBN)',
        },
      };

    case 'harih':
      return {
        ...base,
        akadCompleted: false,
        akadDate: '',
        akadNotes: '',
        walimahCompleted: false,
        catering: {
          vendorTotalPax: 500,
          vendorName: 'Katering Berkah',
          buffetRatio: 100,
          notes: 'Perkiraan 2x lipat undangan fisik jika bersama keluarga',
        },
        guests: [
          { id: 'g-1', createdAt: now, updatedAt: now, name: 'Keluarga Besar Kakek/Nenek Pria', group: 'Keluarga Inti', side: 'pria', pax: 15, phone: '', session: 'keduanya', status: 'konfirmasi', tableNumber: 'Meja VIP 1' },
          { id: 'g-2', createdAt: now, updatedAt: now, name: 'Keluarga Besar Kakek/Nenek Wanita', group: 'Keluarga Inti', side: 'wanita', pax: 15, phone: '', session: 'keduanya', status: 'konfirmasi', tableNumber: 'Meja VIP 2' },
          { id: 'g-3', createdAt: now, updatedAt: now, name: 'Sahabat Kuliah / Teman Kantor Pria', group: 'Teman', side: 'pria', pax: 2, phone: '08123456789', session: 'walimah', status: 'diundang', tableNumber: '' },
          { id: 'g-4', createdAt: now, updatedAt: now, name: 'Sahabat Dekat Calon Wanita', group: 'Teman', side: 'wanita', pax: 2, phone: '08987654321', session: 'walimah', status: 'diundang', tableNumber: '' },
        ],
        committee: DEFAULT_COMMITTEE_ROLES.map((role, idx) => ({
          id: `comm-${idx + 1}`,
          createdAt: now,
          updatedAt: now,
          role: role.role,
          personName: '',
          relationship: '',
          phone: '',
          taskDescription: role.defaultTask,
          isVital: role.isVital,
          isConfirmed: false,
          ktpChecked: false,
          notes: '',
        })),
        rundown: DEFAULT_HARIH_RUNDOWN.map((item, idx) => ({
          id: `run-h-${idx + 1}`,
          createdAt: now,
          updatedAt: now,
          time: item.time,
          title: item.title,
          pic: item.pic,
          notes: item.notes,
        })),
        hMin1Checklist: DEFAULT_CHECKLIST_HMIN1.map((item) => ({
          id: item.id,
          createdAt: now,
          updatedAt: now,
          task: item.task,
          pic: item.pic,
          status: item.status,
          notes: item.notes,
        })),
      };

    case 'extra':
      return {
        ...base,
        tasks: [
          { id: 'task-1', createdAt: now, updatedAt: now, title: 'Tentukan tanggal target akad bersama kedua keluarga', phase: 'awal', completed: true, priority: 'tinggi' },
          { id: 'task-2', createdAt: now, updatedAt: now, title: 'Selesaikan pembahasan 57 kartu tanya jawab pranikah', phase: 'taaruf', completed: false, priority: 'tinggi' },
          { id: 'task-3', createdAt: now, updatedAt: now, title: 'Beli dan kemas seluruh kotak seserahan lamaran', phase: 'khitbah', completed: false, priority: 'sedang' },
          { id: 'task-4', createdAt: now, updatedAt: now, title: 'Urus berkas N1-N4 ke Kelurahan & Puskesmas', phase: 'kua', completed: false, priority: 'tinggi' },
          { id: 'task-5', createdAt: now, updatedAt: now, title: 'Daftar nikah ke KUA minimal H-10 hari kerja', phase: 'kua', completed: false, priority: 'tinggi' },
          { id: 'task-6', createdAt: now, updatedAt: now, title: 'Pelunasan DP & termin vendor gedung, katering, dan MUA', phase: 'budget', completed: false, priority: 'tinggi' },
          { id: 'task-7', createdAt: now, updatedAt: now, title: 'Finalisasi daftar tamu dan konfirmasi kehadiran pax katering', phase: 'harih', completed: false, priority: 'tinggi' },
          { id: 'task-8', createdAt: now, updatedAt: now, title: 'Briefing panitia keluarga dan gladi bersih saksi nikah', phase: 'harih', completed: false, priority: 'sedang' },
        ],
        notes: [
          {
            id: 'note-1',
            createdAt: now,
            updatedAt: now,
            title: 'Niat dan Komitmen Awal Membangun Rumah Tangga',
            content: 'Pernikahan adalah ibadah terpanjang. Niatkan semata-mata mencari keridhaan Allah Ta’ala, saling menguatkan dalam taat, dan menjaga amanah fitrah keluarga.',
            category: 'Refleksi & Nasihat',
            pinned: true,
          },
        ],
        household: DEFAULT_HOUSEHOLD_ITEMS.map((item) => ({
          id: item.id,
          createdAt: now,
          updatedAt: now,
          category: item.category,
          item: item.item,
          estimate: item.estimate,
          status: item.status as any,
          storeUrl: '',
          notes: '',
        })),
      };

    default:
      return base;
  }
}

// Backwards-compatible wrapper
export function getDefaultModuleData(moduleName: ModuleName, userRole: 'pria' | 'wanita' = 'pria'): any {
  return getDefaultWorkspaceModuleData(moduleName);
}

// Schemas mapping for validation
export function getWorkspaceModuleSchema(moduleName: WorkspaceModuleName): z.ZodTypeAny {
  switch (moduleName) {
    case 'workspace':
      return WorkspaceSchema;
    case 'route':
      return RouteStateSchema;
    case 'settings':
      return SettingsFileSchema;
    case 'profile':
      return ProfileFileSchema;
    case 'taaruf':
      return TaarufFileSchema;
    case 'khitbah':
      return KhitbahFileSchema;
    case 'budget':
      return BudgetFileSchema;
    case 'kua':
      return KUAFileSchema;
    case 'harih':
      return HariHFileSchema;
    case 'extra':
      return ExtraFileSchema;
    default:
      return z.any();
  }
}

export function getModuleSchema(moduleName: ModuleName): z.ZodTypeAny {
  return getWorkspaceModuleSchema(moduleName);
}

/**
 * Reads a workspace module JSON file safely with cache, validation, and .bak recovery
 */
export async function readWorkspaceModule<T = any>(
  workspaceId: string,
  moduleName: WorkspaceModuleName
): Promise<T> {
  const filePath = getWorkspaceModuleFilePath(workspaceId, moduleName);

  // 1. Try Cache
  const cached = getFromCache(filePath);
  if (cached) {
    return cached as T;
  }

  // 2. If file doesn't exist, initialize
  if (!fs.existsSync(filePath)) {
    const defaultData = getDefaultWorkspaceModuleData(moduleName, { workspaceId });
    await writeAtomic(filePath, JSON.stringify(defaultData, null, 2));
    setToCache(filePath, defaultData);
    return defaultData as T;
  }

  // 3. Read and parse
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    const schema = getWorkspaceModuleSchema(moduleName);
    const validated = schema.parse(parsed);
    setToCache(filePath, validated);
    return validated as T;
  } catch (error) {
    console.error(`[Storage] Read error or schema invalid on ${filePath}. Attempting .bak recovery:`, error);
    const bakPath = `${filePath}.bak`;
    if (fs.existsSync(bakPath)) {
      try {
        const rawBak = fs.readFileSync(bakPath, 'utf8');
        const parsedBak = JSON.parse(rawBak);
        const schema = getWorkspaceModuleSchema(moduleName);
        const validatedBak = schema.parse(parsedBak);
        await writeAtomic(filePath, JSON.stringify(validatedBak, null, 2));
        setToCache(filePath, validatedBak);
        console.warn(`[Storage] Successfully recovered ${filePath} from .bak`);
        return validatedBak as T;
      } catch (bakError) {
        console.error(`[Storage] Recovery from .bak failed:`, bakError);
      }
    }

    // Fallback to default
    const defaultData = getDefaultWorkspaceModuleData(moduleName, { workspaceId });
    await writeAtomic(filePath, JSON.stringify(defaultData, null, 2));
    setToCache(filePath, defaultData);
    return defaultData as T;
  }
}

/**
 * Writes data to a workspace module safely inside lock and atomic write
 */
export async function writeWorkspaceModule<T = any>(
  workspaceId: string,
  moduleName: WorkspaceModuleName,
  data: Partial<T>
): Promise<T> {
  const filePath = getWorkspaceModuleFilePath(workspaceId, moduleName);

  return await withLock(filePath, async () => {
    const existing = await readWorkspaceModule(workspaceId, moduleName);
    const merged = {
      ...existing,
      ...data,
      rev: ((existing as any)?.rev || 0) + 1,
      updatedAt: new Date().toISOString(),
    };

    const schema = getWorkspaceModuleSchema(moduleName);
    const validated = schema.parse(merged);

    await writeAtomic(filePath, JSON.stringify(validated, null, 2));
    setToCache(filePath, validated);
    return validated as T;
  });
}

/**
 * Item-level addition in a workspace module collection
 */
export async function addItemToWorkspaceModule<T = any>(
  workspaceId: string,
  moduleName: WorkspaceModuleName,
  collectionKey: string,
  item: any
): Promise<T> {
  const filePath = getWorkspaceModuleFilePath(workspaceId, moduleName);

  return await withLock(filePath, async () => {
    const currentData = (await readWorkspaceModule(workspaceId, moduleName)) as any;
    const items = Array.isArray(currentData[collectionKey]) ? currentData[collectionKey] : [];

    const now = new Date().toISOString();
    const newItem = {
      id: item.id || `${collectionKey}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: item.createdAt || now,
      updatedAt: now,
      ...item,
    };

    const updatedData = {
      ...currentData,
      [collectionKey]: [newItem, ...items],
      rev: (currentData.rev || 0) + 1,
      updatedAt: now,
    };

    const schema = getWorkspaceModuleSchema(moduleName);
    const validated = schema.parse(updatedData);

    await writeAtomic(filePath, JSON.stringify(validated, null, 2));
    setToCache(filePath, validated);
    return validated as T;
  });
}

/**
 * Item-level update in a workspace module collection
 */
export async function updateItemInWorkspaceModule<T = any>(
  workspaceId: string,
  moduleName: WorkspaceModuleName,
  collectionKey: string,
  itemId: string,
  patch: any
): Promise<T> {
  const filePath = getWorkspaceModuleFilePath(workspaceId, moduleName);

  return await withLock(filePath, async () => {
    const currentData = (await readWorkspaceModule(workspaceId, moduleName)) as any;
    const items = Array.isArray(currentData[collectionKey]) ? currentData[collectionKey] : [];

    const now = new Date().toISOString();
    let found = false;
    const updatedItems = items.map((it: any) => {
      if (it.id === itemId) {
        found = true;
        return {
          ...it,
          ...patch,
          id: itemId,
          updatedAt: now,
        };
      }
      return it;
    });

    if (!found) {
      console.warn(`[Storage] Item ${itemId} not found in ${moduleName}.${collectionKey}`);
    }

    const updatedData = {
      ...currentData,
      [collectionKey]: updatedItems,
      rev: (currentData.rev || 0) + 1,
      updatedAt: now,
    };

    const schema = getWorkspaceModuleSchema(moduleName);
    const validated = schema.parse(updatedData);

    await writeAtomic(filePath, JSON.stringify(validated, null, 2));
    setToCache(filePath, validated);
    return validated as T;
  });
}

/**
 * Item-level delete in a workspace module collection
 */
export async function deleteItemFromWorkspaceModule<T = any>(
  workspaceId: string,
  moduleName: WorkspaceModuleName,
  collectionKey: string,
  itemId: string,
  permanent: boolean = false
): Promise<T> {
  const filePath = getWorkspaceModuleFilePath(workspaceId, moduleName);

  return await withLock(filePath, async () => {
    const currentData = (await readWorkspaceModule(workspaceId, moduleName)) as any;
    const items = Array.isArray(currentData[collectionKey]) ? currentData[collectionKey] : [];
    const now = new Date().toISOString();

    let updatedItems: any[];
    if (permanent) {
      updatedItems = items.filter((it: any) => it.id !== itemId);
    } else {
      updatedItems = items.map((it: any) => {
        if (it.id === itemId) {
          return {
            ...it,
            deletedAt: now,
            updatedAt: now,
          };
        }
        return it;
      });
    }

    const updatedData = {
      ...currentData,
      [collectionKey]: updatedItems,
      rev: (currentData.rev || 0) + 1,
      updatedAt: now,
    };

    const schema = getWorkspaceModuleSchema(moduleName);
    const validated = schema.parse(updatedData);

    await writeAtomic(filePath, JSON.stringify(validated, null, 2));
    setToCache(filePath, validated);
    return validated as T;
  });
}

/**
 * Item-level restore in a workspace module collection
 */
export async function restoreItemInWorkspaceModule<T = any>(
  workspaceId: string,
  moduleName: WorkspaceModuleName,
  collectionKey: string,
  itemId: string
): Promise<T> {
  const filePath = getWorkspaceModuleFilePath(workspaceId, moduleName);

  return await withLock(filePath, async () => {
    const currentData = (await readWorkspaceModule(workspaceId, moduleName)) as any;
    const items = Array.isArray(currentData[collectionKey]) ? currentData[collectionKey] : [];
    const now = new Date().toISOString();

    const updatedItems = items.map((it: any) => {
      if (it.id === itemId) {
        const { deletedAt, ...rest } = it;
        return {
          ...rest,
          updatedAt: now,
        };
      }
      return it;
    });

    const updatedData = {
      ...currentData,
      [collectionKey]: updatedItems,
      rev: (currentData.rev || 0) + 1,
      updatedAt: now,
    };

    const schema = getWorkspaceModuleSchema(moduleName);
    const validated = schema.parse(updatedData);

    await writeAtomic(filePath, JSON.stringify(validated, null, 2));
    setToCache(filePath, validated);
    return validated as T;
  });
}

/**
 * Item-level reordering in a workspace module collection
 */
export async function reorderItemsInWorkspaceModule<T = any>(
  workspaceId: string,
  moduleName: WorkspaceModuleName,
  collectionKey: string,
  orderedIds: string[]
): Promise<T> {
  const filePath = getWorkspaceModuleFilePath(workspaceId, moduleName);

  return await withLock(filePath, async () => {
    const currentData = (await readWorkspaceModule(workspaceId, moduleName)) as any;
    const items = Array.isArray(currentData[collectionKey]) ? currentData[collectionKey] : [];
    const now = new Date().toISOString();

    const itemMap = new Map<string, any>();
    items.forEach((it: any) => itemMap.set(it.id, it));

    const reordered: any[] = [];
    orderedIds.forEach((id, idx) => {
      const it = itemMap.get(id);
      if (it) {
        reordered.push({ ...it, step: idx + 1, updatedAt: now });
        itemMap.delete(id);
      }
    });

    itemMap.forEach((it) => reordered.push(it));

    const updatedData = {
      ...currentData,
      [collectionKey]: reordered,
      rev: (currentData.rev || 0) + 1,
      updatedAt: now,
    };

    const schema = getWorkspaceModuleSchema(moduleName);
    const validated = schema.parse(updatedData);

    await writeAtomic(filePath, JSON.stringify(validated, null, 2));
    setToCache(filePath, validated);
    return validated as T;
  });
}

// ----------------- Backwards-compatibility aliases for legacy callers -----------------

export async function readModuleData<T = any>(targetId: string, moduleName: ModuleName): Promise<T> {
  return await readWorkspaceModule<T>(targetId, moduleName);
}

export async function writeModuleData<T = any>(targetId: string, moduleName: ModuleName, data: Partial<T>): Promise<T> {
  return await writeWorkspaceModule<T>(targetId, moduleName, data);
}

export async function addItemToModule<T = any>(targetId: string, moduleName: ModuleName, collectionKey: string, item: any): Promise<T> {
  return await addItemToWorkspaceModule<T>(targetId, moduleName, collectionKey, item);
}

export async function updateItemInModule<T = any>(targetId: string, moduleName: ModuleName, collectionKey: string, itemId: string, patch: any): Promise<T> {
  return await updateItemInWorkspaceModule<T>(targetId, moduleName, collectionKey, itemId, patch);
}

export async function deleteItemFromModule<T = any>(targetId: string, moduleName: ModuleName, collectionKey: string, itemId: string, permanent: boolean = false): Promise<T> {
  return await deleteItemFromWorkspaceModule<T>(targetId, moduleName, collectionKey, itemId, permanent);
}

export async function restoreItemInModule<T = any>(targetId: string, moduleName: ModuleName, collectionKey: string, itemId: string): Promise<T> {
  return await restoreItemInWorkspaceModule<T>(targetId, moduleName, collectionKey, itemId);
}

export async function reorderItemsInModule<T = any>(targetId: string, moduleName: ModuleName, collectionKey: string, orderedIds: string[]): Promise<T> {
  return await reorderItemsInWorkspaceModule<T>(targetId, moduleName, collectionKey, orderedIds);
}
