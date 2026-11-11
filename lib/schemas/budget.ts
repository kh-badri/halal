import { z } from 'zod';
import { MetaSchema, ModuleFileBaseSchema } from './common';

export const BudgetItemSchema = MetaSchema.extend({
  posId: z.string(),
  name: z.string(),
  category: z.string().default('Umum'),
  estimate: z.number().default(0),
  actual: z.number().default(0),
  paymentStatus: z.enum(['belum', 'sebagian', 'lunas']).default('belum'),
  notes: z.string().default(''),
});

export type BudgetItem = z.infer<typeof BudgetItemSchema>;

export const BudgetCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  targetBudget: z.number().default(0),
  color: z.string().default('#D94F86'),
});

export type BudgetCategory = z.infer<typeof BudgetCategorySchema>;

export const MaharSchema = z.object({
  formType: z.enum(['uang', 'emas', 'alat_salat', 'lainnya']).default('uang'),
  description: z.string().default(''),
  value: z.number().default(0),
  unit: z.string().default('Rupiah'),
  notes: z.string().default(''),
  status: z.enum(['belum', 'proses', 'siap']).default('belum'),
});

export const FundingSourceSchema = MetaSchema.extend({
  name: z.string(),
  category: z.enum(['tabungan_pria', 'tabungan_wanita', 'bantuan_keluarga', 'hadiah', 'lainnya']).default('tabungan_pria'),
  amount: z.number().default(0),
  targetAmount: z.number().default(0),
  notes: z.string().default(''),
});

export type FundingSource = z.infer<typeof FundingSourceSchema>;

export const PaymentTermSchema = z.object({
  id: z.string(),
  date: z.string(),
  amount: z.number().default(0),
  proofFileId: z.string().optional(),
  note: z.string().default(''),
});

export type PaymentTerm = z.infer<typeof PaymentTermSchema>;

export const VendorSchema = MetaSchema.extend({
  name: z.string(),
  category: z.string().default('Katering'),
  contact: z.string().default(''),
  total: z.number().default(0),
  downPayment: z.number().default(0),
  dueDate: z.string().optional(),
  notes: z.string().default(''),
  payments: z.array(PaymentTermSchema).default([]),
});

export type Vendor = z.infer<typeof VendorSchema>;

export const BudgetAgreementSchema = z.object({
  akadDate: z.string().default(''),
  waliNasab: z.string().default(''),
  familyConsent: z.boolean().default(false),
  notes: z.string().default(''),
});

export type BudgetAgreement = z.infer<typeof BudgetAgreementSchema>;

export const BudgetFileSchema = ModuleFileBaseSchema.extend({
  agreement: BudgetAgreementSchema.default({}),
  categories: z.array(BudgetCategorySchema).default([
    { id: 'khitbah', name: 'Biaya Khitbah / Lamaran', targetBudget: 5000000, color: '#FFE4EE' },
    { id: 'mahar', name: 'Mahar & Mas Kawin', targetBudget: 10000000, color: '#D6EBFF' },
    { id: 'akad_walimah', name: 'Biaya Akad & Walimah', targetBudget: 45000000, color: '#D94F86' },
  ]),
  items: z.array(BudgetItemSchema).default([]),
  mahar: MaharSchema.default({}),
  fundingSources: z.array(FundingSourceSchema).default([]),
  vendors: z.array(VendorSchema).default([]),
});

export type BudgetFileData = z.infer<typeof BudgetFileSchema>;
