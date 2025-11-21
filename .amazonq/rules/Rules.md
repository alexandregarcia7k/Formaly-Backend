# Regras de Boas Práticas - Formaly Backend

## 🚨 VALIDAÇÃO COMPLETA

**Para revisar código antes de commit/PR, use:**
```
.amazonq/rules/VALIDATION_CHECKLIST.md
```

Este arquivo contém checklist completo com:
- Clean Architecture obrigatória
- Campos que existem/não existem no schema
- Erros críticos comuns
- Anti-patterns a evitar
- Prompt específico para Amazon Q

---

## Stack do Projeto
- NestJS 11.0.1
- Fastify 11.1.8
- Prisma 6.19.0
- TypeScript 5.7.3
- Zod 4.1.12
- PostgreSQL (Neon Serverless)

---

## 🎯 Objetivo de Aprendizado

Este projeto é para **aprender backend**, focando em:
- Clean Architecture
- Dependency Injection (DI)
- Padrões do NestJS
- TypeScript tipado corretamente
- SOLID principles
- **EVITAR over-engineering**

---

## 🏗️ Clean Architecture - Regras Obrigatórias

### 1. Estrutura de Camadas

```
Controller → Service → Repository → Database
```

**Controller (Camada de Apresentação)**
- ✅ Apenas roteamento HTTP
- ✅ Validação de entrada (DTOs)
- ✅ Retornar respostas HTTP
- ❌ NUNCA conter lógica de negócio
- ❌ NUNCA acessar banco diretamente

**Service (Camada de Negócio)**
- ✅ Toda lógica de negócio aqui
- ✅ Orquestrar chamadas a repositories
- ✅ Validações de regras de negócio
- ❌ NUNCA acessar banco diretamente
- ❌ NUNCA conhecer detalhes HTTP

**Repository (Camada de Dados)**
- ✅ Apenas operações de banco
- ✅ Queries Prisma
- ✅ Mapeamento de entidades
- ❌ NUNCA conter lógica de negócio
- ❌ NUNCA conhecer HTTP

### 2. Exemplo Prático

```typescript
// ❌ ERRADO - Controller com lógica de negócio
@Controller('forms')
export class FormsController {
  constructor(private prisma: PrismaService) {}

  @Post()
  async create(@Body() dto: CreateFormDto) {
    const slug = dto.name.toLowerCase().replace(/\s/g, '-') + '-' + Math.random()
    return this.prisma.form.create({ data: { ...dto, slug } })
  }
}

// ✅ CORRETO - Separação de responsabilidades
@Controller('forms')
export class FormsController {
  constructor(private formsService: FormsService) {}

  @Post()
  async create(@Body() dto: CreateFormDto) {
    return this.formsService.create(dto)
  }
}

@Injectable()
export class FormsService {
  constructor(private formsRepository: FormsRepository) {}

  async create(dto: CreateFormDto) {
    const slug = this.generateSlug(dto.name)
    return this.formsRepository.create({ ...dto, slug })
  }

  private generateSlug(name: string): string {
    return name.toLowerCase().replace(/\s/g, '-') + '-' + randomBytes(4).toString('hex')
  }
}

@Injectable()
export class FormsRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateFormData) {
    return this.prisma.form.create({ data })
  }
}
```

---

## 💉 Dependency Injection - Regras Obrigatórias

### 1. Constructor Injection (Sempre)

```typescript
// ✅ CORRETO
@Injectable()
export class FormsService {
  constructor(
    private readonly formsRepository: FormsRepository,
    private readonly usersRepository: UsersRepository,
  ) {}
}

// ❌ ERRADO - Não instanciar manualmente
@Injectable()
export class FormsService {
  private formsRepository = new FormsRepository()
}
```

### 2. Providers no Module

```typescript
// ✅ CORRETO
@Module({
  controllers: [FormsController],
  providers: [FormsService, FormsRepository],
  exports: [FormsService], // Exportar se usado em outros módulos
})
export class FormsModule {}
```

