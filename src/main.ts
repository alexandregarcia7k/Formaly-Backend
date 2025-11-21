import { NestFactory, Reflector } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import {
  HttpExceptionFilter,
  AllExceptionsFilter,
} from './common/filters/http-exception.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import fastifyCookie from '@fastify/cookie';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  // Registrar plugin de cookies
  await app.register(fastifyCookie, {
    secret: process.env.COOKIE_SECRET || process.env.JWT_SECRET,
  });

  // Configurar CORS para aceitar cookies
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Adiciona o Pipe de validação do Zod globalmente.
  // Isso garante que todos os DTOs baseados em Zod serão validados.
  app.useGlobalPipes(new ZodValidationPipe());

  // Adiciona filtros de exceção globalmente (ordem importa: mais específico primeiro)
  app.useGlobalFilters(
    new AllExceptionsFilter(), // Catch-all para erros não tratados
    new HttpExceptionFilter(), // Exceções HTTP customizadas
    new PrismaExceptionFilter(), // Erros do Prisma
  );

  // Adiciona JwtAuthGuard globalmente.
  // Protege todas as rotas por padrão, exceto as marcadas com @Public().
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  // Configuração do Swagger para documentação da API (apenas em desenvolvimento).
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Formaly API')
      .setDescription('API para o sistema de formulários Formaly')
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

  // Inicia o servidor na porta 3333, escutando em todas as interfaces.
  await app.listen(3333, '0.0.0.0');
  console.log(`🚀 Server running on http://localhost:3333`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`📚 Swagger docs on http://localhost:3333/api`);
  }
}

// Chama a função bootstrap e captura possíveis erros.
bootstrap().catch((err) => {
  console.error('Erro ao inicializar a aplicação:', err);
  process.exit(1);
});
