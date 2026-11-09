import { z } from 'zod';
import { MetaSchema, ModuleFileBaseSchema } from './common';

export const HealthRecordSchema = z.object({
  bloodType: z.string().default(''),
  rhesus: z.string().default(''),
  allergies: z.string().default(''),
  chronicIllness: z.string().default(''),
  surgeryHistory: z.string().default(''),
  surgeries: z.string().default(''),
  routineMedication: z.string().default(''),
  routineMeds: z.string().default(''),
  labTestResults: z.string().default(''),
  mentalHealthNotes: z.string().default(''),
  lifestyleHabits: z.string().default(''),
  notes: z.string().default(''),
  labProofFileId: z.string().optional(),
});

export const FamilyRecordSchema = z.object({
  fatherName: z.string().default(''),
  fatherOccupation: z.string().default(''),
  fatherJob: z.string().default(''),
  motherName: z.string().default(''),
  motherOccupation: z.string().default(''),
  motherJob: z.string().default(''),
  waliNasab: z.string().default(''),
  waliRelationship: z.string().default(''),
  siblingCount: z.number().default(0),
  siblingsCount: z.number().default(0),
  childOrder: z.number().default(1),
  siblingOrder: z.number().default(1),
  hereditaryDiseases: z.string().default(''),
  generalCondition: z.string().default(''),
  familyNotes: z.string().default(''),
});

export const QACardSchema = MetaSchema.extend({
  category: z.string(),
  questionNumber: z.number().optional(),
  question: z.string(),
  custom: z.boolean().default(false),
  answerSelf: z.string().default(''),
  answerPartner: z.string().default(''),
  note: z.string().default(''),
  principle: z.boolean().default(false),
  status: z.enum(['belum', 'dibahas', 'sepakat', 'ulang']).default('belum'),
});

export type QACard = z.infer<typeof QACardSchema>;

export const MediatorSchema = z.object({
  name: z.string().default(''),
  phone: z.string().default(''),
  relation: z.string().default(''),
});

export const ChecklistActionSchema = z.object({
  checked: z.boolean().default(false),
  date: z.string().default(''),
  notes: z.string().default(''),
});

export const DecisionsSchema = z.object({
  selfDecision: z.enum(['setuju', 'belum', 'tidak']).default('belum'),
  selfNotes: z.string().default(''),
  partnerDecision: z.enum(['setuju', 'belum', 'tidak']).default('belum'),
  partnerNotes: z.string().default(''),
});

export const TaarufStageSchema = z.object({
  currentStage: z.enum(['kenal', 'nadzor', 'taaruf', 'istikharah', 'keputusan']).default('kenal'),
  decision: z.enum(['belum', 'lanjut', 'tidak']).default('belum'),
  decisionDate: z.string().optional(),
  notes: z.string().default(''),
  pros: z.array(z.string()).default([]),
  cons: z.array(z.string()).default([]),
});

export const TaarufFileSchema = ModuleFileBaseSchema.extend({
  mediator: MediatorSchema.default({}),
  nadzor: ChecklistActionSchema.default({}),
  istikharah: ChecklistActionSchema.default({}),
  healthExchanged: z.boolean().default(false),
  familyExchanged: z.boolean().default(false),
  healthSelf: HealthRecordSchema.default({}),
  healthPartner: HealthRecordSchema.default({}),
  familySelf: FamilyRecordSchema.default({}),
  familyPartner: FamilyRecordSchema.default({}),
  privacyBlurEnabled: z.boolean().default(false),
  decisions: DecisionsSchema.default({}),
  qaCards: z.array(QACardSchema).default([]),
  stage: TaarufStageSchema.default({}),
});

export type TaarufFileData = z.infer<typeof TaarufFileSchema>;