### 3. Escopo de Providers

```typescript
// ✅ PADRÃO - Singleton (recomendado)
@Injectable()
export class FormsService {}

// ⚠️ USAR APENAS SE NECESSÁRIO - Request-scoped
@Injectable({ scope: Scope.REQUEST })
export class RequestScopedService {}
```

---

## 📦 Módulos NestJS - Regras

### 1. Um Módulo por Feature

```
src/modules/
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── dto/
├── forms/
│   ├── forms.module.ts
│   ├── forms.controller.ts
│   ├── forms.service.ts
│   ├── forms.repository.ts
│   └── dto/
└── users/
    ├── users.module.ts
    ├── users.service.ts
    ├── users.repository.ts
    └── dto/
```

### 2. Imports e Exports

```typescript
// ✅ CORRETO
@Module({
  imports: [UsersModule], // Importar módulos necessários
  controllers: [FormsController],
  providers: [FormsService, FormsRepository],
  exports: [FormsService], // Exportar para outros módulos
})
export class FormsModule {}
```

### 3. Módulos Globais (Usar com Moderação)

```typescript
// ✅ CORRETO - Apenas para serviços realmente globais
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

---

## 🔒 TypeScript - Regras Estritas

### 1. NUNCA Usar `any`

```typescript
// ❌ ERRADO
function process(data: any) {
  return data.value
}

// ✅ CORRETO - Usar tipos específicos
function process(data: { value: string }) {
  return data.value
}

// ✅ CORRETO - Usar generics
function process<T>(data: T): T {
  return data
}

// ✅ CORRETO - Usar unknown se realmente não souber
function process(data: unknown) {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return (data as { value: string }).value
  }
}
```

### 2. Interfaces vs Types

```typescript
// ✅ CORRETO - Interface para objetos
interface User {
  id: string
  email: string
  name: string
}

// ✅ CORRETO - Type para unions, intersections
type FormStatus = 'active' | 'inactive'
type UserWithForms = User & { forms: Form[] }
```

### 3. Tipos de Retorno Explícitos

```typescript
// ✅ CORRETO - Sempre declarar tipo de retorno
async function findUser(id: string): Promise<User | null> {
  return this.prisma.user.findUnique({ where: { id } })
}

// ❌ EVITE - Inferência pode esconder erros
async function findUser(id: string) {
  return this.prisma.user.findUnique({ where: { id } })
}
```

### 4. Strict Mode Sempre Ativo

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitAny": true,
    "noImplicitThis": true
  }
}
```

---

## 📝 DTOs com Zod - Regras

### 1. Criar Schema Zod Primeiro

```typescript
// ✅ CORRETO
import { z } from 'zod'
import { createZodDto } from 'nestjs-zod'

// 1. Criar schema Zod
const createFormSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  password: z.string().min(4).max(8).optional(),
  fields: z.array(
    z.object({
      id: z.string().uuid(),
      type: z.enum(['text', 'email', 'select', 'checkbox']),
      label: z.string().min(1),
      required: z.boolean(),
      options: z.array(z.string()).optional(),
    })
  ).min(1),
})

// 2. Criar DTO a partir do schema
export class CreateFormDto extends createZodDto(createFormSchema) {}

// 3. Inferir tipo TypeScript
export type CreateFormInput = z.infer<typeof createFormSchema>
```

### 2. Reutilizar Schemas

```typescript
// ✅ CORRETO - Schemas compostos
const fieldSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['text', 'email', 'select']),
  label: z.string().min(1),
  required: z.boolean(),
})

const createFormSchema = z.object({
  name: z.string().min(3),
  fields: z.array(fieldSchema).min(1),
})

const updateFormSchema = createFormSchema.partial() // Todos campos opcionais
```

### 3. Validação Customizada

```typescript
// ✅ CORRETO
const createFormSchema = z.object({
  name: z.string().min(3),
  fields: z.array(fieldSchema).min(1),
}).refine(
  (data) => {
    // Validação customizada: select deve ter options
    return data.fields.every(field => 
      field.type !== 'select' || (field.options && field.options.length > 0)
    )
  },
  { message: 'Select fields must have options' }
)
```

