# Instruções para Criar um Backend Node.js - Arquitetura example

Este documento descreve a arquitetura e padrões utilizados para criar um backend Node.js com Express, Serverless Framework e MongoDB, seguindo o padrão funcional (sem classes/OOP).

# Instruções de Agente — JavaScript Funcional e Simples

## Princípios Centrais
**KISS (Keep It Simple, Stupid)** — o código deve ser direto, legível e fácil de manter. Evite abstrações desnecessárias e padrões complexos.

## Regras
- **Sem classes, sem factories** → apenas funções simples e diretas  
- **Uma responsabilidade por arquivo** → um propósito claro por módulo  
- **Funções puras por padrão** → isole I/O em `adapters/` ou `services/`  
- **Composição simples** → combine funções pequenas de forma direta  
- **Parâmetros explícitos** → passe dependências como parâmetros quando necessário  
- **Nomes claros** → descritivos e autoexplicativos  
- **Comentários em português** → comentários concisos em português quando necessário 

## Antipadrões a Evitar

❌ **Superabstração**
```js
const makeUserFactory = (deps) => makeService(deps)(makeUserMethods);
```

✅ **Mantenha simples**
```js
async function createUser(name, email) { /* ... */ }
```

❌ **Wrappers desnecessários**
```js
const withErrorHandler = (fn) => async (...args) => { /* ... */ };
```

✅ **Trate erros diretamente**
```js
async function handler(event) {
  try { /* ... */ }
  catch (error) { /* ... */ }
}
```

## Checklist de Saída
- [ ] Sem classes ou factories  
- [ ] Funções simples e diretas  
- [ ] Um propósito claro por arquivo    
- [ ] Parâmetros explícitos  
- [ ] Nomes descritivos  
- [ ] Fácil de testar  
- [ ] Fácil de entender e manter  

versão definitiva 

---

## Stack Tecnológica

- **Runtime:** Node.js 16.x+
- **Framework Web:** Express 4.x
- **Deploy:** Serverless Framework (AWS Lambda)
- **Banco de Dados:** MongoDB 6.x com Mongoose 8.x (ODM)
- **Autenticação:** JWT (jsonwebtoken)
- **Estilo de Código:** Standard JS (funcional, sem classes)

---

## Estrutura de Pastas

```
projeto/
├── handler.js              # Entry point - configura Express e rotas
├── routes.json             # Definição de todas as rotas da API
├── serverless.yml          # Configuração do Serverless Framework
├── package.json
├── config.{stage}.json     # Variáveis de ambiente por stage
│
├── interfaces/             # Camada de Interface (Controllers HTTP)
│   ├── user.js
│   ├── client.js
│   └── ...
│
├── controllers/            # Camada de Negócio (Business Logic)
│   ├── auth.js
│   ├── user.js
│   └── ...
│
├── models/                 # Camada de Dados (Mongoose Schemas)
│   ├── user.js
│   ├── client.js
│   └── ...
│
├── api/                    # Integrações Externas
│   ├── mailService.js
│   ├── watson.js
│   └── ...
│
└── lib/                    # Utilitários e Helpers
    ├── db.js               # Conexão MongoDB
    ├── response.js         # Formatação de respostas
    ├── authorize.js        # Middleware de autenticação
    ├── debug.js            # Logging
    └── ...
```

---

## Handler Principal (handler.js)

O `handler.js` é o ponto de entrada da aplicação. Configura Express e carrega rotas dinamicamente do `routes.json`.

