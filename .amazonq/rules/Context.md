# CONTEXTO TÉCNICO DO PROJETO: FORMALY BACKEND

## 1. Visão Geral

Formaly Backend é a API REST do sistema de criação e gerenciamento de formulários online. Construído com NestJS + Fastify + Prisma, fornece endpoints para autenticação, CRUD de formulários, coleta de respostas e analytics.

**Objetivo de Aprendizado**: Implementar backend seguindo Clean Architecture, SOLID, DI (Dependency Injection) e padrões do NestJS, sem over-engineering.

## 2. Funcionalidades Principais

### 2.1. Landing Page (Pública)
- Apresentação da plataforma
- Call-to-action para cadastro/login
- Informações sobre recursos

### 2.2. Autenticação
- Sistema de login via **Auth.js** (NextAuth.js)
- Provedores OAuth (Google, GitHub, etc.)
- Sessões gerenciadas pelo Auth.js

### 2.3. Área Autenticada
- **Dashboard**: Lista de formulários criados
- **Form Builder**: Editor drag-and-drop para criar formulários
- **Gerenciamento**: Editar, duplicar, excluir formulários
- **Respostas**: Visualizar respostas coletadas
- **Exportação**: CSV, Excel, JSON
- **Tema**: Toggle dark/light mode

### 2.4. Formulários Públicos
- Link único por formulário
- Acesso sem autenticação para preenchimento
- Validação de campos
- Confirmação de envio
- Suporte a dark/light mode

## 3. Arquitetura

### 3.1. Polyrepo
- `formaly-frontend`: Interface do usuário (Next.js)
- `formaly-backend`: API de dados (NestJS)

### 3.2. Fluxo de Dados
```
Usuário → Frontend (Next.js) → Backend (NestJS) → Database (PostgreSQL)
```

## 4. Stack Tecnológica

### 4.1. Frontend
- **Framework**: Next.js 16.0.1 (App Router)
- **UI**: React 19.2.0
- **Estilização**: Tailwind CSS 4.x
- **Componentes**: Shadcn/ui (style: new-york)
- **Autenticação**: Auth.js (NextAuth.js)
- **Validação**: Zod
- **Ícones**: Lucide React
- **Hospedagem**: Vercel

### 4.2. Backend (Este Projeto)
- **Framework**: NestJS 11.0.1
- **HTTP**: Fastify 11.1.8 (mais rápido que Express)
- **ORM**: Prisma 6.19.0
- **Database**: PostgreSQL (Neon Serverless)
- **Validação**: Zod 4.1.12 + nestjs-zod 5.0.1
- **Documentação**: Swagger 11.2.1
- **Autenticação**: JWT (a implementar)
- **Hash**: bcrypt (para senhas de formulários)
- **Hospedagem**: Railway ou Render

## 5. Estrutura do Backend (Clean Architecture)

```
src/
├── main.ts                    # Bootstrap da aplicação
├── app.module.ts              # Módulo raiz
├── common/                    # Código compartilhado
│   ├── decorators/            # Custom decorators
│   ├── filters/               # Exception filters
│   ├── guards/                # Auth guards
│   ├── interceptors/          # Interceptors
│   ├── pipes/                 # Validation pipes
│   └── types/                 # Tipos compartilhados
├── config/                    # Configurações
│   ├── database.config.ts
│   ├── jwt.config.ts
│   └── app.config.ts
├── modules/
│   ├── auth/                  # Módulo de autenticação
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   ├── dto/               # DTOs (Zod schemas)
│   │   ├── strategies/        # JWT strategies
│   │   └── guards/            # Auth guards
│   ├── users/                 # Módulo de usuários
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.repository.ts
│   │   ├── users.module.ts
│   │   ├── dto/
│   │   └── entities/
│   ├── forms/                 # Módulo de formulários
│   │   ├── forms.controller.ts
│   │   ├── forms.service.ts
│   │   ├── forms.repository.ts
│   │   ├── forms.module.ts
│   │   ├── dto/
│   │   └── entities/
│   ├── responses/             # Módulo de respostas
│   │   ├── responses.controller.ts
│   │   ├── responses.service.ts
│   │   ├── responses.repository.ts
│   │   ├── responses.module.ts
│   │   ├── dto/
│   │   └── entities/
│   ├── dashboard/             # Módulo de analytics
│   │   ├── dashboard.controller.ts
│   │   ├── dashboard.service.ts
│   │   ├── dashboard.module.ts
│   │   └── dto/
│   └── public-forms/          # Formulários públicos (sem auth)
│       ├── public-forms.controller.ts
│       ├── public-forms.service.ts
│       ├── public-forms.module.ts
│       └── dto/
└── prisma/
    ├── schema.prisma          # Schema do banco
    └── migrations/            # Migrations
```

## 6. Estrutura do Frontend (Referência)

