import { z } from 'zod';
import { MetaSchema, ModuleFileBaseSchema } from './common';

export const KUADocumentSchema = MetaSchema.extend({
  title: z.string(),
  forWho: z.enum(['pria', 'wanita']).default('pria'),
  category: z.string().default('identitas'),
  copies: z.number().default(2),
  status: z.enum(['belum', 'diurus', 'selesai']).default('belum'),
  submissionDate: z.string().optional(),
  agency: z.string().default('Kelurahan / KUA'),
  notes: z.string().default(''),
  scanFileId: z.string().optional(),
});

export type KUADocument = z.infer<typeof KUADocumentSchema>;

export const RecommendationLetterSchema = z.object({
  isRequired: z.boolean().default(false),
  originKua: z.string().default(''),
  destinationKua: z.string().default(''),
  submissionDate: z.string().default(''),
  status: z.enum(['belum', 'diajukan', 'terbit', 'diserahkan']).default('belum'),
  letterNumber: z.string().default(''),
  scanFileId: z.string().optional(),
  notes: z.string().default(''),
});

export const TTInjectionScheduleSchema = MetaSchema.extend({
  stage: z.string(), // TT1, TT2, TT3, TT4, TT5
  targetDate: z.string().default(''),
  actualDate: z.string().optional(),
  healthFacility: z.string().default('Puskesmas'),
  proofFileId: z.string().optional(),
  status: z.enum(['belum', 'selesai']).default('belum'),
  notes: z.string().default(''),
});

export const HealthCheckupSchema = MetaSchema.extend({
  title: z.string(),
  forWho: z.enum(['pria', 'wanita']).default('pria'),
  date: z.string().default(''),
  facility: z.string().default('Puskesmas / Lab'),
  resultsSummary: z.string().default(''),
  proofFileId: z.string().optional(),
  status: z.enum(['belum', 'selesai']).default('belum'),
});

export const BimwinSchema = z.object({
  date: z.string().default(''),
  time: z.string().default(''),
  location: z.string().default('KUA Setempat / Online Simkah'),
  method: z.enum(['tatap_muka', 'online', 'mandiri']).default('tatap_muka'),
  status: z.enum(['belum', 'terdaftar', 'selesai']).default('belum'),
  certificateNumber: z.string().default(''),
  certFileId: z.string().optional(),
  notes: z.string().default(''),
});

export const ElsimilSchema = z.object({
  status: z.enum(['belum', 'proses', 'siap_nikah']).default('belum'),
  certificateNumber: z.string().default(''),
  certFileId: z.string().optional(),
  notes: z.string().default(''),
});

export const KUAFileSchema = ModuleFileBaseSchema.extend({
  registrationTargetDate: z.string().default(''),
  documents: z.array(KUADocumentSchema).default([]),
  recommendationLetter: RecommendationLetterSchema.default({}),
  ttInjections: z.array(TTInjectionScheduleSchema).default([
    { id: 'tt-1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), stage: 'TT1 (Kunjungan Pertama)', targetDate: '', healthFacility: 'Puskesmas Setempat', status: 'belum', notes: 'Langkah awal kekebalan tetanus' },
    { id: 'tt-2', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), stage: 'TT2 (1 Bulan setelah TT1)', targetDate: '', healthFacility: 'Puskesmas Setempat', status: 'belum', notes: 'Perlindungan 3 tahun' },
  ]),
  healthCheckups: z.array(HealthCheckupSchema).default([]),
  bimwin: BimwinSchema.default({}),
  elsimil: ElsimilSchema.default({}),
});

export type KUAFileData = z.infer<typeof KUAFileSchema>;
