# Formulários - Formaly Backend

**Versão:** 2.0  
**Última Atualização:** Janeiro 2025

---

## Decisões Técnicas

- **Status:** ACTIVE | INACTIVE (sem draft - desativar se não quiser compartilhar)
- **Acesso:** Link direto (não há listagem pública)
- **isPublic:** Calculado automaticamente (`!hasPassword`)
- **order:** NÃO existe no schema (frontend gerencia ordem do array)
- **Senha:** Nunca expor, apenas hasPassword
- **Campos calculados:** Armazenar no schema (totalResponses, totalViews, lastResponseAt)
- **Search:** Busca em nome e descrição (busca em respostas requer ElasticSearch - v2)

---

## 1. Listar Formulários

**Endpoint:** `GET /api/forms`

**Filtros:**
```
?status=active
&search=joão
&sortBy=createdAt
&sortOrder=desc
&page=1
&pageSize=10
```

**Opções:**
- `status`: "active" | "inactive" | "all" (padrão: "all")
- `search`: busca em Form.name e Form.description
- `sortBy`: "createdAt" | "updatedAt" | "name" | "totalResponses"
- `sortOrder`: "asc" | "desc"
- `page`: número da página (padrão: 1)
- `pageSize`: itens por página (padrão: 10, máx: 100)

