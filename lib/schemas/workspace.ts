import { z } from 'zod';

export const StageKeySchema = z.enum([
  'persetujuan-taaruf',
  'proses-taaruf',
  'kesepakatan-khitbah',
  'proses-khitbah',
  'kesepakatan-akad',
  'administrasi-kua',
  'persiapan-walimah',
  'hari-h',
  'halal',
]);

export type StageKey = z.infer<typeof StageKeySchema>;

export const STAGE_ORDER: StageKey[] = [
  'persetujuan-taaruf',
  'proses-taaruf',
  'kesepakatan-khitbah',
  'proses-khitbah',
  'kesepakatan-akad',
  'administrasi-kua',
  'persiapan-walimah',
  'hari-h',
  'halal',
];

export const RouteStatusSchema = z.enum(['berjalan', 'berhenti', 'selesai']);
export type RouteStatus = z.infer<typeof RouteStatusSchema>;

export const RouteCompletionRecordSchema = z.object({
  at: z.string(),
  by: z.string(),
});

export const ReopenLogEntrySchema = z.object({
  stage: StageKeySchema,
  at: z.string(),
  by: z.string(),
  reason: z.string(),
});

export const RouteStateSchema = z.object({
  schemaVersion: z.number().default(1),
  rev: z.number().default(1),
  currentStage: StageKeySchema.default('persetujuan-taaruf'),
  status: RouteStatusSchema.default('berjalan'),
  completed: z.record(StageKeySchema, RouteCompletionRecordSchema).default({}),
  reopenLog: z.array(ReopenLogEntrySchema).default([]),
  updatedAt: z.string(),
});

export type RouteState = z.infer<typeof RouteStateSchema>;

export const AccessLevelSchema = z.enum(['read', 'full']);
export type AccessLevel = z.infer<typeof AccessLevelSchema>;

export const MemberSchema = z.object({
  userId: stringOrAny(),
  name: z.string(),
  relation: z.string(),
  access: AccessLevelSchema,
  joinedAt: z.string(),
  lastSeenAt: z.string().optional(),
});

function stringOrAny() {
  return z.string();
}

export type Member = z.infer<typeof MemberSchema>;

export const InviteSchema = z.object({
  code: z.string().min(6).max(12),
  access: AccessLevelSchema,
  relation: z.string(),
  expiresAt: z.string(),
  usedBy: z.string().optional(),
  createdAt: z.string(),
});

export type Invite = z.infer<typeof InviteSchema>;

export const WorkspaceSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  members: z.array(MemberSchema).default([]),
  invites: z.array(InviteSchema).default([]),
  quotaMB: z.number().default(50),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Workspace = z.infer<typeof WorkspaceSchema>;

export const CreateInviteSchema = z.object({
  access: AccessLevelSchema.default('read'),
  relation: z.string().min(1, 'Label hubungan wajib diisi'),
});

export const JoinInviteSchema = z.object({
  code: z.string().min(4, 'Kode undangan wajib diisi'),
  name: z.string().min(2, 'Nama minimal 2 karakter').optional(),
  password: z.string().min(8, 'Password minimal 8 karakter').optional(),
  identifier: z.string().min(3, 'Username atau email minimal 3 karakter').optional(),
  role: z.enum(['pria', 'wanita']).optional(),
});
