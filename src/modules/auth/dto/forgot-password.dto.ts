import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const forgotPasswordSchema = z.object({
  email: z.string().email('E-mail inválido'),
});

export class ForgotPasswordDto extends createZodDto(forgotPasswordSchema) {}
