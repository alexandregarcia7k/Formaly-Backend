import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const metadataSchema = z.object({
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  timeSpent: z.number().int().positive().optional(),
});

export const submitResponseSchema = z.object({
  data: z.record(z.string(), z.any()),
  password: z.string().optional(),
  metadata: metadataSchema.optional(),
});

export class SubmitResponseDto extends createZodDto(submitResponseSchema) {}
