export enum PredefinedFieldType {
  // Informações Pessoais
  FULL_NAME = 'full_name',
  FIRST_NAME = 'first_name',
  LAST_NAME = 'last_name',
  EMAIL = 'email',
  PHONE = 'phone',
  BIRTH_DATE = 'birth_date',
  CPF = 'cpf',
  RG = 'rg',
  GENDER = 'gender',

  // Endereço
  ADDRESS = 'address',
  STREET = 'street',
  NUMBER = 'number',
  COMPLEMENT = 'complement',
  NEIGHBORHOOD = 'neighborhood',
  CITY = 'city',
  STATE = 'state',
  ZIP_CODE = 'zip_code',
  COUNTRY = 'country',

  // Profissional
  COMPANY = 'company',
  JOB_TITLE = 'job_title',
  WORK_EMAIL = 'work_email',
  WORK_PHONE = 'work_phone',

  // Comunicação
  MESSAGE = 'message',
  COMMENTS = 'comments',
  FEEDBACK = 'feedback',
  WEBSITE = 'website',
  INSTAGRAM = 'instagram',
  FACEBOOK = 'facebook',
  LINKEDIN = 'linkedin',
  TWITTER = 'twitter',

  // Outros
  AGE = 'age',
  QUANTITY = 'quantity',
  PRICE = 'price',
  DATE = 'date',
  TIME = 'time',

  // Custom
  CUSTOM = 'custom',
}

export interface FieldTypeMetadata {
  name: PredefinedFieldType;
  label: string;
  type:
    | 'text'
    | 'email'
    | 'phone'
    | 'textarea'
    | 'number'
    | 'date'
    | 'select'
    | 'radio';
  placeholder: string;
  category: 'personal' | 'address' | 'professional' | 'communication' | 'other';
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
  };
  options?: string[];
}

export const FIELD_TYPES_METADATA: Record<
  PredefinedFieldType,
  FieldTypeMetadata
