import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { FastifyReply } from 'fastify';
import { ErrorCode, ErrorResponse } from '../types/error-response.type';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(
    exception: Prisma.PrismaClientKnownRequestError,
    host: ArgumentsHost,
  ): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest();

    const errorResponse: ErrorResponse = {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Erro interno do servidor',
      error: ErrorCode.DATABASE_ERROR,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    switch (exception.code) {
      case 'P2002': { // Unique constraint violation
        errorResponse.statusCode = HttpStatus.CONFLICT;
        errorResponse.error = ErrorCode.DUPLICATE_RECORD;
        
        const target = exception.meta?.target as string[] | undefined;
        if (target?.includes('name') && target?.includes('userId')) {
          errorResponse.message = 'Você já possui um formulário com este nome';
        } else {
          errorResponse.message = 'Registro duplicado';
        }
        break;
      }

      case 'P2025': // Record not found
        errorResponse.statusCode = HttpStatus.NOT_FOUND;
        errorResponse.message = 'Registro não encontrado';
        errorResponse.error = ErrorCode.RECORD_NOT_FOUND;
        break;

      case 'P2003': // Foreign key constraint violation
        errorResponse.statusCode = HttpStatus.BAD_REQUEST;
        errorResponse.message = 'Violação de integridade';
        errorResponse.error = ErrorCode.FOREIGN_KEY_VIOLATION;
        break;

      default:
        // Log erro interno para debug (não expor ao cliente)
        console.error('Prisma Error:', {
          code: exception.code,
          message: exception.message,
          meta: exception.meta,
        });
        break;
    }

    response.status(errorResponse.statusCode).send(errorResponse);
  }
}