```javascript
const serverless = require('serverless-http')
const express = require('express')
const cors = require('cors')
const routes = require('./routes.json')
const { info, error } = require('./lib/debug')
const helmet = require('helmet')
const { connect } = require('./lib/db')

const app = express()
app.options('*', cors())
app.use(cors())

// Configuração de segurança com Helmet
const configHelmet = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"]
    }
  },
  crossOriginOpenerPolicy: true,
  strictTransportSecurity: true,
  frameguard: { action: 'sameorigin' }
}
app.use(helmet(configHelmet))

// Middleware de validação de API Key
const validateApiKey = isPrivate => {
  return (req, res, next) => {
    if (isPrivate === false) return next()

    const apiKey = req.headers['x-api-key'] || req.headers['X-API-KEY']
    if (!apiKey) {
      error('Acesso negado: X-API-KEY não fornecida', { path: req.path })
      return res.status(401).json({ message: 'Forbidden' })
    }
    next()
  }
}

// Roteador dinâmico - carrega rotas do routes.json
const dynamicRouter = new express.Router()
for (const config of routes) {
  const filePath = config.handler.split('.')
  const file = require(`./${filePath[0]}`)

  const handler = async (req, res) => {
    await connect()

    const event = {
      ...req.event,
      pathParameters: req.params
    }
    info(req.method, filePath, event)

    const result = await file[filePath[1]](event, req.context)
    res.header(result.headers)
    res.status(result.statusCode).send(result.body)
  }

  const path = `/${config.path}`
  const isPrivate = config.private !== false

  dynamicRouter[config.method](path, validateApiKey(isPrivate), handler)
}

app.use('/', dynamicRouter)
app.use((req, res, next) => res.sendStatus(404))
app.use((err, req, res, next) => {
  error('ROUTER', err)
  res.sendStatus(400)
})

module.exports = {
  index: serverless(app, {
    binary: ['multipart/form-data'],
    request: function (req, event, context) {
      req.event = event
      req.context = context
    }
  })
}
```

---

## Sistema de Rotas (routes.json)

Todas as rotas são definidas em um arquivo JSON centralizado. Cada rota especifica:
- `handler`: caminho do arquivo e função a ser executada
- `path`: endpoint da rota (suporta parâmetros com `:param`)
- `method`: método HTTP (get, post, put, delete, patch)
- `private`: se `false`, não requer X-API-KEY (padrão: true)

```json
[
  {
    "handler": "interfaces/user.auth",
    "path": "auth",
    "method": "post"
  },
  {
    "handler": "interfaces/user.list",
    "path": "users/:id",
    "method": "get"
  },
  {
    "handler": "interfaces/client.create",
    "path": "clients",
    "method": "post"
  },
  {
    "handler": "interfaces/client.findById",
    "path": "clients/:id",
    "method": "get"
  },
  {
    "handler": "interfaces/webhook.receive",
    "path": "v1/webhook/receive",
    "method": "post",
    "private": false
  }
]
```

**Padrão de nomenclatura do handler:** `pasta/arquivo.funcao`
- `interfaces/user.auth` → arquivo `interfaces/user.js`, função `auth`

---

## Camada de Interface (interfaces/)

A camada de interface recebe requisições HTTP, valida entrada, chama controllers e retorna respostas formatadas.

### Padrão de uma Interface

```javascript
// interfaces/example.js

// Libs
const db = require('../lib/db')
const authorize = require('../lib/authorize')
const { success, failure } = require('../lib/response')
const { info, error } = require('../lib/debug')

// Controllers
const exampleController = require('../controllers/example')

// Models (quando necessário acesso direto)
const ExampleDB = require('../models/example')

/**
 * GET /examples/:id
 * Lista exemplos por organização
 */
const list = async event => {
  await db.connect()

  try {
    // 1. Validar autenticação
    const user = await authorize.validateUser(event)

    // 2. Extrair parâmetros
    const { pathParameters, queryStringParameters } = event
    const { id } = pathParameters
    const { page = 1, limit = 20 } = queryStringParameters || {}

    // 3. Log da operação
    info(`Usuário ${user?.sub?._id} listou exemplos da org ${id}`)

    // 4. Chamar controller
    const data = await exampleController.findByOrganization(id, { page, limit })

    // 5. Retornar sucesso
    return success(data)
  } catch (err) {
    error('Example.list', err)
    return failure({ message: err.message }, err.code || 400)
  }
}

/**
 * POST /examples
 * Cria novo exemplo
 */
const create = async event => {
  await db.connect()

  try {
    const user = await authorize.validateUser(event)

    // Parse do body
    const body = JSON.parse(event.body)
    const { name, description } = body

    // Validações
    if (!name) {
      return failure({ message: 'Nome é obrigatório' }, 400)
    }

    const result = await exampleController.create({
      name,
      description,
      createdBy: user.sub._id
    })

    return success(result, 201)
  } catch (err) {
    error('Example.create', err)
    return failure({ message: err.message }, err.code || 400)
  }
}

/**
 * PUT /examples/:id
 * Atualiza exemplo
 */
const update = async event => {
  await db.connect()

  try {
    const user = await authorize.validateUser(event)
    const { id } = event.pathParameters
    const body = JSON.parse(event.body)

    const result = await exampleController.update(id, body, user)

    return success(result)
  } catch (err) {
    error('Example.update', err)
    return failure({ message: err.message }, err.code || 400)
  }
}

/**
 * DELETE /examples/:id
 * Remove exemplo
 */
const remove = async event => {
  await db.connect()

  try {
    const user = await authorize.validateUser(event)
    const { id } = event.pathParameters

    await exampleController.delete(id, user)

    return success({ message: 'Removido com sucesso' })
  } catch (err) {
    error('Example.remove', err)
    return failure({ message: err.message }, err.code || 400)
  }
}

// Exportar todas as funções
module.exports = {
  list,
  create,
  update,
  remove
}
```