**Response:** 200
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Formulário de Contato",
      "description": "Descrição opcional",
      "status": "active",
      "isPublic": true,
      "hasPassword": false,
      "totalResponses": 245,
      "totalViews": 1523,
      "lastResponseAt": "2024-01-25T09:15:00Z",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-20T14:20:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 124,
    "totalPages": 13
  }
}
```

---

## 2. Detalhes do Formulário

**Endpoint:** `GET /api/forms/:id`

**Response:** 200
```json
{
  "id": "uuid",
  "name": "Formulário de Contato",
  "description": "Descrição opcional",
  "status": "active",
  "isPublic": true,
  "hasPassword": false,
  "maxResponses": 1000,
  "expiresAt": "2024-12-31T23:59:59Z",
  "allowMultipleSubmissions": true,
  "totalResponses": 245,
  "totalViews": 1523,
  "lastResponseAt": "2024-01-25T09:15:00Z",
  "fields": [
    {
      "id": "uuid",
      "type": "text",
      "label": "Nome Completo",
      "name": "nome_completo",
      "placeholder": "Digite seu nome",
      "required": true,
      "config": {
        "minLength": 3,
        "maxLength": 100
      }
    },
    {
      "id": "uuid",
      "type": "select",
      "label": "Como nos conheceu?",
      "name": "origem",
      "placeholder": "Selecione",
      "required": false,
      "config": {
        "options": ["Google", "Facebook", "Indicação"]
      }
    }
  ],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-20T14:20:00Z"
}
```

**Tipos de campo:**
- `text`, `email`, `phone`, `textarea`, `number`
- `date`, `select`, `radio`, `checkbox`, `file`

**Erros:**
- 404: Formulário não encontrado
- 403: Sem permissão (não é owner)

---

## 3. Criar Formulário

**Endpoint:** `POST /api/forms`

**Request:**
```json
{
  "name": "Novo Formulário",
  "description": "Descrição opcional",
  "password": "senha123",
  "maxResponses": 1000,
  "expiresAt": "2024-12-31T23:59:59Z",
  "allowMultipleSubmissions": true,
  "fields": [
    {
      "type": "text",
      "label": "Nome",
      "name": "nome",
      "placeholder": "Digite seu nome",
      "required": true,
      "config": {}
    }
  ]
}
```

**Response:** 201
- Mesmo formato do GET /api/forms/:id

**Objetivo:**
- Backend valida campos obrigatórios (select/radio/checkbox devem ter options em config)
- Frontend envia array ordenado, backend salva na ordem recebida
- Backend retorna fields ordenados por createdAt (ordem de criação)

**Erros:**
- 400: Dados inválidos
- 400: Select sem options

---

## 4. Atualizar Formulário

**Endpoint:** `PUT /api/forms/:id`

**Request:**
- Mesmo formato do POST /api/forms
- Para remover senha: `"password": ""`
- Para manter senha: não enviar campo `password`

**Response:** 200
- Mesmo formato do GET /api/forms/:id

**Erros:**
- 404: Formulário não encontrado
- 403: Sem permissão (não é owner)

---

## 5. Deletar Formulário

**Endpoint:** `DELETE /api/forms/:id`

**Response:** 204 (sem conteúdo)

**Objetivo:**
- Hard delete com CASCADE
- Deleta: Form, Fields, Password, Submissions, Values, Views

**Erros:**
- 404: Formulário não encontrado
- 403: Sem permissão (não é owner)

---

## 6. Clonar Formulário

**Endpoint:** `POST /api/forms/:id/clone`

**Response:** 201
- Novo formulário (mesmo formato do GET /api/forms/:id)
- Nome: "[Nome Original] (Cópia)"
- Status: ACTIVE
- Campos duplicados com novos IDs
- Senha copiada (se houver)
- Configurações copiadas

**Erros:**
- 404: Formulário não encontrado
- 403: Sem permissão (não é owner)

---

## 7. Formulário Público

**Endpoint:** `GET /f/:id`

**Response:** 200
```json
{
  "id": "uuid",
  "name": "Formulário de Contato",
  "description": "Descrição opcional",
  "hasPassword": false,
  "fields": [
    {
      "id": "uuid",
      "type": "text",
      "label": "Nome Completo",
      "name": "nome_completo",
      "placeholder": "Digite seu nome",
      "required": true,
      "config": {}
    }
  ]
}
```

**Objetivo:**
- Retornar apenas dados necessários para preenchimento
- NÃO expor: userId, password, status, totalResponses, etc
- Validar: status ACTIVE, não expirado, não cheio
- Registrar view (fingerprint)

**Erros:**
- 404: Formulário não encontrado
- 400: Formulário inativo
- 400: Formulário expirado
- 400: Limite de respostas atingido

---

## 8. Validar Senha

**Endpoint:** `POST /f/:id/validate-password`

**Request:**
```json
{
  "password": "senha123"
}
```

**Response:** 200
```json
{
  "valid": true
}
```

**Erros:**
- 401: Senha inválida
- 404: Formulário não encontrado

---

## 9. Enviar Resposta

**Endpoint:** `POST /f/:id/submit`

**Request:**
```json
{
  "data": {
    "nome_completo": "João Silva",
    "email": "joao@email.com"
  },
  "metadata": {
    "startedAt": "2024-01-25T14:30:00Z",
    "completedAt": "2024-01-25T14:32:34Z",
    "timeSpent": 154
  }
}
```

**Response:** 201
```json
{
  "id": "uuid",
  "message": "Resposta enviada com sucesso"
}
```

**Objetivo:**
- Validar campos obrigatórios
- Salvar metadata de tempo
- Parsear userAgent (device/browser)
- Atualizar campos calculados do form

**Erros:**
- 400: Campos obrigatórios faltando
- 400: Formulário inativo/expirado/cheio
- 401: Senha obrigatória
- 409: Múltiplas submissões não permitidas

---

## Casos de Uso - Validações

**Validação de campos obrigatórios:**
- Select/Radio/Checkbox devem ter options em config
- Backend valida ao criar/atualizar formulário
- Retornar 400 se select/radio/checkbox sem options

**Validação de ownership:**
- Apenas owner pode editar/deletar/clonar
- Retornar 403 se não for owner

**Ordenação de campos:**
- NÃO há campo `order` no schema
- Frontend envia array ordenado
- Backend salva na ordem recebida
- Backend retorna ordenado por createdAt

**isPublic (calculado):**
- `isPublic = !hasPassword`
- Se tem senha: isPublic = false
- Se não tem senha: isPublic = true

**Campos calculados (armazenados):**
- `totalResponses`: COUNT(submissions)
- `totalViews`: COUNT(views)
- `lastResponseAt`: MAX(submissions.createdAt)
- Atualizar via trigger ou job de sincronização

**Search:**
- Busca em Form.name e Form.description (ILIKE)
- Busca em FormValue.value requer Full-Text Search ou ElasticSearch
- Implementação v2: adicionar índice GIN ou migrar para ElasticSearch

---

## Schema Additions

**Tracking de Tempo:**
```prisma
model FormSubmission {
  // ... campos existentes
  startedAt   DateTime? @map("started_at")
  completedAt DateTime? @map("completed_at")
  timeSpent   Int?      @map("time_spent")  // segundos
}
```

---

**Versão:** 2.0  
**Status:** ✅ Estrutura completa definida
