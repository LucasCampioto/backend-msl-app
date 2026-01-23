# Sistema de Usuários - Instruções para Agente

Este documento descreve a lógica de criação e autenticação de usuários para implementação.

---

## 1. Modelo de Usuário

### Schema (MongoDB)

```javascript
{
  created: Date,              // Data de criação (auto)
  name: String,               // Nome do usuário (obrigatório)
  username: String,           // Email do usuário (obrigatório, único)
  password: String,           // Senha criptografada com SHA256
  usedPasswords: Array,       // Histórico de senhas usadas
  currentDatePassword: Date,  // Data da última alteração de senha
  active: Boolean,            // Usuário ativo (default: true)
  failedAttempts: Number,     // Tentativas de login falhas (default: 0)
  lockUntil: Date,            // Data até quando está bloqueado
  ipAddressList: Array,       // Últimos 5 IPs de acesso
  canceled: Boolean           // Usuário cancelado (default: false)
}
```

---

## 2. Criação de Usuário (SignUp)

### Endpoint
`POST /user/signup`

### Campos Obrigatórios
| Campo | Tipo | Validação |
|-------|------|-----------|
| `name` | string | Não pode ser vazio |
| `username` | string | Deve conter '@' (email válido) |
| `password` | string | Mínimo 8 caracteres |

### Fluxo de Criação

1. **Validar campos obrigatórios**
   - `name` não pode ser vazio
   - `username` deve conter '@'
   - `password` deve ter no mínimo 8 caracteres

2. **Verificar se usuário já existe**
   - Buscar por `username` no banco
   - Se existir e não estiver cancelado: retornar erro "Usuário já existe!"
   - Se existir e estiver cancelado: retornar erro "Esse e-mail não é válido!"

3. **Criptografar senha com SHA256**
   ```javascript
   const passwordEncrypt = shaJS('sha256').update(password).digest('hex')
   ```

4. **Criar objeto do usuário**
   ```javascript
   const userData = {
     name,
     username,
     password: passwordEncrypt,
     active: true,
     currentDatePassword: new Date()
   }
   ```

5. **Salvar no banco**

### Respostas

| Status | Mensagem |
|--------|----------|
| 200 | `{ message: 'Usuário criado com sucesso!' }` |
| 400 | `{ message: 'Campo nome inválido' }` |
| 400 | `{ message: 'Campo email inválido' }` |
| 400 | `{ message: 'Senha deve ter no mínimo 8 caracteres' }` |
| 400 | `{ message: 'Usuário já existe!' }` |
| 400 | `{ message: 'Esse e-mail não é válido!' }` |
| 500 | `{ message: 'Algo de inesperado aconteceu...' }` |

---

## 3. Autenticação (Login)

### Endpoint
`POST /v2/auth`

### Campos Obrigatórios
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `username` | string | Email do usuário |
| `password` | string | Senha em texto plano |
| `gcode` | string | Token do reCAPTCHA (ignorado em dev) |

### Fluxo de Autenticação

1. **Validar campos**
   - Verificar se `username` e `password` foram enviados

2. **Validar reCAPTCHA** (apenas em produção)
   ```javascript
   if (process.env.STAGE !== 'dev') {
     const grecaptcha = await validateRecaptcha({ recaptchaToken: gcode })
     if (!grecaptcha.success) {
       return failure({ message: 'Requisição inválida' }, 400)
     }
   }
   ```

3. **Buscar usuário por username**
   - Se não encontrar: retornar 404

4. **Verificar bloqueio temporário**
   ```javascript
   const isLocked = user.lockUntil && user.lockUntil > Date.now()
   ```
   - Se bloqueado: retornar 403 com tempo restante

5. **Verificar senha**
   - Criptografar senha enviada com SHA256
   - Buscar usuário com username + senha criptografada
   - Se não encontrar: registrar tentativa falha e retornar erro

6. **Verificar se usuário está ativo**
   - Se `active === false`: retornar 403

7. **Verificar sessão existente**
   - Se já existe sessão ativa: retornar 409 perguntando se deseja encerrar

