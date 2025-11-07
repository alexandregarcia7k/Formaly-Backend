import { NestFactory } from '@nestjs/core';
// Importamos o Adaptador do Fastify e os tipos necessários
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
  // 1. Criamos uma instância do adaptador do Fastify.
  const adapter = new FastifyAdapter();

  // 2. Passamos o adaptador para o NestFactory ao criar a aplicação.
  //    O tipo <NestFastifyApplication> garante a tipagem correta.
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    adapter,
  );

  // 3. Iniciamos o servidor na porta 3333, como planejamos.
  await app.listen(3333, '0.0.0.0'); // Usar '0.0.0.0' garante que seja acessível na sua rede local.
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();