---

## Camada de Controller (controllers/)

Controllers contêm a lógica de negócio. Não conhecem HTTP - trabalham apenas com dados.

### Padrão de um Controller

```javascript
// controllers/example.js

// Libs
const { error } = require('../lib/debug')

// Models
const ExampleDB = require('../models/example')

/**
 * Busca por ID
 */
module.exports.findById = async id => {
  const example = await ExampleDB.findById(id)
  if (!example) throw new Error('Exemplo não encontrado')
  return example
}

/**
 * Busca por organização
 */
module.exports.findByOrganization = async (organizationId, options = {}) => {
  const { page = 1, limit = 20 } = options
  const skip = (page - 1) * limit

  const examples = await ExampleDB.find({ organization: organizationId })
    .sort({ created: -1 })
    .skip(skip)
    .limit(parseInt(limit))

  const total = await ExampleDB.countDocuments({ organization: organizationId })

  return {
    data: examples,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  }
}

/**
 * Cria novo registro
 */
module.exports.create = async data => {
  try {
    const instance = new ExampleDB({
      ...data,
      created: new Date()
    })
    await instance.save()
    return instance
  } catch (ex) {
    error('Example.create', ex)
    throw ex
  }
}

/**
 * Atualiza registro
 */
module.exports.update = async (id, data, user) => {
  const example = await ExampleDB.findById(id)
  if (!example) throw new Error('Exemplo não encontrado')

  Object.assign(example, data)
  example.updatedBy = user.sub._id
  example.updated = new Date()

  await example.save()
  return example
}

/**
 * Remove registro
 */
module.exports.delete = async (id, user) => {
  const example = await ExampleDB.findById(id)
  if (!example) throw new Error('Exemplo não encontrado')

  await ExampleDB.deleteOne({ _id: id })
  return true
}

/**
 * Aggregation pipeline
 */
module.exports.aggregate = async pipeline => {
  const results = await ExampleDB.aggregate(pipeline)
  return results
}
```

---

## Camada de Model (models/)

Models definem schemas Mongoose e encapsulam acesso ao MongoDB.

### Padrão de um Model

```javascript
// models/example.js

const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  // Campos de auditoria
  created: {
    type: Date,
    default: Date.now
  },
  updated: {
    type: Date
  },
  createdBy: {
    type: mongoose.Types.ObjectId,
    ref: 'example_users'
  },

  // Campos do domínio
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  active: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },

  // Relacionamentos
  organization: {
    type: mongoose.Types.ObjectId,
    ref: 'example_organizations',
    required: true,
    index: true
  },

  // Campos complexos
  metadata: {
    type: Object,
    default: {}
  },
  tags: [{
    type: String
  }],

  // Soft delete
  canceled: {
    type: Boolean,
    default: false,
    index: true
  }
})

// Middleware - Popular relacionamentos automaticamente
const relationship = function (next) {
  this.populate('organization')
  next()
}
schema.pre('find', relationship)
schema.pre('findOne', relationship)

// Métodos de instância
schema.methods.markAsCompleted = function () {
  this.status = 'completed'
  this.updated = new Date()
  return this.save()
}

// Índices compostos
schema.index({ organization: 1, created: -1 })
schema.index({ status: 1, created: -1 })

// Exportar modelo (pattern para evitar recompilação)
module.exports =
  mongoose.models.example_examples || mongoose.model('example_examples', schema)
```

