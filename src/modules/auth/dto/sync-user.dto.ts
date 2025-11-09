import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const syncUserSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(1, 'Nome é obrigatório'),
  image: z.string().url('URL da imagem inválida').optional(),
  provider: z.enum(['google', 'github', 'facebook']),
  providerId: z.string().min(1, 'Provider ID é obrigatório'),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  expiresAt: z.number().optional(),
});

export class SyncUserDto extends createZodDto(syncUserSchema) {}

export type SyncUserInput = z.infer<typeof syncUserSchema>;
