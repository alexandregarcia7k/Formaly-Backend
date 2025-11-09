import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const submitResponseSchema = z.object({
  password: z.string().optional(),
  respondentEmail: z.string().email().optional(),
  respondentName: z.string().optional(),
  values: z.record(z.string(), z.any()),
});

export class SubmitResponseDto extends createZodDto(submitResponseSchema) {}

export type SubmitResponseInput = z.infer<typeof submitResponseSchema>;