---

## Utilitários (lib/)

### lib/db.js - Conexão MongoDB

```javascript
const mongoose = require('mongoose')
const { error } = require('./debug')

mongoose.Promise = global.Promise
let isConnected

const connect = connectionString => {
  try {
    if (isConnected) return Promise.resolve()

    const options = {
      maxPoolSize: 10,
      minPoolSize: 1,
      socketTimeoutMS: 15 * 60 * 1000,
      connectTimeoutMS: 15 * 60 * 1000,
      serverSelectionTimeoutMS: 5000
    }

    mongoose.set('strictQuery', false)
    return mongoose
      .connect(connectionString || process.env.DB_URL, options)
      .then(db => {
        isConnected = db.connections[0].readyState
      })
      .catch(ex => {
        error('DB.CONNECT', ex.message)
        throw new Error(ex)
      })
  } catch (ex) {
    error('DB.CONNECT', ex)
  }
}

const close = async () => {
  // Em Lambda, não fechamos conexões (warm start optimization)
  return true
}

module.exports = { connect, close }
```

### lib/response.js - Formatação de Respostas

```javascript
module.exports = {
  success: (body, statusCode = 200, text = false) => {
    const bodyData = text ? body : JSON.stringify(body)
    return {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Methods': '*',
        'Access-Control-Allow-Origin': '*'
      },
      statusCode,
      body: bodyData
    }
  },
  failure: (body, statusCode = 400) => {
    return {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Methods': '*',
        'Access-Control-Allow-Origin': '*'
      },
      statusCode,
      body: JSON.stringify(body)
    }
  }
}
```

### lib/authorize.js - Autenticação JWT

```javascript
const jwt = require('jsonwebtoken')
const authAPI = require('../controllers/auth')
const { error } = require('./debug')

const toLowerHeaders = headers => {
  return Object.keys(headers).reduce((c, k) => {
    c[k.toLowerCase()] = headers[k]
    return c
  }, {})
}

const getKey = async event => {
  const headers = toLowerHeaders(event.headers)
  if (headers['x-api-key']) {
    const client = await authAPI.findByToken(headers['x-api-key'])
    return client
  }
  throw new Error('Token inválido')
}

const getToken = async event => {
  const headers = toLowerHeaders(event.headers)
  try {
    const { authorization } = headers
    if (authorization) {
      const bearer = authorization.split(' ')
      const bearerToken = bearer[1]
      return {
        user: jwt.verify(bearerToken, process.env.SECRET_TOKEN),
        bearerToken
      }
    }
    throw new Error('Token inválido')
  } catch (ex) {
    error('GETTOKEN', ex.message)
    return null
  }
}

const validateUser = async event => {
  await getKey(event)
  const tokenData = await getToken(event)
  if (!tokenData) {
    const err = new Error('Token inválido ou expirado')
    err.code = 401
    throw err
  }
  return tokenData.user
}

module.exports = { getKey, getToken, validateUser }
```

### lib/debug.js - Logging

```javascript
module.exports = {
  info: async (...params) => {
    try {
      console.log(JSON.stringify(params, null, 2))
    } catch (ex) {
      console.error('DEBUG.INFO', params, ex.message)
    }
  },
  error: async (...params) => {
    if (params.length <= 0) return false
    try {
      console.error(JSON.stringify(params, null, 2))
    } catch (ex) {
      console.error('DEBUG.ERROR', params, ex.message)
    }
  }
}
```

---

## Padrões de Código

### 1. Programação Funcional (Sem Classes)

```javascript
// CORRETO - Exportar funções
module.exports.findById = async id => { ... }
module.exports.create = async data => { ... }

// INCORRETO - Não usar classes
class ExampleService { ... }
```

