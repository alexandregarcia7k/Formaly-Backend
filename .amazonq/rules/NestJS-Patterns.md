# Padrões NestJS - Guia Prático

Este documento contém exemplos práticos de como implementar cada camada no NestJS seguindo Clean Architecture.

---

## 📁 Estrutura de um Módulo Completo

```
src/modules/forms/
├── forms.module.ts          # Configuração do módulo
├── forms.controller.ts      # Rotas HTTP
├── forms.service.ts         # Lógica de negócio
├── forms.repository.ts      # Acesso ao banco
├── dto/
│   ├── create-form.dto.ts   # DTO de criação
│   ├── update-form.dto.ts   # DTO de atualização
│   └── form-response.dto.ts # DTO de resposta
├── entities/
│   └── form.entity.ts       # Entidade (opcional)
└── forms.controller.spec.ts # Testes
```

---

## 1️⃣ Module (forms.module.ts)

```typescript
import { Module } from '@nestjs/common'
import { FormsController } from './forms.controller'
import { FormsService } from './forms.service'
import { FormsRepository } from './forms.repository'
import { PrismaModule } from '@/prisma/prisma.module'
import { UsersModule } from '@/modules/users/users.module'

@Module({
  imports: [
    PrismaModule,    // Importar módulos necessários
    UsersModule,     // Se precisar do UsersService
  ],
  controllers: [FormsController],
  providers: [
    FormsService,
    FormsRepository,
  ],
  exports: [FormsService], // Exportar se outros módulos precisarem
})
export class FormsModule {}
```

**Explicação:**
- `imports`: Módulos que este módulo precisa
- `controllers`: Controllers deste módulo
- `providers`: Services e Repositories (injetáveis)
- `exports`: O que outros módulos podem usar

---

## 2️⃣ Controller (forms.controller.ts)

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { FormsService } from './forms.service'
import { CreateFormDto } from './dto/create-form.dto'
import { UpdateFormDto } from './dto/update-form.dto'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'
import { CurrentUser } from '@/common/decorators/current-user.decorator'
import { User } from '@prisma/client'

