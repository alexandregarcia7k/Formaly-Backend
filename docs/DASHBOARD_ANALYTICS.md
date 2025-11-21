# Dashboard & Analytics - Formaly Backend

**Versão:** 2.0  
**Última Atualização:** Janeiro 2025

---

## 📊 DASHBOARD

### Decisões Técnicas

- **Activity:** Tabela separada para histórico de atividades
- **Tempo:** Tracking de startedAt, completedAt, timeSpent
- **Cálculos:** Usar campos armazenados quando possível

---

### 1. Estatísticas Gerais

**Endpoint:** `GET /api/dashboard/stats`

**Response:** 200
```json
{
  "totalForms": 124,
  "totalResponses": 8234,
  "totalViews": 15420,
  "averageCompletionRate": 87.5
}
```

**Cálculos:**
- `totalForms`: COUNT(forms WHERE userId)
- `totalResponses`: SUM(form.totalResponses)
- `totalViews`: SUM(form.totalViews)
- `averageCompletionRate`: (totalResponses / totalViews) * 100

---

### 2. Atividades Recentes

**Endpoint:** `GET /api/dashboard/activities?limit=5`

**Response:** 200
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "response_received",
      "message": "Nova resposta no formulário 'Contato'",
      "formId": "uuid",
      "formTitle": "Formulário de Contato",
      "timestamp": "2024-01-25T14:30:00Z"
    }
  ],
  "total": 156
}
```

**Tipos de atividade:**
- `form_created`: Formulário criado
- `response_received`: Nova resposta recebida
- `form_updated`: Formulário editado
- `form_cloned`: Formulário clonado
- `form_deleted`: Formulário deletado
- `form_status_changed`: Status alterado (ACTIVE/INACTIVE)

**Objetivo:**
- Criar Activity ao executar ações
- Buscar últimas atividades ordenadas por timestamp DESC

---

### 3. Últimas Respostas

**Endpoint:** `GET /api/dashboard/latest-responses?limit=10`

**Response:** 200
```json
{
  "data": [
    {
      "id": "uuid",
      "formId": "uuid",
      "formTitle": "Formulário de Contato",
      "submittedAt": "2024-01-25T14:30:00Z",
      "timeSpent": 154,
      "device": "mobile",
      "browser": "Chrome"
    }
  ],
  "total": 8234
}
```

**Objetivo:**
- Buscar últimas submissions ordenadas por createdAt DESC
- Parsear userAgent para device e browser
- Incluir timeSpent (segundos)

---

### 4. Respostas ao Longo do Tempo

**Endpoint:** `GET /api/dashboard/responses-over-time?period=30d`

**Períodos:** `7d`, `30d`, `90d`, `1y`

**Response:** 200
```json
{
  "data": [
    {
      "date": "2024-01-01",
      "count": 45
    },
    {
      "date": "2024-01-02",
      "count": 52
    }
  ]
}
```

**Objetivo:**
- GROUP BY date(createdAt)
- Filtrar por período
- Retornar todos os dias (mesmo com count = 0)

---

## 📈 ANALYTICS

### Decisões Técnicas

- **Geolocalização:** geoip-lite (biblioteca local, grátis)
- **User-agent:** ua-parser-js (parse device/browser)
- **Funil:** 3 etapas (Views → Iniciaram → Enviaram)
- **Heatmap:** Implementar (dia da semana + hora)
- **Field Performance:** NÃO implementar

### Parâmetros Comuns

Todos os endpoints aceitam:
- `period`: "7d" | "30d" | "90d" | "1y" (obrigatório)
- `formId`: uuid (opcional - filtrar por formulário)

---

### 1. KPIs Principais

**Endpoint:** `GET /api/analytics/kpis?period=30d`

**Response:** 200
```json
{
  "growth": {
    "value": "+23.5%",
    "trend": 156,
    "isPositive": true,
    "description": "vs período anterior"
  },
  "conversionRate": {
    "value": 68.4,
    "trend": 5.2,
    "isPositive": true,
    "description": "Submits / Acessos"
  },
  "averageTime": {
    "value": "2m 34s",
    "trend": -18,
    "isPositive": true,
    "description": "Tempo de preenchimento"
  },
  "engagement": {
    "value": 8.2,
    "maxValue": 10,
    "trend": 0.8,
    "isPositive": true,
    "description": "Score de qualidade"
  }
}
```

**Cálculos:**
- `growth`: Compara total de respostas com período anterior
- `conversionRate`: (totalResponses / totalViews) * 100
- `averageTime`: AVG(timeSpent) formatado
- `engagement`: Score baseado em conversão + tempo + completação

---

### 2. Dados Temporais

**Endpoint:** `GET /api/analytics/temporal?period=30d`

**Response:** 200
```json
{
  "data": [
    {
      "date": "2024-01-01",
      "acessos": 186,
      "respostas": 127
    },
    {
      "date": "2024-01-02",
      "acessos": 305,
      "respostas": 208
    }
  ]
}
```

**Objetivo:**
- GROUP BY date para views e submissions
- Retornar todos os dias do período

---

### 3. Distribuição por Dispositivo

**Endpoint:** `GET /api/analytics/devices?period=30d`

**Response:** 200
```json
{
  "data": [
    {
      "name": "Mobile",
      "value": 54,
      "count": 3240
    },
    {
      "name": "Desktop",
      "value": 38,
      "count": 2280
    },
    {
      "name": "Tablet",
      "value": 8,
      "count": 480
    }
  ],
  "topDevice": "Mobile"
}
```

**Objetivo:**
- Parsear userAgent com ua-parser-js
- GROUP BY device type
- `value`: percentual (soma = 100)
- `count`: quantidade absoluta

---

### 4. Distribuição por Navegador

**Endpoint:** `GET /api/analytics/browsers?period=30d`

**Response:** 200
```json
{
  "data": [
    {
      "name": "Chrome",
      "value": 68,
      "count": 4080
    },
    {
      "name": "Safari",
      "value": 18,
      "count": 1080
    },
    {
      "name": "Firefox",
      "value": 9,
      "count": 540
    },
    {
      "name": "Edge",
      "value": 5,
      "count": 300
    }
  ],
  "topBrowser": "Chrome"
}
```

**Objetivo:**
- Parsear userAgent com ua-parser-js
- GROUP BY browser name
- Agrupar minoritários (< 2%) em "Outros"

---

### 5. Funil de Conversão

**Endpoint:** `GET /api/analytics/funnel?period=30d`

**Response:** 200
```json
{
  "data": [
    {
      "stage": "Visualizaram",
      "count": 12543,
      "percentage": 100,
      "dropoff": 0
    },
    {
      "stage": "Iniciaram",
      "count": 9783,
      "percentage": 78,
      "dropoff": 22
    },
    {
      "stage": "Enviaram",
      "count": 7650,
      "percentage": 61,
      "dropoff": 17
    }
  ],
  "totalViews": 12543,
  "totalSubmissions": 7650,
  "overallConversion": 61,
  "criticalPoints": [
    {
      "stage": "Visualizaram → Iniciaram",
      "dropoff": 22,
      "suggestion": "Melhorar título e descrição"
    }
  ]
}
```

**Objetivo (3 etapas):**
1. **Visualizaram**: COUNT(FormView)
2. **Iniciaram**: COUNT(FormSubmission WHERE timeSpent > 0)
3. **Enviaram**: COUNT(FormSubmission completo)

**Cálculos:**
- `percentage`: baseado na primeira etapa (100%)
- `dropoff`: perda percentual para próxima etapa
- `criticalPoints`: etapas com dropoff > 15%

---

### 6. Heatmap de Atividade

**Endpoint:** `GET /api/analytics/heatmap?period=30d`

**Períodos:** `7d`, `30d`, `90d`

**Response:** 200
```json
{
  "data": [
    {
      "day": "Dom",
      "data": [
        { "hour": 0, "value": 5 },
        { "hour": 1, "value": 2 },
        { "hour": 23, "value": 8 }
      ]
    },
    {
      "day": "Seg",
      "data": [
        { "hour": 0, "value": 0 },
        { "hour": 1, "value": 0 }
      ]
    }
  ],
  "peakDay": "Qui",
  "peakHour": 14
}
```

**Objetivo:**
- GROUP BY day_of_week(createdAt), hour(createdAt)
- Sempre 7 dias (Dom a Sáb)
- Cada dia tem 24 horas (0-23)
- Retornar value: 0 se sem dados

---

### 7. Distribuição Geográfica

**Endpoint:** `GET /api/analytics/locations?period=30d`

**Response:** 200
```json
{
  "data": [
    {
      "estado": "São Paulo",
      "acessos": 3421,
      "respostas": 2341,
      "taxa": 68.4
    },
    {
      "estado": "Rio de Janeiro",
      "acessos": 2876,
      "respostas": 1987,
      "taxa": 69.1
    }
  ],
  "bestConversion": {
    "estado": "Paraná",
    "taxa": 72.1
  }
}
```

**Objetivo:**
- Usar geoip-lite para obter estado por IP
- GROUP BY estado
- Limitar a 10 estados + "Outros" (agregado)
- `taxa`: (respostas / acessos) * 100
- Ordenar por acessos DESC

---

### 8. Ranking de Formulários

**Endpoint:** `GET /api/analytics/form-ranking?period=30d&limit=5`

**Response:** 200
```json
{
  "data": [
    {
      "rank": 1,
      "formId": "uuid",
      "nome": "Formulário de Contato",
      "acessos": 3200,
      "respostas": 2304,
      "conversao": 72,
      "tempo": "2m 15s",
      "score": 5
    }
  ],
  "averageConversion": 66.4,
  "problematicForms": [
    {
      "formId": "uuid",
      "nome": "Cadastro de Cliente",
      "issue": "Conversão 21pp abaixo da média"
    }
  ]
}
```

**Objetivo:**
- Ordenar forms por conversão
- `score`: 1-5 estrelas baseado em conversão
- `conversao`: (respostas / acessos) * 100
- `tempo`: AVG(timeSpent) formatado
- `problematicForms`: conversão < média - 10pp

---

## 🗄️ SCHEMA ADDITIONS

### Tabela Activity

```prisma
model Activity {
  id        String   @id @default(uuid())
  userId    String
  type      String   // form_created, response_received, form_updated, form_cloned, form_deleted, form_status_changed
  formId    String?
  message   String
  metadata  Json?
  createdAt DateTime @default(now()) @map("created_at")
  
  @@index([userId, createdAt])
  @@map("activities")
}
```

### Tracking de Tempo

```prisma
model FormSubmission {
  // ... campos existentes
  startedAt   DateTime? @map("started_at")
  completedAt DateTime? @map("completed_at")
  timeSpent   Int?      @map("time_spent")  // segundos
}
```

---

## 📦 BIBLIOTECAS NECESSÁRIAS

```json
{
  "geoip-lite": "^1.4.10",
  "ua-parser-js": "^1.0.37"
}
```

---

**Versão:** 2.0  
**Status:** ✅ Estrutura completa definida
