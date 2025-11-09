# 🚀 Formaly Backend

Backend NestJS + Fastify + Prisma + PostgreSQL para sistema de criação e gerenciamento de formulários.

## 📚 Documentação

**Para implementar o backend, consulte:**
- **[API Reference](./docs/API_REFERENCE.md)** - Documentação completa de endpoints, estrutura de dados e regras de negócio
- **[Schema Final](./docs/SCHEMA_FINAL.md)** - Decisões técnicas do banco de dados

## 🗄️ Banco de Dados

**Status**: ✅ Migration executada

```bash
# Ver status das migrations
npx prisma migrate status

# Abrir Prisma Studio (visualizar dados)
npx prisma studio
```

## 🛠️ Stack

- **Framework**: NestJS 11.0.1
- **HTTP**: Fastify 11.1.8
- **ORM**: Prisma 6.19.0
- **Database**: PostgreSQL (localhost:5432)
- **Validação**: Zod 4.1.12
- **Autenticação**: JWT (a implementar)

## 📦 Estrutura do Projeto

```
src/
├── main.ts                 # Bootstrap
├── app.module.ts           # Módulo raiz
├── common/                 # Código compartilhado
│   ├── decorators/
│   ├── guards/
│   ├── pipes/
│   └── filters/
├── config/                 # Configurações
└── modules/                # Módulos da aplicação
    ├── auth/               # Autenticação OAuth + JWT
    ├── users/              # Gerenciamento de usuários
    ├── forms/              # CRUD de formulários
    ├── public-forms/       # Formulários públicos (sem auth)
    └── dashboard/          # Analytics e KPIs

prisma/
├── schema.prisma           # Schema do banco
├── migrations/             # Migrations
└── seed.ts                 # Dados de teste (opcional)

docs/
├── API_REFERENCE.md        # 📖 Documentação principal
└── SCHEMA_FINAL.md         # Decisões técnicas
```

## 🚀 Como Começar

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar .env
```env
DATABASE_URL="postgresql://docker:docker@localhost:5432/formaly?schema=public"
JWT_SECRET="sua-chave-super-secreta-min-32-chars"
JWT_EXPIRES_IN="7d"
PORT=3333
```

### 3. Rodar migrations (já executado)
```bash
npx prisma migrate dev
```

### 4. Iniciar servidor
```bash
npm run start:dev
```

## 📋 Próximos Passos de Implementação

Consulte `docs/API_REFERENCE.md` para implementar:

### Fase 1: Autenticação
- [ ] POST /api/auth/sync (sincronizar OAuth)
- [ ] JWT Strategy
- [ ] Auth Guard

### Fase 2: Formulários
- [ ] POST /api/forms (criar)
- [ ] GET /api/forms (listar)
- [ ] GET /api/forms/:id (detalhes)
- [ ] PUT /api/forms/:id (atualizar)
- [ ] DELETE /api/forms/:id (deletar)
- [ ] POST /api/forms/:id/clone (clonar)

### Fase 3: Formulários Públicos
- [ ] GET /f/:id (visualizar)
- [ ] POST /f/:id/validate-password
- [ ] POST /f/:id/submit (enviar resposta)

### Fase 4: Dashboard
- [ ] GET /api/dashboard/stats
- [ ] GET /api/dashboard/recent-forms

### Fase 5: Respostas
- [ ] GET /api/forms/:id/submissions

## 🔗 Links Úteis

- [Documentação NestJS](https://docs.nestjs.com)
- [Documentação Prisma](https://www.prisma.io/docs)
- [Documentação Fastify](https://www.fastify.io)

---

**Desenvolvido com NestJS + Prisma** 🚀