@ApiTags('forms')
@Controller('api/forms')
@UseGuards(JwtAuthGuard) // Proteger todas as rotas
@ApiBearerAuth()
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new form' })
  @ApiResponse({ status: 201, description: 'Form created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(
    @Body() createFormDto: CreateFormDto,
    @CurrentUser() user: User,
  ) {
    return this.formsService.create(createFormDto, user.id)
  }

  @Get()
  @ApiOperation({ summary: 'List all forms' })
  async findAll(
    @CurrentUser() user: User,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.formsService.findAll(user.id, page, limit)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get form by ID' })
  @ApiResponse({ status: 404, description: 'Form not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.formsService.findOne(id, user.id)
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update form' })
  async update(
    @Param('id') id: string,
    @Body() updateFormDto: UpdateFormDto,
    @CurrentUser() user: User,
  ) {
    return this.formsService.update(id, updateFormDto, user.id)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete form' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    await this.formsService.remove(id, user.id)
  }
}
```

**Responsabilidades do Controller:**
- ✅ Definir rotas HTTP
- ✅ Validar entrada (DTOs)
- ✅ Extrair dados da request (params, query, body)
- ✅ Chamar o Service
- ✅ Retornar resposta HTTP
- ❌ NUNCA conter lógica de negócio
- ❌ NUNCA acessar banco diretamente

---

## 3️⃣ Service (forms.service.ts)

```typescript
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { FormsRepository } from './forms.repository'
import { CreateFormDto } from './dto/create-form.dto'
import { UpdateFormDto } from './dto/update-form.dto'
import { Form } from '@prisma/client'
import { randomBytes } from 'crypto'
import * as bcrypt from 'bcrypt'

@Injectable()
export class FormsService {
  constructor(
    private readonly formsRepository: FormsRepository,
  ) {}

  async create(dto: CreateFormDto, userId: string): Promise<Form> {
    // Lógica de negócio: gerar slug único
    const slug = this.generateSlug(dto.name)

    // Lógica de negócio: hash da senha se fornecida
    const passwordHash = dto.password
      ? await bcrypt.hash(dto.password, 10)
      : undefined

    // Validação de negócio: campos select devem ter options
    this.validateFields(dto.fields)

    // Delegar persistência ao repository
    return this.formsRepository.create({
      name: dto.name,
      description: dto.description,
      slug,
      passwordHash,
      fields: dto.fields,
      userId,
    })
  }

  async findAll(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit

    const [forms, total] = await Promise.all([
      this.formsRepository.findByUserId(userId, skip, limit),
      this.formsRepository.countByUserId(userId),
    ])

    return {
      data: forms,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async findOne(id: string, userId: string): Promise<Form> {
    const form = await this.formsRepository.findById(id)

    if (!form) {
      throw new NotFoundException(`Form with ID ${id} not found`)
    }

    // Validação de negócio: usuário só pode ver seus próprios forms
    if (form.userId !== userId) {
      throw new ForbiddenException('You do not have access to this form')
    }

    return form
  }

  async update(id: string, dto: UpdateFormDto, userId: string): Promise<Form> {
    // Verificar se form existe e pertence ao usuário
    await this.findOne(id, userId)

    // Hash da senha se foi alterada
    const passwordHash = dto.password
      ? await bcrypt.hash(dto.password, 10)
      : undefined

    // Validar campos se foram alterados
    if (dto.fields) {
      this.validateFields(dto.fields)
    }

    return this.formsRepository.update(id, {
      ...dto,
      passwordHash,
    })
  }

  async remove(id: string, userId: string): Promise<void> {
    // Verificar se form existe e pertence ao usuário
    await this.findOne(id, userId)

    // Soft delete
    await this.formsRepository.softDelete(id)
  }

  // Métodos privados de lógica de negócio
  private generateSlug(name: string): string {
    const baseSlug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/-+/g, '-') // Remove hífens duplicados
      .trim()

    const randomSuffix = randomBytes(4).toString('hex')
    return `${baseSlug}-${randomSuffix}`
  }

  private validateFields(fields: any[]): void {
    for (const field of fields) {
      if (['select', 'radio', 'checkbox'].includes(field.type)) {
        if (!field.options || field.options.length === 0) {
          throw new BadRequestException(
            `Field "${field.label}" of type "${field.type}" must have options`
          )
        }
      }
    }
  }
}
```

**Responsabilidades do Service:**
- ✅ Toda lógica de negócio
- ✅ Validações de regras de negócio
- ✅ Orquestrar chamadas a repositories
- ✅ Transformações de dados
- ✅ Lançar exceções de negócio
- ❌ NUNCA acessar banco diretamente
- ❌ NUNCA conhecer detalhes HTTP

---

## 4️⃣ Repository (forms.repository.ts)

```typescript
import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/prisma/prisma.service'
import { Form, Prisma } from '@prisma/client'

@Injectable()
export class FormsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.FormCreateInput): Promise<Form> {
    return this.prisma.form.create({ data })
  }

  async findById(id: string): Promise<Form | null> {
    return this.prisma.form.findUnique({
      where: { id },
      include: {
        _count: {
          select: { responses: true },
        },
      },
    })
  }

  async findBySlug(slug: string): Promise<Form | null> {
    return this.prisma.form.findUnique({
      where: { slug },
    })
  }

  async findByUserId(
    userId: string,
    skip: number,
    take: number,
  ): Promise<Form[]> {
    return this.prisma.form.findMany({
      where: {
        userId,
        deletedAt: null, // Excluir deletados
      },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        slug: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { responses: true },
        },
      },
    })
  }

  async countByUserId(userId: string): Promise<number> {
    return this.prisma.form.count({
      where: {
        userId,
        deletedAt: null,
      },
    })
  }

  async update(id: string, data: Prisma.FormUpdateInput): Promise<Form> {
    return this.prisma.form.update({
      where: { id },
      data,
    })
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.form.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }

  async hardDelete(id: string): Promise<void> {
    await this.prisma.form.delete({
      where: { id },
    })
  }
}
```

**Responsabilidades do Repository:**
- ✅ Apenas operações de banco
- ✅ Queries Prisma
- ✅ Mapeamento de dados
- ✅ Otimizações de query (select, include)
- ❌ NUNCA conter lógica de negócio
- ❌ NUNCA lançar exceções de negócio (apenas de banco)

---

## 5️⃣ DTOs com Zod (dto/create-form.dto.ts)

```typescript
import { z } from 'zod'
import { createZodDto } from 'nestjs-zod'

// Schema Zod para validação
const fieldSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['text', 'email', 'phone', 'textarea', 'number', 'date', 'select', 'radio', 'checkbox']),
  label: z.string().min(1, 'Label is required'),
  placeholder: z.string().optional(),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
})

export const createFormSchema = z.object({
  name: z.string()
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name must be at most 100 characters'),
  description: z.string()
    .max(500, 'Description must be at most 500 characters')
    .optional(),
  password: z.string()
    .min(4, 'Password must be at least 4 characters')
    .max(8, 'Password must be at most 8 characters')
    .optional(),
  fields: z.array(fieldSchema)
    .min(1, 'At least one field is required'),
})

