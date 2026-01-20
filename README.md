# Backend MSL App

Backend API para sistema MSL (Medical Science Liaison) - Gestão de relacionamento com Key Opinion Leaders (KOLs).

## Stack Tecnológica

- **Runtime:** Node.js 18.x+
- **Framework Web:** Express 4.x
- **Deploy:** Serverless Framework (AWS Lambda)
- **Banco de Dados:** MongoDB 6.x com Mongoose 8.x
- **Autenticação:** JWT (jsonwebtoken) + API Key
- **Estilo de Código:** Standard JS (funcional, sem classes)

## Estrutura do Projeto

```
backend-msl-app/
├── handler.js              # Entry point - configura Express e rotas
├── routes.json             # Definição de todas as rotas da API
├── serverless.yml          # Configuração do Serverless Framework
├── package.json
├── config.dev.json         # Variáveis de ambiente dev
├── config.prod.json        # Variáveis de ambiente produção
│
├── lib/                    # Utilitários
│   ├── db.js              # Conexão MongoDB
│   ├── response.js        # Formatação de respostas
│   ├── authorize.js       # Middleware de autenticação
│   ├── debug.js           # Logging
│   └── upload.js          # Upload de arquivos
│
├── models/                # Schemas Mongoose
│   ├── kol.js
│   ├── visit.js
│   ├── document.js
│   ├── audio.js
│   └── client.js
│
├── controllers/           # Lógica de Negócio
│   ├── kol.js
│   ├── visit.js
│   ├── document.js
│   ├── briefing.js
│   ├── dashboard.js
│   ├── chat.js
│   ├── sync.js
│   ├── seed.js
│   ├── audio.js
│   └── auth.js
│
├── interfaces/            # Controllers HTTP
│   ├── kol.js
│   ├── visit.js
│   ├── document.js
│   ├── briefing.js
│   ├── dashboard.js
│   ├── chat.js
│   ├── sync.js
│   ├── seed.js
│   └── audio.js
│
└── api/                   # Integrações Externas
    └── transcription.js   # Serviço Speech-to-Text
```

## Instalação

```bash
npm install
```

## Configuração

1. Copie `config.dev.json` e ajuste as variáveis:
   - `DB_URL`: URL de conexão do MongoDB
   - `SECRET_TOKEN`: Token secreto para JWT

2. Para produção, configure variáveis de ambiente:
   - `DB_URL`
   - `SECRET_TOKEN`

## Execução

### Desenvolvimento Local

```bash
npm run dev
```

### Serverless Offline

```bash
npm run offline
```

### Deploy

```bash
serverless deploy --stage prod
```

## Autenticação

A API requer autenticação via:
- **X-API-Key**: Header obrigatório para todas as rotas (exceto seed em dev)
- **Authorization**: Bearer token JWT

## Endpoints Principais

### KOLs
- `GET /api/kols` - Listar KOLs
- `GET /api/kols/:id` - Obter KOL específico
- `POST /api/kols` - Criar novo KOL
- `PUT /api/kols/:id` - Atualizar KOL
- `DELETE /api/kols/:id` - Deletar KOL

### Visitas
- `GET /api/visits` - Listar visitas
- `GET /api/visits/:id` - Obter visita específica
- `POST /api/visits` - Criar nova visita
- `PUT /api/visits/:id` - Atualizar visita
- `DELETE /api/visits/:id` - Deletar visita

### Documentos
- `GET /api/documents` - Listar documentos
- `GET /api/documents/:id` - Obter documento específico
- `POST /api/documents` - Criar documento
- `PUT /api/documents/:id` - Atualizar documento
- `DELETE /api/documents/:id` - Deletar documento

### Briefings
- `GET /api/briefings/:kolId` - Obter briefing para KOL

### Dashboard
- `GET /api/dashboard/metrics` - Obter métricas do dashboard

### Chat
- `POST /api/chat/message` - Enviar mensagem ao chat

### Sync
- `POST /api/sync` - Sincronizar dados

### Seed (Dev)
- `POST /api/data/seed` - Popular dados iniciais

### Áudio
- `POST /api/visits/:visitId/audio` - Upload de áudio
- `GET /api/visits/:visitId/audio/:audioId` - Status da transcrição
- `PUT /api/visits/:visitId/audio/:audioId/transcript` - Atualizar transcrição
- `DELETE /api/visits/:visitId/audio/:audioId` - Deletar áudio

## Documentação Completa

Consulte `API_SPECIFICATION.md` para documentação completa de todos os endpoints.

## Notas

- O sistema segue padrão funcional (sem classes)
- Todas as rotas são definidas em `routes.json`
- Validações e tratamento de erros estão implementados
- Transcrição de áudio requer integração com serviço externo (OpenAI Whisper, Google Cloud Speech-to-Text, etc.)
