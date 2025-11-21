import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const findAllFiltersSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().min(1).max(100).default(15),
  search: z.string().optional(),
  searchIn: z.enum(['form', 'responses', 'all']).default('form'),
  status: z.enum(['active', 'inactive', 'all']).default('all'),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'name', 'totalResponses'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export class FindAllFiltersDto extends createZodDto(findAllFiltersSchema) {}

export type FindAllFiltersInput = z.infer<typeof findAllFiltersSchema>;
