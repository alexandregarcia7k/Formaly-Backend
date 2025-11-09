import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const validatePasswordSchema = z.object({
  password: z.string().min(1, 'Senha é obrigatória'),
});

export class ValidatePasswordDto extends createZodDto(validatePasswordSchema) {}