8. **Gerar tokens**
   ```javascript
   const tokens = new TokenManager()
   const refreshToken = tokens.generateRefreshToken({ sub: { _id }, user: 1 })
   const accessToken = tokens.generateAccessToken({ sub: { _id }, user: 1 })
   ```

9. **Resetar contador de tentativas**

10. **Salvar sessão no banco**

11. **Registrar IP do usuário**

### Respostas

| Status | Mensagem |
|--------|----------|
| 200 | `{ accessToken, refreshToken }` |
| 400 | `{ message: 'Requisição inválida' }` |
| 400 | `{ message: 'Credenciais incompletas' }` |
| 403 | `{ message: 'Usuário bloqueado temporariamente...' }` |
| 403 | `{ message: 'Usuário inativo...' }` |
| 403 | `{ message: 'Senha inválida' }` |
| 404 | `{ message: 'Usuário não encontrado' }` |
| 409 | `{ message: 'Já existe uma sessão ativa...' }` |

---

## 4. Gerenciamento de Tokens

### TokenManager

```javascript
const TokenManager = require('./lib/token-manager')

// Configuração padrão
const tokens = new TokenManager(
  accessExpiresIn = '15min',
  refreshExpiresIn = process.env.JWT_EXPIRE
)

// Métodos disponíveis
tokens.generateAccessToken(payload)   // Token de acesso (15 min)
tokens.generateRefreshToken(payload)  // Token de refresh
tokens.verifyAccessToken(token)       // Verifica token de acesso
tokens.verifyRefreshToken(token)      // Verifica token de refresh
```

### Refresh Token

**Endpoint:** `POST /refresh`

Quando o `accessToken` expirar, usar o `refreshToken` para obter novos tokens.

---

## 5. Bloqueio por Tentativas Falhas

### Regras

- **Máximo de tentativas:** 5
- **Tempo de bloqueio:** 30 minutos

### Implementação

```javascript
// Verificar se está bloqueado
schema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > Date.now()
}

// Resetar contador após login bem-sucedido
schema.methods.resetCounter = function () {
  this.failedAttempts = 0
  return this.save()
}
```

---

## 6. Sessões

### Regras

- **Sessão única:** Apenas uma sessão ativa por usuário
- **Expiração:** Definida por `JWT_EXPIRE` no ambiente

### Operações

```javascript
// Salvar sessão
saveSession(userId, token)

// Buscar sessão por token
findSessionByToken(token)

// Revogar sessão (logout)
revokeSessionByToken(userId)

// Revogar todas as sessões
revokeAllSessionsByUserId(userId)
```

---

## 7. Alteração de Senha

### Endpoint
`POST /user/password`

### Regras

- Mínimo de 8 caracteres
- Não pode reusar senhas dos últimos 3 meses

### Fluxo

1. Validar tamanho mínimo (8 caracteres)
2. Verificar histórico de senhas (`usedPasswords`)
3. Criptografar nova senha com SHA256
4. Atualizar `password`, `usedPasswords` e `currentDatePassword`

---

## 8. Reset de Senha

### Fluxo

1. **Solicitar reset** - `POST /user/reset`
   - Gerar token de 32 bytes (hex)
   - Salvar token com TTL de 30 minutos
   - Enviar email com link de reset

2. **Validar token** - `GET /getResetToken/:id`
   - Verificar se token existe e é válido

3. **Atualizar senha** - `POST /updateUserPassword`
   - Validar token
   - Atualizar senha criptografada
   - Revogar todas as sessões
   - Deletar token usado

---

## 9. Dependências

```javascript
const shaJS = require('sha.js')              // Criptografia SHA256
const mongoose = require('mongoose')          // MongoDB ODM
```

---

## 10. Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `SECRET_TOKEN` | Chave secreta para assinar JWT |
| `JWT_EXPIRE` | Tempo de expiração do refresh token |
| `STAGE` | Ambiente (dev/prod) - dev ignora reCAPTCHA |
