import {
  HttpException,
  HttpStatus,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ErrorCode,
  ErrorMessages,
  ErrorResponse,
} from '../types/error-response.type';

/**
 * Base class para exceções customizadas
 */
export class AppException extends HttpException {
  constructor(
    public readonly code: ErrorCode,
    statusCode: HttpStatus,
    message?: string,
  ) {
    const errorMessage = message || ErrorMessages[code];
    super(
      {
        statusCode,
        message: errorMessage,
        error: code,
        timestamp: new Date().toISOString(),
      } as ErrorResponse,
      statusCode,
    );
  }
}

// ==================== AUTH EXCEPTIONS ====================

export class InvalidCredentialsException extends UnauthorizedException {
  constructor(message?: string) {
    const errorMessage =
      message || ErrorMessages[ErrorCode.INVALID_CREDENTIALS];
    super({
      statusCode: HttpStatus.UNAUTHORIZED,
      message: errorMessage,
      error: ErrorCode.INVALID_CREDENTIALS,
      timestamp: new Date().toISOString(),
    } as ErrorResponse);
  }
}

export class TokenExpiredException extends UnauthorizedException {
  constructor(message?: string) {
    const errorMessage = message || ErrorMessages[ErrorCode.TOKEN_EXPIRED];
    super({
      statusCode: HttpStatus.UNAUTHORIZED,
      message: errorMessage,
      error: ErrorCode.TOKEN_EXPIRED,
      timestamp: new Date().toISOString(),
    } as ErrorResponse);
  }
}

export class TokenInvalidException extends UnauthorizedException {
  constructor(message?: string) {
    const errorMessage = message || ErrorMessages[ErrorCode.TOKEN_INVALID];
    super({
      statusCode: HttpStatus.UNAUTHORIZED,
      message: errorMessage,
      error: ErrorCode.TOKEN_INVALID,
      timestamp: new Date().toISOString(),
    } as ErrorResponse);
  }
}

// ==================== USER EXCEPTIONS ====================

export class UserNotFoundException extends NotFoundException {
  constructor(identifier?: string) {
    const message = identifier
      ? `Usuário ${identifier} não encontrado`
      : ErrorMessages[ErrorCode.USER_NOT_FOUND];
    super({
      statusCode: HttpStatus.NOT_FOUND,
      message,
      error: ErrorCode.USER_NOT_FOUND,
      timestamp: new Date().toISOString(),
    } as ErrorResponse);
  }
}

export class UserAlreadyExistsException extends ConflictException {
  constructor(email?: string) {
    const message = email
      ? `Usuário com email ${email} já existe`
      : ErrorMessages[ErrorCode.USER_ALREADY_EXISTS];
    super({
      statusCode: HttpStatus.CONFLICT,
      message,
      error: ErrorCode.USER_ALREADY_EXISTS,
      timestamp: new Date().toISOString(),
    } as ErrorResponse);
  }
}

export class OAuthAccountExistsException extends ConflictException {
  constructor(provider: string) {
    const message = `Este email já está cadastrado via ${provider}. Faça login com ${provider} ou defina uma senha.`;
    super({
      statusCode: HttpStatus.CONFLICT,
      message,
      error: ErrorCode.OAUTH_ACCOUNT_EXISTS,
      timestamp: new Date().toISOString(),
    } as ErrorResponse);
  }
}

export class InvalidResetTokenException extends UnauthorizedException {
  constructor(reason?: 'expired' | 'used' | 'invalid') {
    let message: string;
    let code: ErrorCode;

    switch (reason) {
      case 'expired':
        message = ErrorMessages[ErrorCode.RESET_TOKEN_EXPIRED];
        code = ErrorCode.RESET_TOKEN_EXPIRED;
        break;
      case 'used':
        message = ErrorMessages[ErrorCode.RESET_TOKEN_USED];
        code = ErrorCode.RESET_TOKEN_USED;
        break;
      default:
        message = ErrorMessages[ErrorCode.RESET_TOKEN_INVALID];
        code = ErrorCode.RESET_TOKEN_INVALID;
    }

    super({
      statusCode: HttpStatus.UNAUTHORIZED,
      message,
      error: code,
      timestamp: new Date().toISOString(),
    } as ErrorResponse);
  }
}

