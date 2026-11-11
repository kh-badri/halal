import { z } from 'zod';
import { MetaSchema, ModuleFileBaseSchema } from './common';

export const GuestSchema = MetaSchema.extend({
  name: z.string(),
  group: z.string().default('Keluarga'),
  side: z.enum(['pria', 'wanita']).default('pria'),
  pax: z.number().default(1),
  phone: z.string().default(''),
  session: z.enum(['akad', 'walimah', 'keduanya']).default('keduanya'),
  status: z.enum(['belum', 'diundang', 'konfirmasi', 'hadir']).default('belum'),
  checkInAt: z.string().optional(),
  tableNumber: z.string().default(''),
  notes: z.string().default(''),
});

export type Guest = z.infer<typeof GuestSchema>;

export const CommitteeMemberSchema = MetaSchema.extend({
  role: z.string(),
  personName: z.string().default(''),
  relationship: z.string().default(''),
  phone: z.string().default(''),
  taskDescription: z.string().default(''),
  isVital: z.boolean().default(false),
  isConfirmed: z.boolean().default(false),
  ktpChecked: z.boolean().default(false),
  notes: z.string().default(''),
});

export type CommitteeMember = z.infer<typeof CommitteeMemberSchema>;

export const HariHRundownItemSchema = MetaSchema.extend({
  time: z.string(),
  title: z.string(),
  pic: z.string().default(''),
  notes: z.string().default(''),
});

export type HariHRundownItem = z.infer<typeof HariHRundownItemSchema>;

export const ChecklistHMin1ItemSchema = MetaSchema.extend({
  task: z.string(),
  pic: z.string().default(''),
  status: z.enum(['belum', 'selesai']).default('belum'),
  notes: z.string().default(''),
});

export type ChecklistHMin1Item = z.infer<typeof ChecklistHMin1ItemSchema>;

export const CateringQuotaSchema = z.object({
  vendorTotalPax: z.number().default(500),
  vendorName: z.string().default(''),
  buffetRatio: z.number().default(100),
  notes: z.string().default(''),
});

export const HariHFileSchema = ModuleFileBaseSchema.extend({
  akadCompleted: z.boolean().default(false),
  akadDate: z.string().default(''),
  catering: CateringQuotaSchema.default({}),
  guests: z.array(GuestSchema).default([]),
  committee: z.array(CommitteeMemberSchema).default([]),
  rundown: z.array(HariHRundownItemSchema).default([]),
  hMin1Checklist: z.array(ChecklistHMin1ItemSchema).default([]),
});

export type HariHFileData = z.infer<typeof HariHFileSchema>;
