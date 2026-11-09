import { format, differenceInDays, differenceInYears, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

export function formatRupiah(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatShortRupiah(amount: number): string {
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(1)} M`;
  }
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)} jt`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)} rb`;
  }
  return String(amount);
}

export function formatDateIndo(dateStr: string, formatPattern = 'd MMMM yyyy'): string {
  if (!dateStr) return '-';
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
    return format(d, formatPattern, { locale: id });
  } catch {
    return dateStr;
  }
}

export function calculateAge(birthDateStr?: string): number | null {
  if (!birthDateStr) return null;
  try {
    const d = parseISO(birthDateStr);
    return differenceInYears(new Date(), d);
  } catch {
    return null;
  }
}

export function daysUntil(targetDateStr?: string): number | null {
  if (!targetDateStr) return null;
  try {
    const target = parseISO(targetDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return differenceInDays(target, today);
  } catch {
    return null;
  }
}