---

## 🗄️ Prisma - Regras

### 1. Um Repository por Model

```typescript
// ✅ CORRETO
@Injectable()
export class FormsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.FormCreateInput): Promise<Form> {
    return this.prisma.form.create({ data })
  }

  async findById(id: string): Promise<Form | null> {
    return this.prisma.form.findUnique({ where: { id } })
  }

  async findByUserId(userId: string): Promise<Form[]> {
    return this.prisma.form.findMany({ where: { userId } })
  }
}
```

### 2. Usar Tipos do Prisma

```typescript
// ✅ CORRETO - Usar tipos gerados pelo Prisma
import { Form, Prisma } from '@prisma/client'

async create(data: Prisma.FormCreateInput): Promise<Form> {
  return this.prisma.form.create({ data })
}

// ❌ ERRADO - Criar tipos manualmente
async create(data: { name: string; userId: string }): Promise<any> {
  return this.prisma.form.create({ data })
}
```

### 3. Transações para Operações Complexas

```typescript
// ✅ CORRETO
async createFormWithResponses(formData: CreateFormData) {
  return this.prisma.$transaction(async (tx) => {
    const form = await tx.form.create({ data: formData })
    await tx.formResponse.createMany({ data: responses })
    return form
  })
}
```

### 4. Soft Delete

```typescript
// ✅ CORRETO - Soft delete
async delete(id: string): Promise<void> {
  await this.prisma.form.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
}

// Filtrar deletados nas queries
async findAll(): Promise<Form[]> {
  return this.prisma.form.findMany({
    where: { deletedAt: null },
  })
}
```

---

## 🔐 Autenticação e Autorização

### 1. JWT Strategy

```typescript
// ✅ CORRETO
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    })
  }

  async validate(payload: JwtPayload): Promise<User> {
    return { id: payload.sub, email: payload.email }
  }
}
```

### 2. Auth Guard

```typescript
// ✅ CORRETO
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

// Usar no controller
@Controller('forms')
@UseGuards(JwtAuthGuard)
export class FormsController {}
```

### 3. Custom Decorator para User

```typescript
// ✅ CORRETO
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest()
    return request.user
  },
)

// Usar no controller
@Get()
async findAll(@CurrentUser() user: User) {
  return this.formsService.findByUserId(user.id)
}
```

---

## 🚨 Tratamento de Erros

### 1. Exception Filters

```typescript
// ✅ CORRETO
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse()

    if (exception.code === 'P2002') {
      return response.status(409).json({
        statusCode: 409,
        message: 'Resource already exists',
      })
    }

    return response.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
    })
  }
}
```

### 2. Custom Exceptions

```typescript
// ✅ CORRETO
export class FormNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Form with ID ${id} not found`)
  }
}

// Usar no service
async findById(id: string): Promise<Form> {
  const form = await this.formsRepository.findById(id)
  if (!form) {
    throw new FormNotFoundException(id)
  }
  return form
}
```

---

## 📚 Documentação com Swagger

### 1. Decorators no Controller

```typescript
// ✅ CORRETO
@ApiTags('forms')
@Controller('forms')
export class FormsController {
  @Post()
  @ApiOperation({ summary: 'Create a new form' })
  @ApiResponse({ status: 201, description: 'Form created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(@Body() dto: CreateFormDto) {
    return this.formsService.create(dto)
  }
}
```

### 2. Schemas no DTO

```typescript
// ✅ CORRETO
export class CreateFormDto {
  @ApiProperty({ example: 'Customer Registration' })
  name: string

