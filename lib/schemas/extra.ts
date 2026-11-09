import { z } from 'zod';
import { MetaSchema, ModuleFileBaseSchema } from './common';

export const TaskSchema = MetaSchema.extend({
  title: z.string(),
  phase: z.enum(['awal', 'taaruf', 'khitbah', 'kua', 'budget', 'harih', 'pascanikah']).default('awal'),
  dueDate: z.string().optional(),
  completed: z.boolean().default(false),
  priority: z.enum(['tinggi', 'sedang', 'rendah']).default('sedang'),
  notes: z.string().default(''),
});

export type TaskItem = z.infer<typeof TaskSchema>;

export const NoteSchema = MetaSchema.extend({
  title: z.string(),
  content: z.string().default(''),
  category: z.string().default('Refleksi & Nasihat'),
  pinned: z.boolean().default(false),
});

export type NoteItem = z.infer<typeof NoteSchema>;

export const HouseholdItemSchema = MetaSchema.extend({
  category: z.string().default('Kamar Tidur'),
  item: z.string(),
  estimate: z.number().default(0),
  actual: z.number().optional(),
  status: z.enum(['direncanakan', 'proses', 'dibeli']).default('direncanakan'),
  storeUrl: z.string().default(''),
  notes: z.string().default(''),
});

export type HouseholdItem = z.infer<typeof HouseholdItemSchema>;

export const ExtraFileSchema = ModuleFileBaseSchema.extend({
  tasks: z.array(TaskSchema).default([]),
  notes: z.array(NoteSchema).default([]),
  household: z.array(HouseholdItemSchema).default([]),
});

export type ExtraFileData = z.infer<typeof ExtraFileSchema>;