> = {
  // Informações Pessoais
  [PredefinedFieldType.FULL_NAME]: {
    name: PredefinedFieldType.FULL_NAME,
    label: 'Nome Completo',
    type: 'text',
    placeholder: 'Digite seu nome completo',
    category: 'personal',
    validation: { minLength: 3, maxLength: 100 },
  },
  [PredefinedFieldType.FIRST_NAME]: {
    name: PredefinedFieldType.FIRST_NAME,
    label: 'Primeiro Nome',
    type: 'text',
    placeholder: 'Digite seu primeiro nome',
    category: 'personal',
    validation: { minLength: 2, maxLength: 50 },
  },
  [PredefinedFieldType.LAST_NAME]: {
    name: PredefinedFieldType.LAST_NAME,
    label: 'Sobrenome',
    type: 'text',
    placeholder: 'Digite seu sobrenome',
    category: 'personal',
    validation: { minLength: 2, maxLength: 50 },
  },
  [PredefinedFieldType.EMAIL]: {
    name: PredefinedFieldType.EMAIL,
    label: 'Email',
    type: 'email',
    placeholder: 'seu@email.com',
    category: 'personal',
    validation: { pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' },
  },
  [PredefinedFieldType.PHONE]: {
    name: PredefinedFieldType.PHONE,
    label: 'Telefone',
    type: 'phone',
    placeholder: '(11) 99999-9999',
    category: 'personal',
    validation: { pattern: '^\\(?\\d{2}\\)?\\s?\\d{4,5}-?\\d{4}$' },
  },
  [PredefinedFieldType.BIRTH_DATE]: {
    name: PredefinedFieldType.BIRTH_DATE,
    label: 'Data de Nascimento',
    type: 'date',
    placeholder: 'DD/MM/AAAA',
    category: 'personal',
  },
  [PredefinedFieldType.CPF]: {
    name: PredefinedFieldType.CPF,
    label: 'CPF',
    type: 'text',
    placeholder: '000.000.000-00',
    category: 'personal',
    validation: { pattern: '^\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}$' },
  },
  [PredefinedFieldType.RG]: {
    name: PredefinedFieldType.RG,
    label: 'RG',
    type: 'text',
    placeholder: '00.000.000-0',
    category: 'personal',
    validation: { maxLength: 20 },
  },
  [PredefinedFieldType.GENDER]: {
    name: PredefinedFieldType.GENDER,
    label: 'Gênero',
    type: 'select',
    placeholder: 'Selecione seu gênero',
    category: 'personal',
    options: ['Masculino', 'Feminino', 'Outro', 'Prefiro não informar'],
  },

  // Endereço
  [PredefinedFieldType.ADDRESS]: {
    name: PredefinedFieldType.ADDRESS,
    label: 'Endereço Completo',
    type: 'textarea',
    placeholder: 'Digite seu endereço completo',
    category: 'address',
    validation: { maxLength: 200 },
  },
  [PredefinedFieldType.STREET]: {
    name: PredefinedFieldType.STREET,
    label: 'Rua',
    type: 'text',
    placeholder: 'Nome da rua',
    category: 'address',
    validation: { maxLength: 100 },
  },
  [PredefinedFieldType.NUMBER]: {
    name: PredefinedFieldType.NUMBER,
    label: 'Número',
    type: 'text',
    placeholder: '123',
    category: 'address',
    validation: { maxLength: 10 },
  },
  [PredefinedFieldType.COMPLEMENT]: {
    name: PredefinedFieldType.COMPLEMENT,
    label: 'Complemento',
    type: 'text',
    placeholder: 'Apto, bloco, etc',
    category: 'address',
    validation: { maxLength: 50 },
  },
  [PredefinedFieldType.NEIGHBORHOOD]: {
    name: PredefinedFieldType.NEIGHBORHOOD,
    label: 'Bairro',
    type: 'text',
    placeholder: 'Nome do bairro',
    category: 'address',
    validation: { maxLength: 50 },
  },
  [PredefinedFieldType.CITY]: {
    name: PredefinedFieldType.CITY,
    label: 'Cidade',
    type: 'text',
    placeholder: 'Nome da cidade',
    category: 'address',
    validation: { maxLength: 50 },
  },
  [PredefinedFieldType.STATE]: {
    name: PredefinedFieldType.STATE,
    label: 'Estado',
    type: 'text',
    placeholder: 'SP',
    category: 'address',
    validation: { maxLength: 2, pattern: '^[A-Z]{2}$' },
  },
  [PredefinedFieldType.ZIP_CODE]: {
    name: PredefinedFieldType.ZIP_CODE,
    label: 'CEP',
    type: 'text',
    placeholder: '00000-000',
    category: 'address',
    validation: { pattern: '^\\d{5}-?\\d{3}$' },
  },
  [PredefinedFieldType.COUNTRY]: {
    name: PredefinedFieldType.COUNTRY,
    label: 'País',
    type: 'text',
    placeholder: 'Brasil',
    category: 'address',
    validation: { maxLength: 50 },
  },

  // Profissional
  [PredefinedFieldType.COMPANY]: {
    name: PredefinedFieldType.COMPANY,
    label: 'Empresa',
    type: 'text',
    placeholder: 'Nome da empresa',
    category: 'professional',
    validation: { maxLength: 100 },
  },
  [PredefinedFieldType.JOB_TITLE]: {
    name: PredefinedFieldType.JOB_TITLE,
    label: 'Cargo',
    type: 'text',
    placeholder: 'Seu cargo',
    category: 'professional',
    validation: { maxLength: 100 },
  },
  [PredefinedFieldType.WORK_EMAIL]: {
    name: PredefinedFieldType.WORK_EMAIL,
    label: 'Email Profissional',
    type: 'email',
    placeholder: 'seu@empresa.com',
    category: 'professional',
    validation: { pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' },
  },
  [PredefinedFieldType.WORK_PHONE]: {
    name: PredefinedFieldType.WORK_PHONE,
    label: 'Telefone Comercial',
    type: 'phone',
    placeholder: '(11) 3000-0000',
    category: 'professional',
    validation: { pattern: '^\\(?\\d{2}\\)?\\s?\\d{4}-?\\d{4}$' },
  },

  // Comunicação
  [PredefinedFieldType.MESSAGE]: {
    name: PredefinedFieldType.MESSAGE,
    label: 'Mensagem',
    type: 'textarea',
    placeholder: 'Digite sua mensagem',
    category: 'communication',
    validation: { maxLength: 1000 },
  },
  [PredefinedFieldType.COMMENTS]: {
    name: PredefinedFieldType.COMMENTS,
    label: 'Comentários',
    type: 'textarea',
    placeholder: 'Deixe seus comentários',
    category: 'communication',
    validation: { maxLength: 500 },
  },
  [PredefinedFieldType.FEEDBACK]: {
    name: PredefinedFieldType.FEEDBACK,
    label: 'Feedback',
    type: 'textarea',
    placeholder: 'Compartilhe seu feedback',
    category: 'communication',
    validation: { maxLength: 500 },
  },
  [PredefinedFieldType.WEBSITE]: {
    name: PredefinedFieldType.WEBSITE,
    label: 'Website',
    type: 'text',
    placeholder: 'https://seusite.com',
    category: 'communication',
    validation: { pattern: '^https?://.*' },
  },
  [PredefinedFieldType.INSTAGRAM]: {
    name: PredefinedFieldType.INSTAGRAM,
    label: 'Instagram',
    type: 'text',
    placeholder: '@seuusuario',
    category: 'communication',
    validation: { pattern: '^@?[a-zA-Z0-9._]+$' },
  },
  [PredefinedFieldType.FACEBOOK]: {
    name: PredefinedFieldType.FACEBOOK,
    label: 'Facebook',
    type: 'text',
    placeholder: 'facebook.com/seuusuario',
    category: 'communication',
    validation: { maxLength: 100 },
  },
  [PredefinedFieldType.LINKEDIN]: {
    name: PredefinedFieldType.LINKEDIN,
    label: 'LinkedIn',
    type: 'text',
    placeholder: 'linkedin.com/in/seuusuario',
    category: 'communication',
    validation: { maxLength: 100 },
  },
  [PredefinedFieldType.TWITTER]: {
    name: PredefinedFieldType.TWITTER,
    label: 'Twitter/X',
    type: 'text',
    placeholder: '@seuusuario',
    category: 'communication',
    validation: { pattern: '^@?[a-zA-Z0-9_]+$' },
  },

  // Outros
  [PredefinedFieldType.AGE]: {
    name: PredefinedFieldType.AGE,
    label: 'Idade',
    type: 'number',
    placeholder: '18',
    category: 'other',
    validation: { min: 0, max: 150 },
  },
  [PredefinedFieldType.QUANTITY]: {
    name: PredefinedFieldType.QUANTITY,
    label: 'Quantidade',
    type: 'number',
    placeholder: '1',
    category: 'other',
    validation: { min: 0 },
  },
  [PredefinedFieldType.PRICE]: {
    name: PredefinedFieldType.PRICE,
    label: 'Preço',
    type: 'number',
    placeholder: '0.00',
    category: 'other',
    validation: { min: 0 },
  },
  [PredefinedFieldType.DATE]: {
    name: PredefinedFieldType.DATE,
    label: 'Data',
    type: 'date',
    placeholder: 'DD/MM/AAAA',
    category: 'other',
  },
  [PredefinedFieldType.TIME]: {
    name: PredefinedFieldType.TIME,
    label: 'Horário',
    type: 'text',
    placeholder: '14:30',
    category: 'other',
    validation: { pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
  },

  // Custom
  [PredefinedFieldType.CUSTOM]: {
    name: PredefinedFieldType.CUSTOM,
    label: 'Campo Personalizado',
    type: 'text',
    placeholder: 'Digite aqui',
    category: 'other',
  },
};
