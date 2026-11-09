import { z } from 'zod';
import { MetaSchema, ModuleFileBaseSchema } from './common';

export const GiftSchema = MetaSchema.extend({
  name: z.string(),
  category: z.string().default('lainnya'),
  forWho: z.enum(['pria', 'wanita']).default('wanita'),
  qty: z.number().default(1),
  sizeColor: z.string().default(''),
  estimate: z.number().default(0),
  actual: z.number().optional(),
  storeUrl: z.string().default(''),
  photoFileId: z.string().optional(),
  status: z.enum(['ingin', 'dibeli', 'dikirim', 'diterima', 'dikemas']).default('ingin'),
  notes: z.string().default(''),
  syncToBudget: z.boolean().default(false),
});

export type Gift = z.infer<typeof GiftSchema>;

export const RundownItemSchema = MetaSchema.extend({
  step: z.number(),
  title: z.string(),
  durationMinutes: z.number().default(15),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  pic: z.string().default(''),
  notes: z.string().default(''),
});

export type RundownItem = z.infer<typeof RundownItemSchema>;

export const KhitbahPreparationChecklistSchema = MetaSchema.extend({
  item: z.string(),
  pic: z.string().default(''),
  completed: z.boolean().default(false),
  notes: z.string().default(''),
});

export const FamilyConsentSchema = z.object({
  selfFamilyAgreed: z.boolean().default(false),
  selfFamilyDate: z.string().default(''),
  selfFamilyNotes: z.string().default(''),
  partnerFamilyAgreed: z.boolean().default(false),
  partnerFamilyDate: z.string().default(''),
  partnerFamilyNotes: z.string().default(''),
});

export const KhitbahDecisionsSchema = z.object({
  selfDecision: z.enum(['lanjut', 'belum', 'tidak']).default('belum'),
  selfNotes: z.string().default(''),
  partnerDecision: z.enum(['lanjut', 'belum', 'tidak']).default('belum'),
  partnerNotes: z.string().default(''),
});

export const KhitbahExecutionSchema = z.object({
  completed: z.boolean().default(false),
  executionDate: z.string().default(''),
  weddingTargetDate: z.string().default(''),
  notes: z.string().default(''),
});

export const KhitbahFileSchema = ModuleFileBaseSchema.extend({
  summaryReviewed: z.boolean().default(false),
  summaryReviewedDate: z.string().default(''),
  familyConsent: FamilyConsentSchema.default({}),
  eventDate: z.string().default(''),
  eventStartTime: z.string().default('09:00'),
  locationName: z.string().default(''),
  locationAddress: z.string().default(''),
  gmapsUrl: z.string().default(''),
  maleFamilyCount: z.number().default(0),
  femaleFamilyCount: z.number().default(0),
  spokesperson: z.string().default(''),
  agreedRulesNotes: z.string().default(''),
  decisions: KhitbahDecisionsSchema.default({}),
  execution: KhitbahExecutionSchema.default({}),
  gifts: z.array(GiftSchema).default([]),
  rundown: z.array(RundownItemSchema).default([]),
  prepChecklist: z.array(KhitbahPreparationChecklistSchema).default([]),
});

export type KhitbahFileData = z.infer<typeof KhitbahFileSchema>;
