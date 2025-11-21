import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';
import type { ErrorResponse } from '../types/error-response.type';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Se já é ErrorResponse customizado, usar direto
    if (
      typeof exceptionResponse === 'object' &&
      'error' in exceptionResponse &&
      'timestamp' in exceptionResponse
    ) {
      response.status(status).send(exceptionResponse);
      return;
    }

    // Fallback para exceções genéricas
    const errorResponse: ErrorResponse = {
      statusCode: status,
      message:
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message || 'Erro interno do servidor',
      error: `HTTP_${status}`,
      timestamp: new Date().toISOString(),
    };

    response.status(status).send(errorResponse);
  }
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof Error
        ? exception.message
        : 'Erro interno do servidor';

    const errorResponse: ErrorResponse = {
      statusCode: status,
      message,
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString(),
    };

    // Log do erro (em produção, usar logger apropriado)
    console.error('Unhandled exception:', exception);

    response.status(status).send(errorResponse);
  }
}
