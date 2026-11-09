import { z } from 'zod';

export const MetaSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().optional(),
});

export type Meta = z.infer<typeof MetaSchema>;

export const StatusIndicatorSchema = z.enum(['belum', 'proses', 'selesai', 'terlambat']);
export type StatusIndicator = z.infer<typeof StatusIndicatorSchema>;

export const ModuleFileBaseSchema = z.object({
  schemaVersion: z.number().default(1),
  rev: z.number().default(1),
  updatedAt: z.string(),
});
