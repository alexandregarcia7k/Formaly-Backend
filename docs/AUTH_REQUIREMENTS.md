# Autenticação - Formaly Backend

**Versão:** 2.0  
**Última Atualização:** Janeiro 2025

---

## Decisões Técnicas

- **JWT em cookie httpOnly** (segurança)
- **Prefixo /api/** em todas rotas autenticadas
- **OAuth processado no FRONTEND** via Auth.js (Next.js)
- **Backend apenas sincroniza** dados do usuário OAuth
- **Permitir definir senha** em contas OAuth

---

## 1. Cadastro

**Endpoint:** `POST /api/auth/register`

**Request:**
```json
{
  "email": "usuario@email.com",
  "name": "Nome",
  "password": "senha123"
}
```

**Response:** 200 + Cookie `accessToken`
```json
{
  "user": {
    "id": "uuid",
    "email": "usuario@email.com",
    "name": "Nome",
    "image": null
  }
}
```

**Erros:**
- 409: Email já cadastrado (especificar se é OAuth)
- 400: Dados inválidos

**Caso de uso - Email já existe via OAuth:**
- Mensagem: "Este email já está cadastrado via Google. Faça login com Google ou defina uma senha."

---

## 2. Login

**Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
  "email": "usuario@email.com",
  "password": "senha123"
}
```

**Response:** 200 + Cookie `accessToken`
```json
{
  "user": {
    "id": "uuid",
    "email": "usuario@email.com",
    "name": "Nome",
    "image": null
  }
}
```

**Erros:**
- 401: Credenciais inválidas
- 401: Conta criada via OAuth (especificar provider)
- 400: Dados inválidos

**Caso de uso - Conta OAuth sem senha:**
- Mensagem: "Esta conta foi criada via Google. Faça login com Google ou defina uma senha."

---

## 3. OAuth Sync (Google, GitHub, Facebook)

**Endpoint:** `POST /api/auth/sync`

**Request:**
```json
{
  "email": "usuario@email.com",
  "name": "Nome",
  "image": "url-foto",
  "provider": "google",
  "providerId": "google-user-id"
}
```

**Response:** 200 + Cookie `accessToken`
```json
{
  "user": {
    "id": "uuid",
    "email": "usuario@email.com",
    "name": "Nome",
    "image": "url-foto"
  }
}
```

**Objetivo:**
- Frontend (Auth.js) processa OAuth flow
- Backend recebe dados já validados
- Se email existe: vincula provider à conta
- Se email novo: cria conta automaticamente

---

## 4. Usuário Autenticado

**Endpoint:** `GET /api/auth/me`

**Auth:** Cookie `accessToken`

**Response:** 200
```json
{
  "user": {
    "id": "uuid",
    "email": "usuario@email.com",
    "name": "Nome",
    "image": null,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Erros:**
- 401: Não autenticado

---

## 5. Logout

**Endpoint:** `POST /api/auth/logout`

**Response:** 200 + Clear Cookie
```json
{
  "message": "Logout realizado com sucesso"
}
```

---

## 6. Recuperação de Senha

**Endpoint:** `POST /api/auth/forgot-password`

**Request:**
```json
{
  "email": "usuario@email.com"
}
```

**Response:** 200
```json
{
  "message": "Se o email existir, você receberá instruções"
}
```

**Objetivo:**
- Se conta tem senha: enviar link de reset
- Se conta é OAuth: enviar link para definir senha
- Não revelar se email existe (segurança)

---

## 7. Redefinir/Definir Senha

**Endpoint:** `POST /api/auth/reset-password`

**Request:**
```json
{
  "token": "reset-token",
  "newPassword": "novaSenha123"
}
```

**Response:** 200
```json
{
  "message": "Senha definida com sucesso"
}
```

**Objetivo:**
- Permite definir senha em contas OAuth
- Permite resetar senha em contas normais

---

## Casos de Uso - Conflito de Contas

**Cenário A: OAuth → Email/Senha**
1. User cria conta com Google
2. User tenta registrar com mesmo email/senha
3. Backend retorna 409: "Email já cadastrado via Google"

**Cenário B: Email/Senha → OAuth**
1. User cria conta com email/senha
2. User faz login com Google (mesmo email)
3. Backend vincula Google à conta existente

**Cenário C: Login sem senha**
1. User criou conta com Google (sem senha)
2. User tenta login com email/senha
3. Backend retorna 401: "Conta criada via Google. Defina uma senha primeiro"

**Cenário D: Recovery de conta OAuth**
1. User criou conta com Google (sem senha)
2. User clica "Esqueci senha"
3. Backend envia email: "Defina uma senha para sua conta"
4. User define senha
5. Agora pode logar com email/senha OU Google

---

**Versão:** 2.0  
**Status:** ✅ Estrutura completa definida
