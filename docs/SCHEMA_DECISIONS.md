# 📊 Decisões de Arquitetura do Schema - Formaly Backend

**Data**: 10/11/2024  
**Migration**: `20251110004244_init`

---

## 🎯 Filosofia de Design

**Princípio**: Simplicidade e pragmatismo sobre over-engineering.

- ✅ Apenas o necessário no banco de dados
- ✅ Lógica de negócio no código quando possível
- ✅ Índices otimizados para queries reais
- ❌ Sem campos desnecessários
- ❌ Sem snapshots complexos
- ❌ Sem soft delete

---

## 🗄️ Estrutura do Banco

### **Tabelas Principais**
```
users (autenticação)
  └── accounts (OAuth providers)
  └── forms (formulários)
      ├── form_passwords (senha opcional)
      ├── form_fields (campos)
      ├── form_submissions (respostas)
      │   └── form_values (valores dos campos)
      └── form_views (rastreamento único)
```

---

## ✅ Decisões Mantidas

### **1. UUID em Todos os IDs**
```prisma
@id @default(uuid())
```

**Por quê?**
- ✅ Padrão universal (RFC 4122)
- ✅ Suporte nativo do PostgreSQL
- ✅ Mais compatível que CUID
- ✅ Geração no banco (performance)

---

### **2. Password em Tabela Separada**
```prisma
model FormPassword {
  formId String @id
  hash   String
}
```

**Por quê?**
- ✅ Segurança (isolamento)
- ✅ Nem todos os forms têm senha
- ✅ Relação 1:1 opcional

---

### **3. Multi-Provider OAuth (User + Account)**
```prisma
User (1) ←→ (N) Account
```

**Por quê?**
- ✅ 1 usuário pode ter múltiplos logins (Google + GitHub + Facebook)
- ✅ Suporta email/password também (`User.password`)
- ✅ Tokens OAuth isolados por provider

**Exemplo:**
```
User { id: "user-123", email: "joao@gmail.com" }
  ├── Account { provider: "google", providerId: "google-xyz" }
  └── Account { provider: "github", providerId: "github-abc" }
```

---

### **4. FormView para Rastreamento Único**
```prisma
model FormView {
  @@id([formId, fingerprint])
}
```

**Por quê?**
- ✅ Composite PK evita duplicatas automaticamente
- ✅ Fingerprint = hash(IP + User-Agent)
- ✅ Rastreia views únicas sem autenticação

---

### **5. Índices Compostos Otimizados**
```prisma
@@index([userId, createdAt])  // Form
@@index([formId, createdAt])  // FormView
```

**Por quê?**
- ✅ Otimiza queries comuns: "meus forms ordenados por data"
- ✅ Índice composto serve para `WHERE userId` também
- ✅ Evita índices redundantes

---

### **6. Índice Gin em FormValue.value**
```prisma
@@index([value], type: Gin)
```

**Por quê?**
- ✅ Permite buscar dentro dos valores JSON
- ✅ Query: "encontrar respostas que contêm 'João'"
- ⚠️ Pode ser pesado, mas útil para analytics

---

### **7. FormSubmission com updatedAt**
```prisma
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
```

**Por quê?**
- ✅ Dono do form pode editar submissões
- ✅ Rastreia quando foi editada
- ✅ Auditoria de mudanças

---

### **8. Configurações do Form no Banco**
```prisma
maxResponses             Int?
expiresAt                DateTime?
allowMultipleSubmissions Boolean
```

**Por quê?**
- ✅ Configurações específicas por formulário
- ✅ Precisa persistir (não é lógica de código)
- ✅ Validações dependem desses valores

---

## ❌ Decisões Removidas

### **1. ❌ Soft Delete (deletedAt)**

**Removido porque:**
- Deletar = deletar de verdade
- Sem necessidade de recuperação
- Cascade deleta tudo automaticamente

**Antes:**
```prisma
deletedAt DateTime?
@@index([userId, deletedAt])
```

**Depois:**
```prisma
// Removido completamente
// Hard delete com CASCADE
```

---

### **2. ❌ Snapshots (fieldLabel, fieldType)**

**Removido porque:**
- Over-engineering
- Se deletar campo, CASCADE deleta valores
- Não precisa preservar histórico

**Antes:**
```prisma
model FormValue {
  fieldLabel String  // Snapshot
  fieldType  String  // Snapshot
}
```

**Depois:**
```prisma
model FormValue {
  type String  // Apenas tipo para validação
}
```

---

### **3. ❌ Order em FormField**

**Removido porque:**
- Frontend gerencia ordem via drag-and-drop
- Array já vem ordenado do frontend
- Banco não precisa armazenar

**Antes:**
```prisma
order Int @default(0)
@@index([formId, order])
```

**Depois:**
```prisma
// Removido - ordem é responsabilidade do frontend
```

---

### **4. ❌ successMessage**

**Removido porque:**
- Mensagem padrão no código serve
- Frontend pode customizar na UI
- Não precisa persistir

**Antes:**
```prisma
successMessage String?
```

**Depois:**
```typescript
// Código
return { message: 'Resposta enviada com sucesso!' };
```

