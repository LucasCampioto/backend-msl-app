# Documentação Swagger/OpenAPI

Este projeto inclui documentação completa da API em formato OpenAPI 3.0.

## Arquivo

- `swagger.yaml` - Especificação OpenAPI 3.0 completa com todas as rotas

## Como Visualizar

### Opção 1: Swagger UI Online

1. Acesse https://editor.swagger.io/
2. Cole o conteúdo do arquivo `swagger.yaml`
3. Visualize e teste a API interativamente

### Opção 2: Swagger UI Local

1. Instale o Swagger UI:
```bash
npm install -g swagger-ui-serve
```

2. Execute:
```bash
swagger-ui-serve swagger.yaml
```

3. Acesse http://localhost:3001

### Opção 3: Redoc

1. Instale o Redoc:
```bash
npm install -g redoc-cli
```

2. Execute:
```bash
redoc-cli serve swagger.yaml
```

3. Acesse http://localhost:8080

### Opção 4: Integrar no Projeto

Adicione o Swagger UI ao projeto:

```bash
npm install swagger-ui-express swagger-jsdoc --save-dev
```

E configure no `handler.js`:

```javascript
const swaggerUi = require('swagger-ui-express')
const swaggerDocument = require('./swagger.yaml')

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
```

Acesse: http://localhost:3000/api-docs

## Estrutura da Documentação

A documentação inclui:

- **26 endpoints** completos
- **Schemas** para todos os modelos (KOL, Visit, Document, etc.)
- **Autenticação** (API Key + JWT)
- **Parâmetros** de query, path e body
- **Respostas** com exemplos
- **Códigos de erro** padronizados

## Endpoints Documentados

### KOLs (5 endpoints)
- GET /api/kols - Listar
- GET /api/kols/{id} - Obter
- POST /api/kols - Criar
- PUT /api/kols/{id} - Atualizar
- DELETE /api/kols/{id} - Deletar

### Visits (5 endpoints)
- GET /api/visits - Listar
- GET /api/visits/{id} - Obter
- POST /api/visits - Criar
- PUT /api/visits/{id} - Atualizar
- DELETE /api/visits/{id} - Deletar

### Documents (5 endpoints)
- GET /api/documents - Listar
- GET /api/documents/{id} - Obter
- POST /api/documents - Criar
- PUT /api/documents/{id} - Atualizar
- DELETE /api/documents/{id} - Deletar

### Briefings (1 endpoint)
- GET /api/briefings/{kolId} - Obter briefing

### Dashboard (1 endpoint)
- GET /api/dashboard/metrics - Obter métricas

### Chat (1 endpoint)
- POST /api/chat/message - Enviar mensagem

### Sync (1 endpoint)
- POST /api/sync - Sincronizar dados

### Seed (1 endpoint)
- POST /api/data/seed - Popular dados (dev)

### Audio (4 endpoints)
- POST /api/visits/{visitId}/audio - Upload
- GET /api/visits/{visitId}/audio/{audioId} - Status
- PUT /api/visits/{visitId}/audio/{audioId}/transcript - Atualizar transcrição
- DELETE /api/visits/{visitId}/audio/{audioId} - Deletar

## Autenticação

A documentação especifica dois métodos de autenticação:

1. **API Key** (Header: `X-API-Key`)
2. **JWT Bearer Token** (Header: `Authorization: Bearer <token>`)

Ambos são necessários para a maioria dos endpoints (exceto `/api/data/seed` em dev).

## Atualização

Quando adicionar novos endpoints ou modificar existentes:

1. Atualize o arquivo `swagger.yaml`
2. Mantenha os schemas sincronizados com os models
3. Atualize exemplos de request/response se necessário