// DTO para NestJS
export class CreateFormDto extends createZodDto(createFormSchema) {}

// Tipo TypeScript inferido
export type CreateFormInput = z.infer<typeof createFormSchema>
```

**DTO de Update (dto/update-form.dto.ts):**

```typescript
import { z } from 'zod'
import { createZodDto } from 'nestjs-zod'
import { createFormSchema } from './create-form.dto'

// Todos os campos opcionais
export const updateFormSchema = createFormSchema.partial().extend({
  status: z.enum(['active', 'inactive']).optional(),
})

export class UpdateFormDto extends createZodDto(updateFormSchema) {}
```

---

## 6️⃣ Guards (common/guards/jwt-auth.guard.ts)

```typescript
import { Injectable, ExecutionContext } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { Reflector } from '@nestjs/core'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super()
  }

  canActivate(context: ExecutionContext) {
    // Verificar se rota é pública
    const isPublic = this.reflector.get<boolean>(
      'isPublic',
      context.getHandler(),
    )

    if (isPublic) {
      return true
    }

    return super.canActivate(context)
  }
}
```

**Decorator para rotas públicas:**

```typescript
import { SetMetadata } from '@nestjs/common'

export const Public = () => SetMetadata('isPublic', true)
```

**Uso:**

```typescript
@Controller('f')
export class PublicFormsController {
  @Get(':slug')
  @Public() // Rota pública
  async findBySlug(@Param('slug') slug: string) {
    return this.publicFormsService.findBySlug(slug)
  }
}
```

---

## 7️⃣ Custom Decorators (common/decorators/current-user.decorator.ts)

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { User } from '@prisma/client'

export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    const user = request.user

    return data ? user?.[data] : user
  },
)
```

**Uso:**

```typescript
@Get()
async findAll(@CurrentUser() user: User) {
  // user completo
}

@Get()
async findAll(@CurrentUser('id') userId: string) {
  // apenas user.id
}
```

---

## 8️⃣ Exception Filters (common/filters/prisma-exception.filter.ts)

```typescript
import { Catch, ExceptionFilter, ArgumentsHost, HttpStatus } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { FastifyReply } from 'fastify'

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<FastifyReply>()

    switch (exception.code) {
      case 'P2002': // Unique constraint violation
        return response.status(HttpStatus.CONFLICT).send({
          statusCode: HttpStatus.CONFLICT,
          message: 'Resource already exists',
          error: 'Conflict',
        })

      case 'P2025': // Record not found
        return response.status(HttpStatus.NOT_FOUND).send({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Resource not found',
          error: 'Not Found',
        })

      default:
        return response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
          error: 'Internal Server Error',
        })
    }
  }
}
```

**Registrar no main.ts:**

```typescript
app.useGlobalFilters(new PrismaExceptionFilter())
```

---

## 9️⃣ Prisma Service (prisma/prisma.service.ts)

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect()
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}
```

**Prisma Module (prisma/prisma.module.ts):**

```typescript
import { Global, Module } from '@nestjs/common'
import { PrismaService } from './prisma.service'

@Global() // Disponível em todos os módulos
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

---

## 🔟 Main.ts (Bootstrap)

```typescript
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { ZodValidationPipe } from 'nestjs-zod'
import { AppModule } from './app.module'
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter'

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  )

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })

  // Validation Pipe (Zod)
  app.useGlobalPipes(new ZodValidationPipe())

  // Exception Filters
  app.useGlobalFilters(new PrismaExceptionFilter())

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Formaly API')
    .setDescription('API for Formaly form builder')
    .setVersion('1.0')
    .addBearerAuth()
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api', app, document)

  const port = process.env.PORT || 3333
  await app.listen(port, '0.0.0.0')

  console.log(`🚀 Server running on http://localhost:${port}`)
  console.log(`📚 Swagger docs on http://localhost:${port}/api`)
}

bootstrap()
```

---

## 📝 Resumo da Arquitetura

```
Request → Controller → Service → Repository → Prisma → Database
                ↓         ↓          ↓
              DTO    Business    Query
                    Logic
```

**Fluxo de Dados:**
1. **Request** chega no Controller
2. **Controller** valida com DTO (Zod)
3. **Controller** chama Service
4. **Service** executa lógica de negócio
5. **Service** chama Repository
6. **Repository** executa query Prisma
7. **Prisma** acessa Database
8. Dados retornam na ordem inversa

**Princípios:**
- ✅ Cada camada tem uma responsabilidade
- ✅ Dependency Injection em todas as camadas
- ✅ Tipos TypeScript estritos
- ✅ Validação com Zod
- ✅ Tratamento de erros adequado
- ✅ Código testável e manutenível
