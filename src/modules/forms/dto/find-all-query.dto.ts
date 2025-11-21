import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const findAllQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(15),
  search: z.string().optional(),
  searchIn: z.enum(['form', 'responses', 'all']).default('form'),
  status: z.enum(['active', 'inactive', 'all']).default('all'),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'name', 'totalResponses'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export class FindAllQueryDto extends createZodDto(findAllQuerySchema) {}
