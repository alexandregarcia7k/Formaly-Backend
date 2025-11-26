import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const periodQuerySchema = z.object({
  period: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
  formId: z.string().uuid().optional(),
});

export class PeriodQueryDto extends createZodDto(periodQuerySchema) {}

export type PeriodQuery = z.infer<typeof periodQuerySchema>;
