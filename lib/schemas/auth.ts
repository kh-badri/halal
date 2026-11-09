import { z } from 'zod';

export const RegisterSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  identifier: z.string().min(3, 'Email atau Username minimal 3 karakter'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  role: z.enum(['pria', 'wanita'], {
    required_error: 'Pilih peran Anda (Catin Pria atau Catin Wanita)',
  }),
  targetDate: z.string().optional(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  identifier: z.string().min(3, 'Masukkan email atau username'),
  password: z.string().min(1, 'Password wajib diisi'),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Format email tidak valid'),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Token reset tidak valid'),
  newPassword: z.string().min(8, 'Password baru minimal 8 karakter'),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Password lama wajib diisi'),
  newPassword: z.string().min(8, 'Password baru minimal 8 karakter'),
});