```
src/
├── app/
│   ├── (public)/          # Landing page
│   ├── (auth)/            # Login/Cadastro
│   ├── (dashboard)/       # Área autenticada
│   │   ├── forms/         # Lista de formulários
│   │   ├── builder/       # Criador de formulários
│   │   └── responses/     # Respostas coletadas
│   ├── f/[id]/            # Formulário público
│   └── api/
│       └── auth/          # Auth.js routes
├── components/
│   ├── ui/                # Shadcn components
│   ├── forms/             # Form builder components
│   ├── landing/           # Landing page components
│   └── theme-provider.tsx # Theme provider
├── lib/
│   ├── auth.ts            # Auth.js config
│   ├── api.ts             # API client
│   └── utils.ts           # Utilities
└── hooks/
    └── use-theme.ts       # Theme hook
```

## 7. Fluxo de Autenticação (Backend)

1. **Login**: Usuário clica em "Entrar" → Redireciona para provedor OAuth
2. **Callback**: Auth.js recebe dados do provedor
3. **Sincronização**: Auth.js envia dados para backend `/auth/sync`
4. **Persistência**: Backend cria/atualiza usuário no banco
5. **Sessão**: Auth.js cria sessão e redireciona para dashboard

## 8. Fluxo de Criação de Formulário (Backend)

1. **Criar**: Usuário acessa form builder
2. **Editar**: Adiciona campos (texto, email, select, checkbox, etc.)
3. **Configurar**: Define validações e opções
4. **Salvar**: Envia para backend → Gera ID único
5. **Compartilhar**: Recebe link público `/f/[id]`

## 9. Fluxo de Resposta (Backend)

1. **Acessar**: Usuário não autenticado acessa `/f/[id]`
2. **Preencher**: Completa campos do formulário
3. **Validar**: Frontend valida com Zod
4. **Enviar**: POST para backend com respostas
5. **Confirmar**: Exibe mensagem de sucesso

## 10. Princípios de Arquitetura

### 10.1. Clean Architecture
- **Camadas**: Controller → Service → Repository → Database
- **Dependency Injection**: Usar DI do NestJS (constructor injection)
- **Single Responsibility**: Cada classe tem uma única responsabilidade
- **Separation of Concerns**: Lógica de negócio separada de infraestrutura

### 10.2. Padrões NestJS
- **Modules**: Cada feature é um módulo isolado
- **Controllers**: Apenas roteamento e validação de entrada
- **Services**: Lógica de negócio
- **Repositories**: Acesso ao banco de dados (Prisma)
- **DTOs**: Validação com Zod (nestjs-zod)
- **Guards**: Autenticação e autorização
- **Interceptors**: Transformação de resposta
- **Filters**: Tratamento de exceções

### 10.3. SOLID
- **S**: Uma classe, uma responsabilidade
- **O**: Aberto para extensão, fechado para modificação
- **L**: Substituição de Liskov (interfaces)
- **I**: Segregação de interfaces
- **D**: Inversão de dependência (DI)

## 11. Regras de Implementação

### 11.1. NestJS
- Sempre usar Dependency Injection (constructor injection)
- Controllers apenas roteiam, Services contêm lógica
- Usar decorators do NestJS (@Injectable, @Controller, etc.)
- Módulos devem ser coesos e desacoplados
- Providers devem ter escopo singleton (padrão)

### 11.2. TypeScript
- Strict mode sempre ativo
- Nunca usar `any`
- Path aliases: `@/*`

### 11.3. Validação com Zod
- Todos os DTOs usam Zod schemas
- Usar createZodDto do nestjs-zod
- Validação automática via ZodValidationPipe (global)
- Schemas reutilizáveis e compostos

### 11.4. Prisma
- Um repository por entidade
- Repositories injetados via DI
- Usar transações para operações complexas
- Migrations versionadas
- Seed data para desenvolvimento

### 11.5. Segurança
- Validar todos os inputs com Zod
- Sanitizar dados do usuário
- Variáveis sensíveis em `.env`
- CORS configurado no backend

## 12. Modelo de Dados (Prisma Schema)

### User
```prisma
model User {
  id         String   @id @default(uuid())
  email      String   @unique
  name       String
  image      String?
  provider   String   // 'google' | 'github' | 'facebook'
  providerId String
  forms      Form[]
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

### Form
```prisma
model Form {
  id           String         @id @default(uuid())
  userId       String
  user         User           @relation(fields: [userId], references: [id])
  name         String
  description  String?
  slug         String         @unique
  passwordHash String?
  fields       Json           // Array de FormField
  status       FormStatus     @default(ACTIVE)
  responses    FormResponse[]
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt
  deletedAt    DateTime?      // Soft delete
}