  @ApiProperty({ example: 'Form for new customers', required: false })
  description?: string
}
```

---

## 🧪 Testes (Quando Implementar)

### 1. Estrutura de Testes

```typescript
// ✅ CORRETO
describe('FormsService', () => {
  let service: FormsService
  let repository: FormsRepository

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        FormsService,
        {
          provide: FormsRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<FormsService>(FormsService)
    repository = module.get<FormsRepository>(FormsRepository)
  })

  it('should create a form', async () => {
    const dto = { name: 'Test Form', fields: [] }
    jest.spyOn(repository, 'create').mockResolvedValue(mockForm)

    const result = await service.create(dto)

    expect(result).toEqual(mockForm)
    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining(dto))
  })
})
```

---

## 🚀 Performance e Otimização

### 1. Queries Eficientes

```typescript
// ✅ CORRETO - Selecionar apenas campos necessários
async findAll(): Promise<Form[]> {
  return this.prisma.form.findMany({
    select: {
      id: true,
      name: true,
      status: true,
      _count: { select: { responses: true } },
    },
  })
}

// ❌ EVITE - Buscar tudo
async findAll(): Promise<Form[]> {
  return this.prisma.form.findMany()
}
```

### 2. Paginação

```typescript
// ✅ CORRETO
async findAll(page: number, limit: number) {
  const skip = (page - 1) * limit

  const [data, total] = await Promise.all([
    this.prisma.form.findMany({ skip, take: limit }),
    this.prisma.form.count(),
  ])

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}
```

---

## 🔧 Configuração

### 1. Variáveis de Ambiente

```typescript
// ✅ CORRETO - Validar com Zod
import { z } from 'zod'

const envSchema = z.object({
  PORT: z.string().default('3333'),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('7d'),
})

export const env = envSchema.parse(process.env)
```

### 2. ConfigModule

```typescript
// ✅ CORRETO
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => envSchema.parse(config),
    }),
  ],
})
export class AppModule {}
```

---

## ⚠️ Anti-Patterns (EVITAR)

### 1. God Classes

```typescript
// ❌ ERRADO - Service fazendo tudo
@Injectable()
export class FormsService {
  async create() {}
  async update() {}
  async delete() {}
  async sendEmail() {}
  async generatePDF() {}
  async uploadToS3() {}
}

// ✅ CORRETO - Separar responsabilidades
@Injectable()
export class FormsService {
  constructor(
    private formsRepository: FormsRepository,
    private emailService: EmailService,
    private pdfService: PdfService,
  ) {}
}
```

### 2. Circular Dependencies

```typescript
// ❌ ERRADO
@Injectable()
export class FormsService {
  constructor(private usersService: UsersService) {}
}

@Injectable()
export class UsersService {
  constructor(private formsService: FormsService) {}
}

// ✅ CORRETO - Usar forwardRef ou refatorar
@Injectable()
export class FormsService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
  ) {}
}
```

---

## 📋 Checklist de PR

- [ ] Código segue Clean Architecture (Controller → Service → Repository)
- [ ] Dependency Injection usado corretamente
- [ ] TypeScript sem `any` ou `unknown` desnecessários
- [ ] DTOs validados com Zod
- [ ] Tipos de retorno explícitos
- [ ] Tratamento de erros adequado
- [ ] Queries Prisma otimizadas
- [ ] Documentação Swagger atualizada
- [ ] Testes unitários (quando aplicável)
- [ ] Sem over-engineering

---

## 🎓 Recursos de Aprendizado

### Documentação Oficial
- [NestJS Docs](https://docs.nestjs.com)
- [Prisma Docs](https://www.prisma.io/docs)
- [Zod Docs](https://zod.dev)

### Conceitos Importantes
- Clean Architecture
- SOLID Principles
- Dependency Injection
- Repository Pattern
- DTO Pattern

---

## 💡 Dicas Finais

1. **Sempre consulte a documentação oficial do NestJS** antes de implementar
2. **Comece simples**, adicione complexidade apenas quando necessário
3. **Teste localmente** antes de fazer commit
4. **Peça explicações** sobre decisões de arquitetura
5. **Evite copiar código** sem entender o que faz
6. **Refatore** quando identificar code smells
7. **Documente** decisões importantes no código
