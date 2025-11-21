# 📋 Sistema de Validação - Formaly Backend

## 🎯 Objetivo

Este sistema garante que **NENHUM erro passe despercebido** no código do Formaly Backend, seguindo rigorosamente:
- Clean Architecture
- Padrões NestJS
- Schema do banco correto
- TypeScript estrito
- SOLID principles

---

## 📁 Arquivos de Validação

### 1. **VALIDATION_CHECKLIST.md** (Principal)
**Localização**: `.amazonq/rules/VALIDATION_CHECKLIST.md`

**Conteúdo**:
- ✅ 14 categorias de validação
- ✅ 100+ itens de checklist
- ✅ Erros críticos recentes documentados
- ✅ Prompt específico para Amazon Q
- ✅ Anti-patterns a evitar

**Quando usar**:
- Antes de cada commit
- Ao revisar PRs
- Ao implementar novas features
- Quando encontrar bugs

### 2. **SCHEMA_DECISIONS.md**
**Localização**: `docs/SCHEMA_DECISIONS.md`

**Conteúdo**:
- ✅ O que existe no schema
- ❌ O que NÃO existe no schema
- 📊 Decisões de arquitetura
- 🔧 Problemas resolvidos

**Quando usar**:
- Antes de criar migrations
- Ao trabalhar com Prisma
- Quando tiver dúvidas sobre campos

### 3. **Rules.md**
**Localização**: `.amazonq/rules/Rules.md`

**Conteúdo**:
- Regras gerais de boas práticas
- Exemplos de código correto/incorreto
- Padrões NestJS
- Configurações

**Quando usar**:
- Ao iniciar no projeto
- Como referência rápida
- Para entender padrões

### 4. **NestJS-Patterns.md**
**Localização**: `.amazonq/rules/NestJS-Patterns.md`

**Conteúdo**:
- Exemplos práticos completos
- Estrutura de módulos
- DTOs, Services, Repositories
- Guards, Decorators, Filters

**Quando usar**:
- Ao criar novos módulos
- Como template de código
- Para copiar estruturas

---

## 🚀 Como Usar

### Opção 1: Validação Manual (Antes de Commit)

```bash
# 1. Rodar linter
npm run lint

# 2. Compilar TypeScript
npm run build

# 3. Rodar testes
npm run test

# 4. Revisar checklist
# Abrir .amazonq/rules/VALIDATION_CHECKLIST.md
# Verificar cada categoria manualmente
```

### Opção 2: Validação com Amazon Q (Recomendado)

**Prompt Completo**:
```
Analise o código do Formaly Backend seguindo RIGOROSAMENTE o checklist em .amazonq/rules/VALIDATION_CHECKLIST.md.

Arquivos a analisar:
- src/modules/[módulo]/[arquivo].ts

Verifique ESPECIALMENTE:
1. Clean Architecture (Controller → Service → Repository)
2. Campos do schema (sem deletedAt, order, successMessage, snapshots)
3. FormPassword como relação separada (form.password.hash)
4. Hard delete (não soft delete)
5. Exceções customizadas
6. TypeScript sem any
7. Dependency Injection correto

Liste TODOS os erros encontrados com:
- Arquivo e linha
- O que está errado
- Como corrigir
- Severidade (CRÍTICO/ALTO/MÉDIO/BAIXO)
```

**Prompt Rápido**:
```
Valide este código usando VALIDATION_CHECKLIST.md. Liste todos os erros com severidade.
```

### Opção 3: Validação de PR

```
Analise os arquivos modificados neste PR seguindo VALIDATION_CHECKLIST.md.

Foque em:
- Violações de Clean Architecture
- Campos inexistentes no schema
- Exceções não customizadas
- TypeScript com any
- Lógica de negócio no controller

Classifique erros por severidade e bloqueie PR se houver CRÍTICO.
```

---

## 🚨 Erros Críticos Mais Comuns

### 1. Acessar Campos Removidos do Schema
```typescript
// ❌ ERRADO
where: { deletedAt: null }
orderBy: { order: 'asc' }
data: { successMessage: dto.successMessage }

// ✅ CORRETO
where: { /* sem deletedAt */ }
orderBy: { createdAt: 'desc' }
// successMessage não existe mais
```

### 2. Password no Lugar Errado
```typescript
// ❌ ERRADO
form.passwordHash

// ✅ CORRETO
form.password.hash  // Relação 1:1
```

### 3. Lógica de Negócio no Controller
```typescript
// ❌ ERRADO
@Controller('forms')
export class FormsController {
  @Post()
  async create(@Body() dto: CreateFormDto) {
    const slug = dto.name.toLowerCase().replace(/\s/g, '-');
    return this.prisma.form.create({ data: { ...dto, slug } });
  }
}

// ✅ CORRETO
@Controller('forms')
export class FormsController {
  constructor(private formsService: FormsService) {}
  
  @Post()
  async create(@Body() dto: CreateFormDto) {
    return this.formsService.create(dto);
  }
}
```

### 4. Soft Delete em vez de Hard Delete
```typescript
// ❌ ERRADO
async softDelete(id: string) {
  await this.prisma.form.update({
    where: { id },
    data: { deletedAt: new Date() }
  });
}

// ✅ CORRETO
async delete(id: string) {
  await this.prisma.form.delete({
    where: { id }
  });
}
```