enum FormStatus {
  ACTIVE
  INACTIVE
}
```

### FormResponse
```prisma
model FormResponse {
  id          String    @id @default(uuid())
  formId      String
  form        Form      @relation(fields: [formId], references: [id])
  data        Json      // Mapa fieldId -> valor
  isCompleted Boolean   @default(false)
  device      String?   // 'desktop' | 'mobile'
  userAgent   String?
  ip          String?
  createdAt   DateTime  @default(now())
  completedAt DateTime?
}
```

## 13. Endpoints da API

Ver `BACKEND_INTEGRATION.md` para documentação completa.

### Autenticação
- `POST /api/auth/sync` - Sincronizar usuário OAuth

### Formulários (Autenticados)
- `POST /api/forms` - Criar formulário
- `GET /api/forms` - Listar formulários
- `GET /api/forms/:id` - Detalhes do formulário
- `PUT /api/forms/:id` - Atualizar formulário
- `DELETE /api/forms/:id` - Deletar formulário
- `GET /api/forms/:id/responses` - Listar respostas

### Formulários Públicos (Sem Auth)
- `GET /f/:slug` - Visualizar formulário público
- `POST /f/:slug/validate-password` - Validar senha
- `POST /f/:slug/responses` - Enviar resposta

### Dashboard (Analytics)
- `GET /api/dashboard/stats` - KPIs gerais
- `GET /api/dashboard/chart-data` - Dados para gráficos
- `GET /api/dashboard/recent-forms` - Formulários recentes

## 14. Funcionalidades de UI/UX (Frontend - Referência)

### 11.1. Sistema de Temas
- **Dark Mode**: Tema escuro completo
- **Light Mode**: Tema claro padrão
- **Persistência**: Preferência salva no localStorage
- **Toggle**: Botão de alternância acessível
- **Sistema**: Opção de seguir preferência do sistema

### 11.2. Responsividade
- Mobile-first design
- Breakpoints: sm, md, lg, xl, 2xl
- Touch-friendly em dispositivos móveis

### 11.3. Acessibilidade
- ARIA labels em todos os componentes
- Navegação por teclado
- Contraste adequado (WCAG AA)
- Screen reader friendly

## 15. Tipos de Campos do Form Builder

### 12.1. Campos de Texto
- **Short Text**: Texto curto (input)
- **Long Text**: Texto longo (textarea)
- **Email**: Validação de email
- **URL**: Validação de URL
- **Number**: Apenas números

### 12.2. Campos de Seleção
- **Select**: Dropdown de opções
- **Radio**: Seleção única
- **Checkbox**: Múltipla seleção
- **Toggle**: Sim/Não

### 12.3. Campos de Data/Hora
- **Date**: Seletor de data
- **Time**: Seletor de hora
- **DateTime**: Data e hora

### 12.4. Outros
- **File Upload**: Upload de arquivos (futuro)
- **Rating**: Avaliação por estrelas (futuro)
- **Scale**: Escala numérica (futuro)

## 16. Roadmap de Implementação (Backend)

### Fase 1: Setup e Configuração
1. ✅ Configurar NestJS + Fastify
2. ✅ Configurar Prisma + PostgreSQL
3. ✅ Configurar Zod + Swagger
4. ⏳ Criar schema Prisma completo
5. ⏳ Configurar variáveis de ambiente
6. ⏳ Configurar CORS

### Fase 2: Módulo de Autenticação
7. ⏳ Implementar POST /api/auth/sync
8. ⏳ Configurar JWT strategy
9. ⏳ Criar AuthGuard
10. ⏳ Criar módulo Users

### Fase 3: Módulo de Formulários
11. ⏳ Implementar CRUD de formulários
12. ⏳ Geração de slug único
13. ⏳ Validação de campos com Zod
14. ⏳ Hash de senha com bcrypt

### Fase 4: Formulários Públicos
15. ⏳ Endpoint de visualização pública
16. ⏳ Validação de senha
17. ⏳ Envio de respostas
18. ⏳ Rate limiting

### Fase 5: Dashboard e Analytics
19. ⏳ Cálculo de KPIs
20. ⏳ Agregação de dados para gráficos
21. ⏳ Queries otimizadas

### Fase 6: Testes e Deploy
22. ⏳ Testes unitários (Jest)
23. ⏳ Testes E2E
24. ⏳ Deploy no Railway/Render

## 17. Próximos Passos (Frontend - Referência)

### Fase 1: Setup Inicial (Frontend)
1. Configurar theme provider (dark/light mode)
2. Configurar Auth.js
3. Criar componentes base do Shadcn/ui

### Fase 2: Landing Page
4. Hero section
5. Features section
6. CTA para login

### Fase 3: Autenticação
7. Página de login
8. Integração OAuth (Google)
9. Proteção de rotas

### Fase 4: Dashboard
10. Lista de formulários
11. Cards de formulário
12. Ações (editar, duplicar, excluir)

### Fase 5: Form Builder
13. Interface drag-and-drop
14. Painel de campos disponíveis
15. Preview em tempo real
16. Configurações de campo

### Fase 6: Formulários Públicos
17. Página de formulário público
18. Validação de campos
19. Envio de respostas

### Fase 7: Respostas
20. Visualização de respostas
21. Filtros e busca
22. Exportação (CSV, Excel, JSON)