---

### **5. ❌ VarChar Limits**

**Removido porque:**
- Validação já está no Zod (DTO)
- PostgreSQL usa TEXT eficientemente
- VarChar só útil para índices (que não temos nesses campos)

**Antes:**
```prisma
name String @db.VarChar(100)
description String? @db.VarChar(500)
```

**Depois:**
```prisma
name String
description String?
```

---

### **6. ❌ Índices Redundantes**

**Removido porque:**
- Índice composto já cobre queries simples
- Menos índices = melhor performance de escrita

**Antes:**
```prisma
@@index([userId])
@@index([status])
@@index([createdAt])
```

**Depois:**
```prisma
@@index([userId, createdAt])  // Cobre tudo
```

---

### **7. ❌ userId em FormSubmission**

**Removido porque:**
- Redundante (já tem em Form)
- Submission → Form → User (2 joins)
- Desnecessário para queries

**Antes:**
```prisma
model FormSubmission {
  userId String
  user   User @relation(...)
}
```

**Depois:**
```prisma
model FormSubmission {
  // Removido - acessa via form.user
}
```

---

### **8. ❌ FormFile (tabela separada)**

**Removido porque:**
- Arquivos podem ir no JSON do FormValue
- Simplifica estrutura
- Menos tabelas = menos complexidade

**Antes:**
```prisma
model FormFile {
  filename String
  url      String
  size     Int
  mimeType String
}
```

**Depois:**
```json
// FormValue.value
{
  "fileUrl": "https://storage.com/file.pdf",
  "fileName": "documento.pdf",
  "fileSize": 1024000
}
```

---

### **9. ❌ Clonagem (clonedFromId)**

**Removido porque:**
- Não é feature essencial
- Pode implementar depois se necessário
- Simplifica schema inicial

**Antes:**
```prisma
clonedFromId String?
clonedFrom   Form? @relation(...)
```

**Depois:**
```prisma
// Removido - implementar depois se necessário
```

---

### **10. ❌ Campos de Analytics em FormSubmission**

**Removido porque:**
- Dados básicos (IP, userAgent) são suficientes
- Analytics complexos podem ser calculados

**Antes:**
```prisma
fingerprint     String?
respondentEmail String?
respondentName  String?
device          String?
```

**Depois:**
```prisma
ipAddress String?
userAgent String?
// Resto é calculado no código
```

---

## 🔧 Problemas Resolvidos

### **Erro: Shadow Database Collation**

**Problema:**
```
ERROR: template database "template1" has a collation version
```

**Solução:**
```bash
# Recriar template1 no PostgreSQL Docker
docker exec formaly-postgres psql -U docker -d postgres -c "
  UPDATE pg_database SET datistemplate = FALSE WHERE datname = 'template1';
  DROP DATABASE template1;
  CREATE DATABASE template1 WITH TEMPLATE = template0 ENCODING = 'UTF8';
  UPDATE pg_database SET datistemplate = TRUE WHERE datname = 'template1';
"
```

**Alternativa:**
```bash
# Usar db push (sem shadow database)
npx prisma db push
```

---

## 📊 Schema Final - Resumo

### **Tabelas (8)**
1. `users` - Usuários da plataforma
2. `accounts` - OAuth providers
3. `forms` - Formulários
4. `form_passwords` - Senhas opcionais
5. `form_fields` - Campos dos formulários
6. `form_submissions` - Respostas enviadas
7. `form_values` - Valores dos campos
8. `form_views` - Rastreamento de views

### **Índices (10)**
- `users`: email
- `accounts`: userId, (provider + providerId)
- `forms`: (userId + createdAt)
- `form_fields`: formId, (formId + name)
- `form_submissions`: formId, createdAt
- `form_values`: fieldId, submissionId, value (Gin)
- `form_views`: (formId + createdAt)

### **Relações**
- User → Account (1:N)
- User → Form (1:N)
- Form → FormPassword (1:1)
- Form → FormField (1:N)
- Form → FormSubmission (1:N)
- Form → FormView (1:N)
- FormField → FormValue (1:N)
- FormSubmission → FormValue (1:N)

---

## 🎯 Próximos Passos

### **Implementação Backend**
1. ✅ Schema criado
2. ⏳ Módulo Auth (OAuth + JWT)
3. ⏳ Módulo Forms (CRUD)
4. ⏳ Módulo Public Forms (sem auth)
5. ⏳ Módulo Dashboard (analytics)

### **Features Futuras (Opcional)**
- [ ] FormFile (tabela separada para arquivos)
- [ ] Clonagem de formulários
- [ ] Soft delete com recuperação
- [ ] Analytics avançados
- [ ] Webhooks

---

## 📝 Comandos Úteis

```bash
# Ver schema atual
npx prisma studio

# Criar nova migration
npx prisma migrate dev --name description

# Aplicar migrations (produção)
npx prisma migrate deploy

# Resetar banco (desenvolvimento)
npx prisma migrate reset

# Sincronizar sem migration
npx prisma db push

# Gerar Prisma Client
npx prisma generate
```

---

**Schema limpo, eficiente e sem over-engineering!** 🚀
