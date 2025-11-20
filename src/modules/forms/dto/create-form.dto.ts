import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const fieldSchema = z.object({
  type: z.enum([
    'text',
    'email',
    'phone',
    'textarea',
    'number',
    'date',
    'select',
    'radio',
    'checkbox',
    'file',
  ]),
  label: z.string().min(1, 'Label é obrigatório'),
  name: z.string().min(1, 'Name é obrigatório'),
  placeholder: z.string().nullish(),
  required: z.boolean().default(false),
  config: z.record(z.string(), z.any()).nullish(),
});

export const createFormSchema = z.object({
  name: z
    .string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  description: z
    .string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .nullish(),
  password: z
    .union([
      z.string().length(0), // Vazio = sem senha
      z.string().min(4).max(50), // Ou senha válida de 4-50 caracteres
    ])
    .nullish(),
  maxResponses: z.number().int().positive().nullish(),
  expiresAt: z.string().datetime().nullish(),
  allowMultipleSubmissions: z.boolean().default(true),
  fields: z.array(fieldSchema).min(1, 'Pelo menos um campo é obrigatório'),
});

export class CreateFormDto extends createZodDto(createFormSchema) {}

export type CreateFormInput = z.infer<typeof createFormSchema>;
export type FieldInput = z.infer<typeof fieldSchema>;