### 5. Acesso Direto ao Prisma no Service
```typescript
// ❌ ERRADO
@Injectable()
export class FormsService {
  constructor(private prisma: PrismaService) {}
  
  async findAll() {
    return this.prisma.form.findMany();
  }
}

// ✅ CORRETO
@Injectable()
export class FormsService {
  constructor(private formsRepository: FormsRepository) {}
  
  async findAll() {
    return this.formsRepository.findAll();
  }
}
```

---

## 📊 Categorias de Validação

### 1️⃣ Clean Architecture (CRÍTICO)
- Controller apenas roteia
- Service contém lógica
- Repository acessa banco
- Sem violações de camadas

### 2️⃣ Dependency Injection (CRÍTICO)
- Constructor injection
- Providers registrados
- Sem instanciação manual

### 3️⃣ TypeScript (CRÍTICO)
- Zero uso de any
- Tipos explícitos
- Strict mode ativo

### 4️⃣ Validação Zod (CRÍTICO)
- DTOs com createZodDto
- Schemas reutilizáveis
- Validações customizadas

### 5️⃣ Prisma (CRÍTICO)
- Tipos do Prisma
- Queries otimizadas
- Transações quando necessário

### 6️⃣ Schema do Banco (CRÍTICO)
- Campos corretos
- Sem campos removidos
- Relações corretas

### 7️⃣ Exceções (ALTO)
- Exceções customizadas
- Mensagens descritivas
- Status codes corretos

### 8️⃣ Segurança (ALTO)
- Senhas hasheadas
- JWT configurado
- Guards aplicados

### 9️⃣ Swagger (MÉDIO)
- Documentação completa
- Exemplos claros
- Status codes documentados

### 🔟 Performance (MÉDIO)
- Paginação implementada
- Queries otimizadas
- Sem N+1

### 1️⃣1️⃣ Código Limpo (BAIXO)
- Nomes descritivos
- Funções pequenas
- Sem duplicação

### 1️⃣2️⃣ Testes (BAIXO)
- Coverage adequado
- Mocks corretos
- E2E para críticos

### 1️⃣3️⃣ Lógica de Negócio (ALTO)
- Regras específicas
- Validações corretas
- Fluxos completos

### 1️⃣4️⃣ Anti-Patterns (CRÍTICO)
- Sem God Classes
- Sem circular deps
- Sem hardcoded values

---

## 🎯 Workflow Recomendado

### Durante Desenvolvimento
1. Consultar **NestJS-Patterns.md** para templates
2. Consultar **SCHEMA_DECISIONS.md** para campos
3. Implementar seguindo Clean Architecture
4. Validar com **VALIDATION_CHECKLIST.md**

### Antes de Commit
1. `npm run lint`
2. `npm run build`
3. `npm run test`
4. Validação manual ou com Amazon Q

### Durante Code Review
1. Usar prompt de validação de PR
2. Verificar categorias CRÍTICAS primeiro
3. Bloquear se houver erros CRÍTICOS
4. Sugerir melhorias para ALTO/MÉDIO

### Ao Encontrar Bug
1. Identificar categoria no checklist
2. Adicionar ao "Erros Críticos Recentes"
3. Atualizar checklist se necessário
4. Documentar solução

---

## 📈 Métricas de Qualidade

### Objetivo: Zero Erros Críticos

**Severidades**:
- **CRÍTICO**: Bloqueia PR, deve ser corrigido imediatamente
- **ALTO**: Deve ser corrigido antes do merge
- **MÉDIO**: Pode ser corrigido em PR separado
- **BAIXO**: Sugestão de melhoria

**Categorias Críticas** (não podem ter erros):
1. Clean Architecture
2. Dependency Injection
3. TypeScript (sem any)
4. Schema do Banco
5. Anti-Patterns

**Categorias Altas** (máximo 2 erros):
1. Exceções
2. Segurança
3. Lógica de Negócio

---

## 🔄 Manutenção do Sistema

### Quando Atualizar

**VALIDATION_CHECKLIST.md**:
- Após encontrar novo erro crítico
- Após mudanças no schema
- Após adicionar novas regras

**SCHEMA_DECISIONS.md**:
- Após cada migration
- Após decisões de arquitetura
- Após remover/adicionar campos

**Rules.md**:
- Após mudanças de padrões
- Após atualizações de dependências
- Após decisões de equipe

**NestJS-Patterns.md**:
- Após criar novos padrões
- Após refatorações importantes
- Após adicionar novos módulos

---

## 📞 Suporte

### Dúvidas sobre Validação
1. Consultar VALIDATION_CHECKLIST.md
2. Buscar em "Erros Críticos Recentes"
3. Verificar SCHEMA_DECISIONS.md

### Dúvidas sobre Implementação
1. Consultar NestJS-Patterns.md
2. Verificar código existente similar
3. Consultar documentação oficial

### Dúvidas sobre Schema
1. Consultar SCHEMA_DECISIONS.md
2. Verificar prisma/schema.prisma
3. Rodar `npx prisma studio`

---

## ✅ Checklist de Onboarding

Para novos desenvolvedores:

- [ ] Ler README.md do projeto
- [ ] Ler SCHEMA_DECISIONS.md completo
- [ ] Ler Rules.md completo
- [ ] Estudar NestJS-Patterns.md
- [ ] Entender VALIDATION_CHECKLIST.md
- [ ] Rodar projeto localmente
- [ ] Fazer primeiro commit seguindo checklist
- [ ] Revisar PR de outro dev usando checklist

---

**Sistema criado em**: 10/11/2024  
**Última atualização**: 10/11/2024  
**Versão do Schema**: 20251110004244_init

**Objetivo**: Zero erros críticos no código! 🎯
