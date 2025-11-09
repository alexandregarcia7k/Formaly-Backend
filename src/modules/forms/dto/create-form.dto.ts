import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { PredefinedFieldType } from '@/common/types/field-types.type';

const fieldSchema = z
  .object({
    fieldType: z.nativeEnum(PredefinedFieldType),
    customLabel: z.string().optional(),
    customName: z
      .string()
      .regex(
        /^[a-z][a-z0-9_]*$/,
        'Custom name deve começar com letra minúscula',
      )
      .optional(),
    required: z.boolean().default(false),
    customConfig: z.record(z.string(), z.any()).optional(),
  })
  .refine(
    (data) => {
      if (data.fieldType === PredefinedFieldType.CUSTOM) {
        return !!data.customName;
      }
      return true;
    },
    {
      message: 'customName é obrigatório quando fieldType é "custom"',
    },
  );

export const createFormSchema = z.object({
  name: z
    .string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  description: z
    .string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional(),
  password: z
    .string()
    .min(4, 'Senha deve ter no mínimo 4 caracteres')
    .max(8, 'Senha deve ter no máximo 8 caracteres')
    .optional(),
  maxResponses: z.number().int().positive().optional(),
  expiresAt: z.string().datetime().optional(),
  successMessage: z.string().max(500).optional(),
  allowMultipleSubmissions: z.boolean().default(true),
  fields: z.array(fieldSchema).min(1, 'Pelo menos um campo é obrigatório'),
});

export class CreateFormDto extends createZodDto(createFormSchema) {}

export type CreateFormInput = z.infer<typeof createFormSchema>;
export type FieldInput = z.infer<typeof fieldSchema>;
