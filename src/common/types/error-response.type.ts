/**
 * Estrutura padrão de resposta de erro para o frontend
 */
export interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp?: string;
  path?: string;
}

/**
 * Códigos de erro customizados para rastreamento
 */
export enum ErrorCode {
  // Auth errors (1xxx)
  INVALID_CREDENTIALS = 'AUTH_1001',
  TOKEN_EXPIRED = 'AUTH_1002',
  TOKEN_INVALID = 'AUTH_1003',
  UNAUTHORIZED = 'AUTH_1004',
  OAUTH_ACCOUNT_EXISTS = 'AUTH_1005',
  RESET_TOKEN_INVALID = 'AUTH_1006',
  RESET_TOKEN_EXPIRED = 'AUTH_1007',
  RESET_TOKEN_USED = 'AUTH_1008',

  // User errors (2xxx)
  USER_NOT_FOUND = 'USER_2001',
  USER_ALREADY_EXISTS = 'USER_2002',
  USER_INACTIVE = 'USER_2003',

  // Form errors (3xxx)
  FORM_NOT_FOUND = 'FORM_3001',
  FORM_ALREADY_EXISTS = 'FORM_3002',
  FORM_INACTIVE = 'FORM_3003',
  FORM_EXPIRED = 'FORM_3004',
  FORM_FULL = 'FORM_3005',
  FORM_PASSWORD_REQUIRED = 'FORM_3006',
  FORM_PASSWORD_INVALID = 'FORM_3007',
  FORM_UNAUTHORIZED = 'FORM_3008',

  // Field errors (4xxx)
  FIELD_NOT_FOUND = 'FIELD_4001',
  FIELD_INVALID_TYPE = 'FIELD_4002',
  FIELD_REQUIRED = 'FIELD_4003',
  FIELD_VALIDATION_FAILED = 'FIELD_4004',

  // Submission errors (5xxx)
  SUBMISSION_NOT_FOUND = 'SUBMISSION_5001',
  SUBMISSION_DUPLICATE = 'SUBMISSION_5002',
  SUBMISSION_INVALID = 'SUBMISSION_5003',

  // Database errors (6xxx)
  DATABASE_ERROR = 'DB_6001',
  RECORD_NOT_FOUND = 'DB_6002',
  DUPLICATE_RECORD = 'DB_6003',
  FOREIGN_KEY_VIOLATION = 'DB_6004',

  // Validation errors (7xxx)
  VALIDATION_ERROR = 'VAL_7001',
  INVALID_INPUT = 'VAL_7002',

  // Server errors (9xxx)
  INTERNAL_ERROR = 'SRV_9001',
  SERVICE_UNAVAILABLE = 'SRV_9002',
}

/**
 * Mensagens de erro amigáveis para o usuário
 */
export const ErrorMessages: Record<ErrorCode, string> = {
  // Auth
  [ErrorCode.INVALID_CREDENTIALS]: 'Email ou senha inválidos',
  [ErrorCode.TOKEN_EXPIRED]: 'Sessão expirada',
  [ErrorCode.TOKEN_INVALID]: 'Token inválido',
  [ErrorCode.UNAUTHORIZED]: 'Acesso não autorizado',
  [ErrorCode.OAUTH_ACCOUNT_EXISTS]: 'Email já cadastrado via OAuth',
  [ErrorCode.RESET_TOKEN_INVALID]: 'Token de recuperação inválido',
  [ErrorCode.RESET_TOKEN_EXPIRED]: 'Token de recuperação expirado',
  [ErrorCode.RESET_TOKEN_USED]: 'Token de recuperação já utilizado',

  // User
  [ErrorCode.USER_NOT_FOUND]: 'Usuário não encontrado',
  [ErrorCode.USER_ALREADY_EXISTS]: 'Usuário já cadastrado',
  [ErrorCode.USER_INACTIVE]: 'Usuário inativo',

  // Form
  [ErrorCode.FORM_NOT_FOUND]: 'Formulário não encontrado',
  [ErrorCode.FORM_ALREADY_EXISTS]: 'Formulário já existe',
  [ErrorCode.FORM_INACTIVE]: 'Formulário inativo',
  [ErrorCode.FORM_EXPIRED]: 'Formulário expirado',
  [ErrorCode.FORM_FULL]: 'Formulário atingiu limite de respostas',
  [ErrorCode.FORM_PASSWORD_REQUIRED]: 'Senha necessária para acessar',
  [ErrorCode.FORM_PASSWORD_INVALID]: 'Senha incorreta',
  [ErrorCode.FORM_UNAUTHORIZED]:
    'Você não tem permissão para acessar este formulário',

  // Field
  [ErrorCode.FIELD_NOT_FOUND]: 'Campo não encontrado',
  [ErrorCode.FIELD_INVALID_TYPE]: 'Tipo de campo inválido',
  [ErrorCode.FIELD_REQUIRED]: 'Campo obrigatório',
  [ErrorCode.FIELD_VALIDATION_FAILED]: 'Validação do campo falhou',

  // Submission
  [ErrorCode.SUBMISSION_NOT_FOUND]: 'Resposta não encontrada',
  [ErrorCode.SUBMISSION_DUPLICATE]: 'Você já respondeu este formulário',
  [ErrorCode.SUBMISSION_INVALID]: 'Resposta inválida',

  // Database
  [ErrorCode.DATABASE_ERROR]: 'Erro no banco de dados',
  [ErrorCode.RECORD_NOT_FOUND]: 'Registro não encontrado',
  [ErrorCode.DUPLICATE_RECORD]: 'Registro duplicado',
  [ErrorCode.FOREIGN_KEY_VIOLATION]: 'Violação de integridade',

  // Validation
  [ErrorCode.VALIDATION_ERROR]: 'Erro de validação',
  [ErrorCode.INVALID_INPUT]: 'Dados inválidos',

  // Server
  [ErrorCode.INTERNAL_ERROR]: 'Erro interno do servidor',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'Serviço temporariamente indisponível',
};

/**
 * Mensagens de sucesso centralizadas
 */
export const SuccessMessages = {
  PASSWORD_RESET_EMAIL_SENT:
    'Se o email existir, você receberá instruções para redefinir sua senha',
  PASSWORD_RESET_SUCCESS: 'Senha redefinida com sucesso',
  LOGOUT_SUCCESS: 'Logout realizado com sucesso',
} as const;
