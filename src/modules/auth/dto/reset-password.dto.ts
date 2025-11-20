import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const resetPasswordSchema = z.object({
  token: z.string().min(32, 'Token inválido'),
  newPassword: z
    .string()
    .min(6, 'Senha deve ter no mínimo 6 caracteres')
    .max(100, 'Senha deve ter no máximo 100 caracteres'),
});

export class ResetPasswordDto extends createZodDto(resetPasswordSchema) {}
