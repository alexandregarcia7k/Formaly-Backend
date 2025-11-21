import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const findSubmissionsFiltersSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export class FindSubmissionsFiltersDto extends createZodDto(
  findSubmissionsFiltersSchema,
) {}

export type FindSubmissionsFiltersInput = z.infer<
  typeof findSubmissionsFiltersSchema
>;
