import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { createFormSchema } from './create-form.dto';

export const updateFormSchema = createFormSchema.partial().extend({
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export class UpdateFormDto extends createZodDto(updateFormSchema) {}

export type UpdateFormInput = z.infer<typeof updateFormSchema>;
