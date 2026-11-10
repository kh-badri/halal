import { StageKey, STAGE_ORDER, RouteState } from '../schemas/workspace';
export { STAGE_ORDER, type StageKey };

export interface StageDefinition {
  key: StageKey;
  stepNumber: number; // 1 to 8, or 9 for Halal
  title: string;
  shortTitle: string;
  subtitle: string;
  path: string;
  dataFiles: string[];
}

export const STAGE_DEFINITIONS: Record<StageKey, StageDefinition> = {
  'persetujuan-taaruf': {
    key: 'persetujuan-taaruf',
    stepNumber: 1,
    title: 'Persetujuan Ta’aruf',
    shortTitle: 'Persetujuan Ta’aruf',
    subtitle: 'Biodata, kesehatan, perantara, & keputusan awal',
    path: '/tahap/persetujuan-taaruf',
    dataFiles: ['taaruf.json', 'profile.json'],
  },
  'proses-taaruf': {
    key: 'proses-taaruf',
    stepNumber: 2,
    title: 'Proses Ta’aruf (Tanya Jawab)',
    shortTitle: 'Tanya Jawab Q&A',
    subtitle: '57 kartu diskusi prinsip pranikah',
    path: '/tahap/proses-taaruf',
    dataFiles: ['taaruf.json'],
  },
  'kesepakatan-khitbah': {
    key: 'kesepakatan-khitbah',
    stepNumber: 3,
    title: 'Kesepakatan Khitbah',
    shortTitle: 'Kesepakatan Khitbah',
    subtitle: 'Restu keluarga, waktu & tempat khitbah',
    path: '/tahap/kesepakatan-khitbah',
    dataFiles: ['khitbah.json'],
  },
  'proses-khitbah': {
    key: 'proses-khitbah',
    stepNumber: 4,
    title: 'Proses Khitbah',
    shortTitle: 'Proses Khitbah',
    subtitle: 'Seserahan, susunan acara, & tanggal akad',
    path: '/tahap/proses-khitbah',
    dataFiles: ['khitbah.json', 'budget.json'],
  },
  'kesepakatan-akad': {
    key: 'kesepakatan-akad',
    stepNumber: 5,
    title: 'Kesepakatan Akad & Anggaran',
    shortTitle: 'Akad & Anggaran',
    subtitle: 'Mahar, alokasi dana, & wali nasab',
    path: '/tahap/kesepakatan-akad',
    dataFiles: ['budget.json'],
  },
  'administrasi-kua': {
    key: 'administrasi-kua',
    stepNumber: 6,
    title: 'Administrasi & Berkas KUA',
    shortTitle: 'Berkas KUA',
    subtitle: 'Surat N1-N4, suntik TT, & Bimwin',
    path: '/tahap/administrasi-kua',
    dataFiles: ['kua.json'],
  },
  'persiapan-walimah': {
    key: 'persiapan-walimah',
    stepNumber: 7,
    title: 'Persiapan Walimah',
    shortTitle: 'Persiapan Walimah',
    subtitle: 'Vendor, cashflow, tamu, & panitia',
    path: '/tahap/persiapan-walimah',
    dataFiles: ['budget.json', 'harih.json'],
  },
  'hari-h': {
    key: 'hari-h',
    stepNumber: 8,
    title: 'Hari-H: Akad & Walimah',
    shortTitle: 'Hari-H Akad',
    subtitle: 'Checklist H-1 & penutupan akad',
    path: '/tahap/hari-h',
    dataFiles: ['harih.json'],
  },
  'halal': {
    key: 'halal',
    stepNumber: 9,
    title: 'Halal',
    shortTitle: 'Halal (Tujuan)',
    subtitle: 'Alhamdulillah! Doa & ringkasan perjalanan',
    path: '/tahap/halal',
    dataFiles: [],
  },
};

export function getStageIndex(key: StageKey): number {
  return STAGE_ORDER.indexOf(key);
}

export function getStageStatus(route?: RouteState | null, key?: StageKey): 'completed' | 'active' | 'locked' {
  if (!route || !route.currentStage || !key) return 'locked';
  const currentIdx = getStageIndex(route.currentStage);
  const targetIdx = getStageIndex(key);
  if (currentIdx < 0 || targetIdx < 0) return 'locked';

  if (targetIdx < currentIdx) {
    return 'completed';
  }
  if (targetIdx === currentIdx) {
    // If the route has halted or finished
    if (route.status === 'selesai' && key === 'halal') {
      return 'completed';
    }
    return 'active';
  }
  return 'locked';
}

export function isStageUnlocked(route?: RouteState | null, key?: StageKey): boolean {
  if (!route || !route.currentStage || !key) return false;
  const currentIdx = getStageIndex(route.currentStage);
  const targetIdx = getStageIndex(key);
  if (currentIdx < 0 || targetIdx < 0) return false;
  return targetIdx <= currentIdx;
}

export function getNextStage(current: StageKey): StageKey | null {
  const idx = getStageIndex(current);
  if (idx < 0 || idx >= STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[idx + 1];
}

export function getPreviousStage(current: StageKey): StageKey | null {
  const idx = getStageIndex(current);
  if (idx <= 0) return null;
  return STAGE_ORDER[idx - 1];
}
