import { z } from 'zod';
import { ModuleFileBaseSchema } from './common';

export const PersonProfileSchema = z.object({
  photoFileId: z.string().optional(),
  thumbFileId: z.string().optional(),
  fullName: z.string().default(''),
  nickname: z.string().default(''),
  birthPlace: z.string().default(''),
  birthDate: z.string().default(''),
  heightCm: z.number().optional(),
  weightKg: z.number().optional(),
  ethnicity: z.string().default(''),
  domicile: z.string().default(''),
  status: z.enum(['lajang', 'duda', 'janda']).default('lajang'),
  phone: z.string().default(''),
  whatsapp: z.string().default(''),
  instagram: z.string().default(''),
  intermediaryName: z.string().default(''),
  intermediaryPhone: z.string().default(''),
  education: z.string().default(''),
  occupation: z.string().default(''),
  incomeRange: z.string().default(''),
  hobbies: z.string().default(''),
  strengths: z.string().default(''),
  weaknesses: z.string().default(''),
  visionMission: z.string().default(''),
  quranHafalan: z.string().default(''),
  worshipRoutine: z.string().default(''),
  routineStudy: z.string().default(''),
  notes: z.string().default(''),
});

export type PersonProfile = z.infer<typeof PersonProfileSchema>;

export const ProfileFileSchema = ModuleFileBaseSchema.extend({
  self: PersonProfileSchema.default({}),
  partner: PersonProfileSchema.default({}),
});

export type ProfileFileData = z.infer<typeof ProfileFileSchema>;

export const SettingsFileSchema = ModuleFileBaseSchema.extend({
  targetDate: z.string().default(''),
  weddingLocation: z.string().default(''),
  timezone: z.string().default('Asia/Jakarta'),
  emailNotifications: z.boolean().default(true),
  reminderDaysBefore: z.array(z.number()).default([7, 3, 1]),
  partnerInviteCode: z.string().optional(),
});

export type SettingsFileData = z.infer<typeof SettingsFileSchema>;
