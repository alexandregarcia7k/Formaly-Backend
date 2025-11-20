import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const oauthSchema = z.object({
  code: z.string().min(1, 'Código de autorização é obrigatório'),
});

export class OAuthDto extends createZodDto(oauthSchema) {}