### 2. Tratamento de Erros

```javascript
// Na interface
try {
  const result = await controller.action()
  return success(result)
} catch (err) {
  error('Context.action', err)
  return failure({ message: err.message }, err.code || 400)
}

// No controller - lançar erros com código
const err = new Error('Recurso não encontrado')
err.code = 404
throw err
```

### 3. Validação de Parâmetros

```javascript
const { pathParameters, queryStringParameters, body } = event

// Path params
const { id } = pathParameters

// Query params com defaults
const { page = 1, limit = 20, status } = queryStringParameters || {}

// Body
const data = JSON.parse(event.body)
```

### 4. Autenticação

Toda rota privada deve validar o usuário:

```javascript
const user = await authorize.validateUser(event)
// user.sub contém dados do usuário logado
// user.sub._id = ID do usuário
// user.sub.organization = ID da organização
```

---

## Configuração Serverless (serverless.yml)

```yaml
service: minha-api

provider:
  name: aws
  runtime: nodejs16.x
  stage: ${opt:stage, 'dev'}
  region: us-east-1
  timeout: 30
  memorySize: 1024
  environment:
    STAGE: ${self:provider.stage}
    DB_URL: ${file(./config.${self:provider.stage}.json):DB_URL}
    SECRET_TOKEN: ${file(./config.${self:provider.stage}.json):SECRET_TOKEN}

functions:
  app:
    handler: handler.index
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true

plugins:
  - serverless-offline
```

---

## Checklist para Criar Nova Funcionalidade

1. [ ] Adicionar rota no `routes.json`
2. [ ] Criar/atualizar interface em `interfaces/`
3. [ ] Criar/atualizar controller em `controllers/`
4. [ ] Criar/atualizar model em `models/` (se necessário)
5. [ ] Adicionar validação de entrada
6. [ ] Adicionar tratamento de erros
7. [ ] Adicionar logs relevantes
8. [ ] Testar localmente com `npm run dev`
9. [ ] Executar linter: `npm run standard`

---

## Exemplos de Endpoints Completos

### GET com Paginação e Filtros

```json
// routes.json
{
  "handler": "interfaces/product.list",
  "path": "products/:organizationId",
  "method": "get"
}
```

```javascript
// interfaces/product.js
const list = async event => {
  await db.connect()
  try {
    const user = await authorize.validateUser(event)
    const { organizationId } = event.pathParameters
    const { page, limit, status, search } = event.queryStringParameters || {}

    const filters = { status, search }
    const data = await productController.list(organizationId, { page, limit, filters })

    return success(data)
  } catch (err) {
    error('Product.list', err)
    return failure({ message: err.message }, err.code || 400)
  }
}
```

### POST com Validação

```json
{
  "handler": "interfaces/product.create",
  "path": "products/:organizationId",
  "method": "post"
}
```

```javascript
const create = async event => {
  await db.connect()
  try {
    const user = await authorize.validateUser(event)
    const { organizationId } = event.pathParameters
    const body = JSON.parse(event.body)

    // Validações
    if (!body.name) return failure({ message: 'Nome obrigatório' }, 400)
    if (!body.price) return failure({ message: 'Preço obrigatório' }, 400)

    const data = await productController.create({
      ...body,
      organization: organizationId,
      createdBy: user.sub._id
    })

    return success(data, 201)
  } catch (err) {
    error('Product.create', err)
    return failure({ message: err.message }, err.code || 400)
  }
}
```

---

## Dependências Principais (package.json)

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "serverless-http": "^3.2.0",
    "mongoose": "^8.0.0",
    "jsonwebtoken": "^9.0.0",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "axios": "^1.6.0",
    "moment": "^2.29.4",
    "sha.js": "^2.4.11"
  },
  "devDependencies": {
    "serverless-offline": "^13.0.0",
    "standard": "^17.0.0",
    "nodemon": "^3.0.0",
    "jest": "^29.0.0"
  },
  "scripts": {
    "dev": "nodemon handler.js",
    "offline": "serverless offline",
    "standard": "standard --fix",
    "test": "jest"
  }
}
```