// ==================== FORM EXCEPTIONS ====================

export class FormNotFoundException extends NotFoundException {
  constructor(formId?: string) {
    const message = formId
      ? `Formulário ${formId} não encontrado`
      : ErrorMessages[ErrorCode.FORM_NOT_FOUND];
    super({
      statusCode: HttpStatus.NOT_FOUND,
      message,
      error: ErrorCode.FORM_NOT_FOUND,
      timestamp: new Date().toISOString(),
    } as ErrorResponse);
  }
}

export class FormInactiveException extends BadRequestException {
  constructor() {
    super({
      statusCode: HttpStatus.BAD_REQUEST,
      message: ErrorMessages[ErrorCode.FORM_INACTIVE],
      error: ErrorCode.FORM_INACTIVE,
      timestamp: new Date().toISOString(),
    } as ErrorResponse);
  }
}

export class FormExpiredException extends BadRequestException {
  constructor() {
    super({
      statusCode: HttpStatus.BAD_REQUEST,
      message: ErrorMessages[ErrorCode.FORM_EXPIRED],
      error: ErrorCode.FORM_EXPIRED,
      timestamp: new Date().toISOString(),
    } as ErrorResponse);
  }
}

export class FormFullException extends BadRequestException {
  constructor() {
    super({
      statusCode: HttpStatus.BAD_REQUEST,
      message: ErrorMessages[ErrorCode.FORM_FULL],
      error: ErrorCode.FORM_FULL,
      timestamp: new Date().toISOString(),
    } as ErrorResponse);
  }
}

export class FormPasswordRequiredException extends UnauthorizedException {
  constructor() {
    super({
      statusCode: HttpStatus.UNAUTHORIZED,
      message: ErrorMessages[ErrorCode.FORM_PASSWORD_REQUIRED],
      error: ErrorCode.FORM_PASSWORD_REQUIRED,
      timestamp: new Date().toISOString(),
    } as ErrorResponse);
  }
}

export class FormPasswordInvalidException extends UnauthorizedException {
  constructor() {
    super({
      statusCode: HttpStatus.UNAUTHORIZED,
      message: ErrorMessages[ErrorCode.FORM_PASSWORD_INVALID],
      error: ErrorCode.FORM_PASSWORD_INVALID,
      timestamp: new Date().toISOString(),
    } as ErrorResponse);
  }
}

export class FormUnauthorizedException extends ForbiddenException {
  constructor() {
    super({
      statusCode: HttpStatus.FORBIDDEN,
      message: ErrorMessages[ErrorCode.FORM_UNAUTHORIZED],
      error: ErrorCode.FORM_UNAUTHORIZED,
      timestamp: new Date().toISOString(),
    } as ErrorResponse);
  }
}

// ==================== SUBMISSION EXCEPTIONS ====================

export class SubmissionNotFoundException extends NotFoundException {
  constructor(submissionId?: string) {
    const message = submissionId
      ? `Resposta ${submissionId} não encontrada`
      : ErrorMessages[ErrorCode.SUBMISSION_NOT_FOUND];
    super({
      statusCode: HttpStatus.NOT_FOUND,
      message,
      error: ErrorCode.SUBMISSION_NOT_FOUND,
      timestamp: new Date().toISOString(),
    } as ErrorResponse);
  }
}

export class SubmissionDuplicateException extends ConflictException {
  constructor() {
    super({
      statusCode: HttpStatus.CONFLICT,
      message: ErrorMessages[ErrorCode.SUBMISSION_DUPLICATE],
      error: ErrorCode.SUBMISSION_DUPLICATE,
      timestamp: new Date().toISOString(),
    } as ErrorResponse);
  }
}

// ==================== VALIDATION EXCEPTIONS ====================

export class ValidationException extends BadRequestException {
  constructor(message?: string) {
    const errorMessage = message || ErrorMessages[ErrorCode.VALIDATION_ERROR];
    super({
      statusCode: HttpStatus.BAD_REQUEST,
      message: errorMessage,
      error: ErrorCode.VALIDATION_ERROR,
      timestamp: new Date().toISOString(),
    } as ErrorResponse);
  }
}
