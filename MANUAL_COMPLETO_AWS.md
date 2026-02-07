# 📘 Manual Completo - Deploy Backend MSL na AWS Lambda

**Data:** 2026-02-07
**Autor:** Claude Code
**Versão:** 1.0
**Ambiente:** Produção (AWS Lambda)

---

## 📑 Índice

1. [Introdução](#introdução)
2. [Como Funciona AWS Lambda + API Gateway](#como-funciona-aws-lambda--api-gateway)
3. [Configuração Inicial](#configuração-inicial)
4. [Criar Usuário IAM na AWS](#criar-usuário-iam-na-aws)
5. [Configurar Credenciais Localmente](#configurar-credenciais-localmente)
6. [Arquivos de Configuração](#arquivos-de-configuração)
7. [Processo de Deploy](#processo-de-deploy)
8. [URL Customizada](#url-customizada)
9. [Testes e Validação](#testes-e-validação)
10. [Monitoramento e Logs](#monitoramento-e-logs)
11. [Troubleshooting](#troubleshooting)
12. [Custos e Otimização](#custos-e-otimização)
13. [Segurança](#segurança)
14. [Comandos Úteis](#comandos-úteis)

---

## 📖 Introdução

Este manual documenta todo o processo de deploy do **Backend MSL App** (Medical Science Liaison) na AWS Lambda usando Serverless Framework.

### Stack Tecnológica

- **Runtime:** Node.js 18.x
- **Framework:** Express.js
- **Deploy:** Serverless Framework
- **Cloud Provider:** AWS (Lambda + API Gateway)
- **Banco de Dados:** MongoDB Atlas
- **Autenticação:** JWT + API Key

### O que você vai aprender

✅ Como funciona a arquitetura serverless
✅ Criar e configurar usuário IAM na AWS
✅ Fazer deploy via Serverless Framework
✅ Configurar URL customizada (custom domain)
✅ Monitorar e debugar aplicação em produção
✅ Otimizar custos e performance

---

## 🏗️ Como Funciona AWS Lambda + API Gateway

### Conceito Geral

**Serverless** significa que você não gerencia servidores. A AWS cuida de:
- Provisionamento de infraestrutura
- Scaling automático
- Alta disponibilidade
- Patches de segurança

Você só paga pelo que usar (por execução).

---

### Arquitetura Completa

```
┌─────────────────────────────────────────────────────────────┐
│                    INTERNET (Clientes)                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTPS Request
                         │ GET /api/kols
                         │
                         ↓
┌────────────────────────────────────────────────────────────┐
│              AWS API GATEWAY (Regional)                    │
│  URL: https://xxxxx.execute-api.us-east-1.amazonaws.com   │
├────────────────────────────────────────────────────────────┤
│  • Recebe requisição HTTP                                  │
│  • Valida CORS                                             │
│  • Aplica rate limiting (throttling)                       │
│  • Gerencia stages (dev, prod)                             │
│  • Valida API Keys                                         │
│  • Logs de acesso                                          │
└────────────────────────┬───────────────────────────────────┘
                         │
                         │ Event Trigger
                         │ (converte HTTP → JSON event)
                         │
                         ↓
┌────────────────────────────────────────────────────────────┐
│               AWS LAMBDA FUNCTION                          │
│  Nome: backend-msl-app-prod-app                            │
│  Runtime: Node.js 18.x                                     │
│  Memória: 1024 MB (1 GB)                                   │
│  Timeout: 30 segundos                                      │
├────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────┐                 │
│  │  Container Efêmero (Cold Start)      │                 │
│  │  • Inicia ambiente Node.js           │                 │
│  │  • Carrega dependências (node_modules)                 │
│  │  • Executa handler.js                │                 │
│  │  • Inicializa Express app            │                 │
│  └──────────────────────────────────────┘                 │
│                         │                                  │
│                         ↓                                  │
│  ┌──────────────────────────────────────┐                 │
│  │  Express Application                 │                 │
│  │  • Processa rotas (routes.json)      │                 │
│  │  • Middleware de autenticação        │                 │
│  │  • Executa controllers               │                 │
│  │  • Valida dados (Mongoose)           │                 │
│  └──────────────────────────────────────┘                 │
└────────────────────────┬───────────────────────────────────┘
                         │
                         │ MongoDB Query
                         │
                         ↓
┌────────────────────────────────────────────────────────────┐
│                  MONGODB ATLAS                             │
│  Cluster: msl-app.qbxqviy.mongodb.net                      │
│  Database: msl-app                                         │
├────────────────────────────────────────────────────────────┤
│  • Collections: kols, visits, documents, audios, clients   │
│  • Índices otimizados                                      │
│  • Backup automático                                       │
│  • Replica Set (alta disponibilidade)                      │
└────────────────────────┬───────────────────────────────────┘
                         │
                         │ Response Data
                         │
                         ↓
┌────────────────────────────────────────────────────────────┐
│               RETORNO DA RESPOSTA                          │
├────────────────────────────────────────────────────────────┤
│  Lambda → API Gateway → Cliente                            │
│  • Formata JSON                                            │
│  • Adiciona headers (CORS, Security)                       │
│  • Status code (200, 400, 500)                             │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                  LOGS E MONITORAMENTO                      │
├────────────────────────────────────────────────────────────┤
│  AWS CloudWatch Logs                                       │
│  • Log Group: /aws/lambda/backend-msl-app-prod-app         │
│  • Métricas: Invocations, Errors, Duration, Throttles      │
│  • Alarmes configuráveis                                   │
│  • Retention: 7-30 dias (configurável)                     │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                  RECURSOS ADICIONAIS                       │
├────────────────────────────────────────────────────────────┤
│  • S3 Bucket (deployment artifacts)                        │
│  • IAM Roles (permissões da Lambda)                        │
│  • CloudFormation Stack (infraestrutura como código)       │
│  • Route 53 (DNS - opcional para custom domain)            │
│  • ACM (SSL/TLS certificates - opcional)                   │
└────────────────────────────────────────────────────────────┘
```

---

### Como funciona na prática?

#### 1️⃣ **Cliente faz requisição**

```bash
GET https://7xd18364z4.execute-api.us-east-1.amazonaws.com/prod/api/kols
Headers:
  X-API-Key: F8mhwFjI2Ueo2BqPWr6AXC2Z-YpS073JJqstcVk
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 2️⃣ **API Gateway processa**

- Valida CORS
- Verifica rate limiting
- Registra log de acesso
- Converte HTTP em evento JSON

Evento gerado:
```json
{
  "httpMethod": "GET",
  "path": "/api/kols",
  "headers": {
    "X-API-Key": "F8mhwFjI2Ueo2BqPWr6AXC2Z-YpS073JJqstcVk",
    "Authorization": "Bearer eyJ..."
  },
  "queryStringParameters": null,
  "body": null
}
```

#### 3️⃣ **Lambda executa**

```javascript
// handler.js
const serverless = require('serverless-http');
const app = require('./app'); // Express app

module.exports.index = serverless(app);
```

**Fluxo interno:**
1. Cold Start (se necessário): ~1-3 segundos
2. Warm Start: ~50-200ms
3. Express processa rota
4. Controller executa lógica
5. MongoDB consulta dados
6. Retorna resposta

#### 4️⃣ **Resposta retorna ao cliente**

```json
{
  "statusCode": 200,
  "headers": {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json"
  },
  "body": "{\"data\":[{\"id\":\"...\",\"name\":\"Dr. João Silva\"}]}"
}
```

---

### Cold Start vs Warm Start

#### **Cold Start** (primeira requisição)
- Lambda precisa inicializar container
- Carrega código e dependências
- Conecta ao MongoDB
- **Tempo:** 1-3 segundos

#### **Warm Start** (requisições subsequentes)
- Container já está ativo
- Conexão MongoDB já aberta
- **Tempo:** 50-200ms

**Otimizações:**
- Provisioned Concurrency (mantém containers ativos)
- Connection pooling do MongoDB
- Lazy loading de módulos

---

### Por que não precisa criar manualmente?

❌ **Você NÃO precisa:**
- Criar Lambda Function manualmente
- Criar API Gateway manualmente
- Conectar um ao outro
- Configurar IAM Roles
- Criar bucket S3

✅ **Serverless Framework faz tudo automaticamente!**

Quando você roda `serverless deploy`:
1. Lê o `serverless.yml`
2. Cria CloudFormation template
3. Provisiona todos os recursos
4. Faz upload do código
5. Conecta tudo
6. Retorna a URL final

---

## ⚙️ Configuração Inicial

### Pré-requisitos

- ✅ Node.js 18.x ou superior
- ✅ Conta AWS ativa
- ✅ MongoDB Atlas configurado
- ✅ Git instalado

### Verificar instalações

```bash
# Node.js
node --version  # >= 18.x

# npm
npm --version

# Git
git --version

# Serverless Framework
npx serverless --version  # >= 3.x
```

---

## 👤 Criar Usuário IAM na AWS

### Por que criar um usuário IAM?

- **Segurança:** Não usar conta root da AWS
- **Permissões granulares:** Dar apenas as permissões necessárias
- **Auditoria:** Rastrear quem fez o quê
- **Revogação:** Fácil remover acesso se necessário

---

### Passo a Passo Completo

#### **Step 1: Acessar Console IAM**

1. Acesse: https://console.aws.amazon.com/iam/
2. Faça login com sua conta AWS (root ou admin)
3. No menu lateral, clique em **"Users"**
4. Clique em **"Create user"** (botão laranja)

---

#### **Step 2: Specify user details**

**Configurações:**

- **User name:** `msl-app` (ou outro nome de sua preferência)
- **Provide user access to AWS Management Console:** ❌ **NÃO MARQUE**
  - Você só precisa de acesso programático (CLI/API)
  - Não precisa de acesso ao console web

Clique em **"Next"** →

---

#### **Step 3: Set permissions**

Aqui você define o que o usuário pode fazer na AWS.

##### **Opção 1: Permissões Completas (Recomendado para começar)**

1. Selecione: **"Attach policies directly"**
2. Na busca, digite: `AdministratorAccess`
3. Marque: ✅ **AdministratorAccess**
4. Clique em **"Next"**

> ⚠️ **Nota:** Esta opção dá acesso total. Use apenas para testes/desenvolvimento.

---

##### **Opção 2: Permissões Específicas (Recomendado para produção)**

1. Selecione: **"Attach policies directly"**
2. Na busca, procure e marque:

   ✅ **AmazonS3FullAccess**
   - Criar/gerenciar buckets S3 para deployment

   ✅ **AWSLambda_FullAccess**
   - Criar/atualizar/deletar Lambda Functions

   ✅ **AmazonAPIGatewayAdministrator**
   - Criar/gerenciar API Gateway

   ✅ **CloudWatchLogsFullAccess**
   - Visualizar logs da aplicação

   ✅ **IAMFullAccess**
   - Criar roles necessárias para Lambda

   ✅ **AWSCloudFormationFullAccess**
   - Gerenciar stacks (Serverless usa CloudFormation)

3. Clique em **"Next"**

---

#### **Step 4: Review and create**

1. Revise as informações:
   - **User name:** `msl-app`
   - **Permissions:** Verificar políticas selecionadas

2. Clique em **"Create user"**

---

#### **Step 5: Criar Access Keys** 🔑

Após criar o usuário, você precisa gerar as chaves de acesso:

1. Na tela de sucesso, clique no nome do usuário **"msl-app"**

2. Clique na aba **"Security credentials"**

3. Role até a seção **"Access keys"**

4. Clique em **"Create access key"**

5. **Selecione o caso de uso:**
   - ✅ Marque: **"Command Line Interface (CLI)"**
   - ✅ Marque o checkbox: "I understand the above recommendation..."
   - Clique em **"Next"**

6. **Description tag (opcional):**
   - Digite: `Serverless Deploy Backend MSL`
   - Clique em **"Create access key"**

7. **⚠️ IMPORTANTE - ANOTAR CREDENCIAIS:**

   Você verá uma tela como esta:

   ```
   Access key created successfully
   ──────────────────────────────────────────────
   Access key ID:      AKIAIOSFODNN7EXAMPLE
   Secret access key:  wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
   ──────────────────────────────────────────────
   ⚠️ This is your only opportunity to save your secret access key.
   ```

   **📋 COPIE AMBAS AGORA!**
   - Access Key ID: `AKIA...`
   - Secret Access Key: `kaF8...` (só aparece UMA VEZ!)

8. **Download backup:**
   - Clique em **"Download .csv file"**
   - Salve em local seguro

9. Clique em **"Done"**

---

### Resumo das Permissões

| Política | O que permite |
|----------|---------------|
| **AmazonS3FullAccess** | Criar buckets para armazenar código |
| **AWSLambda_FullAccess** | Criar e gerenciar funções Lambda |
| **AmazonAPIGatewayAdministrator** | Criar APIs HTTP |
| **CloudWatchLogsFullAccess** | Ver logs e métricas |
| **IAMFullAccess** | Criar roles para Lambda |
| **AWSCloudFormationFullAccess** | Gerenciar infraestrutura |

---

## 🔐 Configurar Credenciais Localmente

Agora que você tem as Access Keys, precisa configurá-las no seu computador.

### Método 1: Script Automático (Recomendado)

Usamos o script `setup-aws.sh` que foi criado:

```bash
cd /home/kadu/backend-msl-app
./setup-aws.sh
```

**O script vai solicitar:**

```
AWS Access Key ID: AKIAIOSFODNN7EXAMPLE
AWS Secret Access Key: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
Região (padrão: us-east-1): [Enter]
```

---

### Método 2: Configuração Manual

#### Criar diretório AWS

```bash
mkdir -p ~/.aws
```

#### Criar arquivo de credenciais

```bash
cat > ~/.aws/credentials << 'EOF'
[default]
aws_access_key_id = AKIAIOSFODNN7EXAMPLE
aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
EOF
```

#### Criar arquivo de configuração

```bash
cat > ~/.aws/config << 'EOF'
[default]
region = us-east-1
output = json
EOF
```

#### Definir permissões corretas

```bash
chmod 600 ~/.aws/credentials
chmod 600 ~/.aws/config
```

---

### Método 3: Variáveis de Ambiente

Para uso temporário ou em CI/CD:

```bash
export AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
export AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
export AWS_REGION=us-east-1
```

**Adicionar ao .bashrc ou .zshrc (permanente):**

```bash
echo 'export AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE' >> ~/.bashrc
echo 'export AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc
```

---

### Verificar Configuração

```bash
# Verificar arquivos
ls -la ~/.aws/

# Saída esperada:
# -rw------- credentials
# -rw------- config

# Testar credenciais (se tiver AWS CLI)
aws sts get-caller-identity

# Saída esperada:
# {
#   "UserId": "AIDAXXXXXXXXX",
#   "Account": "517392056367",
#   "Arn": "arn:aws:iam::517392056367:user/msl-app"
# }
```

---

## 📁 Arquivos de Configuração

### Estrutura de Arquivos Criada

```
backend-msl-app/
├── config.dev.json          # ✅ Criado - Config desenvolvimento
├── config.prod.json         # ✅ Criado - Config produção
├── serverless.yml           # ✅ Atualizado - Config Serverless
├── setup-aws.sh             # ✅ Criado - Script setup AWS
├── deploy-prod.sh           # ✅ Criado - Script deploy
├── GUIA_DEPLOY_PRODUCAO.md  # ✅ Criado - Guia detalhado
├── DEPLOY_SUCESSO.md        # ✅ Criado - Info do deploy
└── MANUAL_COMPLETO_AWS.md   # ✅ Este arquivo
```

---

### config.dev.json

Configurações de desenvolvimento:

```json
{
  "DB_URL": "mongodb://localhost:27017/msl-dev",
  "SECRET_TOKEN": "dev-secret-token-change-me"
}
```

---

### config.prod.json

Configurações de produção:

```json
{
  "DB_URL": "mongodb+srv://user:password@cluster.mongodb.net/database?appName=app",
  "SECRET_TOKEN": "your-super-secret-token-min-32-characters-random"
}
```

> ⚠️ **IMPORTANTE:** Estes arquivos estão no `.gitignore` e NÃO devem ser commitados!

---

### serverless.yml

Configuração do Serverless Framework:

```yaml
service: backend-msl-app

provider:
  name: aws
  runtime: nodejs18.x          # ✅ Atualizado de 16.x
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

**Explicação:**

- **service:** Nome do serviço
- **runtime:** Node.js 18 (atualizado)
- **stage:** Ambiente (dev/prod) - pega de `--stage` no deploy
- **region:** Região AWS (us-east-1 = Virginia)
- **timeout:** Tempo máximo de execução (30 segundos)
- **memorySize:** RAM alocada (1 GB)
- **environment:** Variáveis de ambiente carregadas do config.{stage}.json
- **functions.app:** Função Lambda
- **handler:** Arquivo e função a executar (handler.js → exports.index)
- **events:** API Gateway com proxy para todas as rotas

---

### package.json (atualizado)

Novos scripts adicionados:

```json
{
  "scripts": {
    "dev": "npm run husky && nodemon --exec 'sls offline start --noAuth --apiKey F8mhwFjI2Ueo2BqPWr6AXC2Z-YpS073JJqstcVk'",
    "offline": "sls offline start",
    "deploy:prod": "serverless deploy --stage prod",
    "deploy:dev": "serverless deploy --stage dev",
    "logs:prod": "serverless logs -f app --stage prod --tail",
    "logs:dev": "serverless logs -f app --stage dev --tail",
    "info:prod": "serverless info --stage prod"
  }
}
```

---

## 🚀 Processo de Deploy

### Deploy Completo - Passo a Passo

#### 1. Preparar o projeto

```bash
cd /home/kadu/backend-msl-app

# Instalar dependências
npm install
```

---

#### 2. Verificar configurações

```bash
# Verificar config.prod.json existe e está correto
cat config.prod.json

# Verificar credenciais AWS
ls -la ~/.aws/credentials
```

---

#### 3. Executar deploy

**Opção A: Script automatizado**

```bash
./deploy-prod.sh
```

**Opção B: npm**

```bash
npm run deploy:prod
```

**Opção C: Serverless direto**

```bash
npx serverless deploy --stage prod --verbose
```

---

#### 4. Aguardar conclusão

O deploy leva **2-5 minutos** e passa por estas etapas:

```
1. Packaging...
   ├─ Instalando dependências de produção
   ├─ Excluindo devDependencies
   └─ Criando arquivo .zip (~10 MB)

2. Uploading...
   └─ Enviando para S3 bucket

3. Creating CloudFormation stack...
   ├─ CREATE_IN_PROGRESS - AWS::CloudFormation::Stack
   ├─ CREATE_IN_PROGRESS - AWS::S3::Bucket
   ├─ CREATE_COMPLETE - AWS::S3::Bucket
   ├─ CREATE_IN_PROGRESS - AWS::IAM::Role
   ├─ CREATE_COMPLETE - AWS::IAM::Role
   ├─ CREATE_IN_PROGRESS - AWS::Lambda::Function
   ├─ CREATE_COMPLETE - AWS::Lambda::Function
   ├─ CREATE_IN_PROGRESS - AWS::ApiGateway::RestApi
   ├─ CREATE_COMPLETE - AWS::ApiGateway::RestApi
   └─ CREATE_COMPLETE - AWS::CloudFormation::Stack

4. Deploy complete!
   ✔ Service deployed to stack backend-msl-app-prod (106s)
```

---

#### 5. Resultado do deploy

```bash
Deploying backend-msl-app to stage prod (us-east-1)

✔ Service deployed to stack backend-msl-app-prod (106s)

endpoint: ANY - https://7xd18364z4.execute-api.us-east-1.amazonaws.com/prod/{proxy+}
functions:
  app: backend-msl-app-prod-app (10 MB)
```

**📋 Anotar:**
- **Endpoint URL:** `https://7xd18364z4.execute-api.us-east-1.amazonaws.com/prod`
- **Function name:** `backend-msl-app-prod-app`

---

### O que acontece durante o deploy?

#### Recursos criados:

1. **S3 Bucket**
   - Nome: `backend-msl-app-prod-serverlessdeploymentbucket-xxxxx`
   - Conteúdo: Código empacotado (.zip)

2. **Lambda Function**
   - Nome: `backend-msl-app-prod-app`
   - Runtime: Node.js 18.x
   - Handler: handler.index
   - Environment variables: DB_URL, SECRET_TOKEN, STAGE

3. **API Gateway**
   - Nome: `dev-backend-msl-app`
   - Stage: `prod`
   - Endpoint: `https://xxxxxx.execute-api.us-east-1.amazonaws.com/prod`

4. **IAM Role**
   - Nome: `backend-msl-app-prod-us-east-1-lambdaRole`
   - Permissões: CloudWatch Logs

5. **CloudWatch Log Group**
   - Nome: `/aws/lambda/backend-msl-app-prod-app`
   - Retention: Indefinido (padrão)

6. **CloudFormation Stack**
   - Nome: `backend-msl-app-prod`
   - Template: Gerado pelo Serverless Framework

---

## 🌐 URL Customizada

### Objetivo

Transformar:
```
❌ https://7xd18364z4.execute-api.us-east-1.amazonaws.com/prod/api/kols
```

Em:
```
✅ https://api.msl-app.com/api/kols
```

Ou:
```
✅ https://msl-app.com/api/kols
```

---

### Opção 1: Custom Domain no API Gateway (Recomendado)

Esta é a forma oficial da AWS.

#### **Pré-requisitos:**

1. **Ter um domínio** (ex: `msl-app.com`)
   - Comprar na AWS Route 53: ~$12/ano
   - Ou transferir domínio externo

2. **Certificado SSL/TLS** no AWS Certificate Manager (ACM)
   - Grátis pela AWS

---

#### **Passo 1: Registrar/Importar Domínio**

##### Se você NÃO tem domínio:

1. Acesse: https://console.aws.amazon.com/route53/
2. Clique em **"Register domain"**
3. Busque: `msl-app.com` (ou outro disponível)
4. Adicione ao carrinho: ~$12/ano
5. Preencha informações de contato
6. Conclua compra

##### Se JÁ tem domínio:

1. Acesse: https://console.aws.amazon.com/route53/
2. **Hosted zones** → **Create hosted zone**
3. Nome: `msl-app.com`
4. Tipo: Public
5. Clique em **Create**
6. **Copie os nameservers** (NS records)
7. No registrador atual, atualize os nameservers

---

#### **Passo 2: Criar Certificado SSL (ACM)**

1. Acesse: https://console.aws.amazon.com/acm/
2. **⚠️ IMPORTANTE: Mude para região `us-east-1`**
3. Clique em **"Request certificate"**
4. Tipo: **"Request a public certificate"**
5. Clique em **"Next"**

**Configurações:**

- **Domain names:**
  - `msl-app.com`
  - `*.msl-app.com` (wildcard - opcional)

- **Validation method:**
  - ✅ **DNS validation** (recomendado)

- **Key algorithm:**
  - RSA 2048

6. Clique em **"Request"**

**Validar certificado:**

7. Clique no certificado criado
8. Na seção **Domains**, clique em **"Create records in Route 53"**
9. Marque ambos os domínios
10. Clique em **"Create records"**
11. Aguarde **5-10 minutos** para validação

Status muda de:
```
⏳ Pending validation
↓
✅ Issued
```

---

#### **Passo 3: Criar Custom Domain no API Gateway**

1. Acesse: https://console.aws.amazon.com/apigateway/
2. **⚠️ Certifique-se de estar em `us-east-1`**
3. No menu lateral: **Custom domain names**
4. Clique em **"Create"**

**Configurações:**

- **Domain name:** `api.msl-app.com` (ou `msl-app.com`)
- **Endpoint type:** ✅ **Regional**
- **ACM certificate:** Selecione o certificado criado
- **Mutual TLS authentication:** Desabilitado

5. Clique em **"Create domain name"**

Aguarde **~5 minutos** para provisionar.

---

#### **Passo 4: Mapear para o Stage**

1. Ainda na tela do custom domain
2. Aba **"API mappings"**
3. Clique em **"Configure API mappings"**
4. Clique em **"Add new mapping"**

**Configurações:**

- **API:** Selecione `dev-backend-msl-app`
- **Stage:** `prod`
- **Path:** deixe **vazio** (ou `/` para prefixo)

5. Clique em **"Save"**

---

#### **Passo 5: Criar Registro DNS (Route 53)**

1. Acesse: https://console.aws.amazon.com/route53/
2. **Hosted zones** → Clique em `msl-app.com`
3. Clique em **"Create record"**

**Configurações:**

- **Record name:** `api` (resultado: `api.msl-app.com`)
  - Ou deixe vazio para usar `msl-app.com` direto

- **Record type:** **A - IPv4 address**

- **Alias:** ✅ **Yes**

- **Route traffic to:**
  - Selecione: **Alias to API Gateway API**
  - Região: **us-east-1**
  - Endpoint: Selecione o custom domain criado

- **Routing policy:** Simple routing

- **Evaluate target health:** No

4. Clique em **"Create records"**

---

#### **Passo 6: Aguardar Propagação DNS**

Pode levar **5-60 minutos** para propagar.

**Testar:**

```bash
# Verificar DNS
dig api.msl-app.com

# Ou
nslookup api.msl-app.com

# Testar API
curl https://api.msl-app.com/api/kols
```

---

#### **Passo 7: Atualizar serverless.yml (Opcional)**

Para deploysdocumentados:

```yaml
provider:
  name: aws
  runtime: nodejs18.x
  stage: ${opt:stage, 'dev'}
  region: us-east-1
  apiGateway:
    domainName: api.msl-app.com
    certificateName: api.msl-app.com
```

---

### Opção 2: Plugin Serverless Domain Manager

Automatiza todo o processo via código.

#### **Instalação:**

```bash
npm install --save-dev serverless-domain-manager
```

#### **Configurar serverless.yml:**

```yaml
plugins:
  - serverless-offline
  - serverless-domain-manager

custom:
  customDomain:
    domainName: api.msl-app.com
    basePath: ''
    stage: ${self:provider.stage}
    certificateName: api.msl-app.com
    createRoute53Record: true
    endpointType: 'regional'
    securityPolicy: tls_1_2
    apiType: rest
```

#### **Deploy:**

```bash
# Criar domain (primeira vez) - leva ~40 minutos
npx serverless create_domain --stage prod

# Deploy normal
npx serverless deploy --stage prod
```

---

### Opção 3: CloudFront + Custom Domain

Para melhor performance global e caching.

**Vantagens:**
- Cache na borda (CDN)
- Menor latência global
- Proteção DDoS
- WAF integrado

**Passos:**

1. Criar distribuição CloudFront
2. Origin: API Gateway
3. Custom domain no CloudFront
4. Certificado no ACM (us-east-1)
5. DNS no Route 53 para CloudFront

---

## 🧪 Testes e Validação

### Testar localmente antes do deploy

```bash
# Rodar local
npm run dev

# Em outro terminal, testar
curl http://localhost:3000/api/kols
```

---

### Testes após deploy

#### **1. Teste básico de conectividade**

```bash
curl https://7xd18364z4.execute-api.us-east-1.amazonaws.com/prod/
```

**Resposta esperada:**
```json
{
  "message": "Backend MSL API",
  "version": "1.0.0",
  "stage": "prod"
}
```

---

#### **2. Teste com autenticação**

```bash
curl -X GET \
  https://7xd18364z4.execute-api.us-east-1.amazonaws.com/prod/api/kols \
  -H 'X-API-Key: F8mhwFjI2Ueo2BqPWr6AXC2Z-YpS073JJqstcVk'
```

---

#### **3. Teste de POST**

```bash
curl -X POST \
  https://7xd18364z4.execute-api.us-east-1.amazonaws.com/prod/api/kols \
  -H 'X-API-Key: F8mhwFjI2Ueo2BqPWr6AXC2Z-YpS073JJqstcVk' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Dr. João Silva",
    "specialty": "Cardiologia",
    "email": "joao@example.com",
    "phone": "+5511999999999"
  }'
```

---

#### **4. Teste de performance**

```bash
# Medir latência
time curl -s https://7xd18364z4.execute-api.us-east-1.amazonaws.com/prod/api/kols > /dev/null

# Benchmark com Apache Bench
ab -n 100 -c 10 https://7xd18364z4.execute-api.us-east-1.amazonaws.com/prod/api/kols
```

---

### Testar com Postman

1. **Importar collection:**

```json
{
  "info": {
    "name": "Backend MSL - Prod",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "List KOLs",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "X-API-Key",
            "value": "F8mhwFjI2Ueo2BqPWr6AXC2Z-YpS073JJqstcVk"
          }
        ],
        "url": {
          "raw": "https://7xd18364z4.execute-api.us-east-1.amazonaws.com/prod/api/kols",
          "protocol": "https",
          "host": ["7xd18364z4", "execute-api", "us-east-1", "amazonaws", "com"],
          "path": ["prod", "api", "kols"]
        }
      }
    }
  ]
}
```

---

## 📊 Monitoramento e Logs

### Ver logs em tempo real

```bash
npm run logs:prod
```

Ou:

```bash
npx serverless logs -f app --stage prod --tail
```

**Saída:**
```
2026-02-07 10:30:45.123 INFO  GET /api/kols 200 45ms
2026-02-07 10:30:46.456 INFO  Connected to MongoDB
2026-02-07 10:30:47.789 ERROR Failed to authenticate user
```

---

### Ver logs no Console AWS

1. Acesse: https://console.aws.amazon.com/cloudwatch/
2. **Logs** → **Log groups**
3. Procure: `/aws/lambda/backend-msl-app-prod-app`
4. Clique para ver streams de log

---

### Métricas do Lambda

1. Acesse: https://console.aws.amazon.com/lambda/
2. Funções → `backend-msl-app-prod-app`
3. Aba **"Monitor"**

**Métricas disponíveis:**
- **Invocations:** Número de execuções
- **Duration:** Tempo de execução (ms)
- **Errors:** Número de erros
- **Throttles:** Requisições limitadas
- **Concurrent executions:** Execuções simultâneas
- **Dead Letter Errors:** Erros não tratados

---

### CloudWatch Insights

Queries avançadas nos logs:

```sql
# Requisições mais lentas
fields @timestamp, @message
| filter @message like /GET/
| stats max(@duration) as max_duration by @message
| sort max_duration desc
| limit 10

# Taxa de erro
fields @timestamp
| stats count() as total,
        count(@message like /ERROR/) as errors
| extend error_rate = 100 * errors / total

# Endpoints mais acessados
fields @timestamp, @message
| parse @message /(?<method>\w+) (?<path>\/\S+)/
| stats count() as hits by path
| sort hits desc
```

---

### Configurar Alarmes

```bash
# Alerta quando taxa de erro > 5%
aws cloudwatch put-metric-alarm \
  --alarm-name backend-msl-app-error-rate \
  --alarm-description "Alert quando taxa de erro excede 5%" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --datapoints-to-alarm 2 \
  --evaluation-periods 2 \
  --dimensions Name=FunctionName,Value=backend-msl-app-prod-app
```

---

## 🔧 Troubleshooting

### Erro: "Internal Server Error" (500)

#### **Verificar logs:**

```bash
npm run logs:prod
```

#### **Causas comuns:**

1. **MongoDB não conecta:**
   ```
   ERROR MongoServerError: Authentication failed
   ```
   **Solução:** Verificar DB_URL em config.prod.json

2. **Variável de ambiente faltando:**
   ```
   ERROR SECRET_TOKEN is not defined
   ```
   **Solução:** Verificar serverless.yml environment

3. **Erro no código:**
   ```
   ERROR TypeError: Cannot read property 'find' of undefined
   ```
   **Solução:** Debug do código, verificar models

---

### Erro: "Forbidden" (403)

#### **Causa:** API Key inválido ou faltando

**Testar:**
```bash
# Sem API Key
curl https://7xd18364z4.execute-api.us-east-1.amazonaws.com/prod/api/kols

# Com API Key correto
curl -H "X-API-Key: F8mhwFjI2Ueo2BqPWr6AXC2Z-YpS073JJqstcVk" \
  https://7xd18364z4.execute-api.us-east-1.amazonaws.com/prod/api/kols
```

---

### Erro: "Timeout" (504)

#### **Causa:** Lambda excedeu timeout de 30s

**Soluções:**

1. **Aumentar timeout:**

```yaml
# serverless.yml
provider:
  timeout: 60  # 60 segundos
```

```bash
npm run deploy:prod
```

2. **Otimizar queries MongoDB:**
   - Adicionar índices
   - Limitar resultados
   - Usar paginação

3. **Otimizar código:**
   - Remover operações pesadas
   - Usar async/await corretamente
   - Evitar loops desnecessários

---

### MongoDB não conecta

#### **Verificar Network Access no Atlas:**

1. Acesse: https://cloud.mongodb.com/
2. Projeto → **Network Access**
3. Verificar se `0.0.0.0/0` está permitido
4. Ou adicionar IPs da AWS Lambda

**Encontrar IP da Lambda:**
```bash
# Ver logs
npm run logs:prod | grep -i "connect"
```

---

### Cold Start muito lento

#### **Problema:** Primeira requisição leva > 3 segundos

**Soluções:**

1. **Provisioned Concurrency:**

```yaml
# serverless.yml
functions:
  app:
    handler: handler.index
    provisionedConcurrency: 1  # Mantém 1 instância warm
```

2. **Reduzir tamanho do pacote:**
   - Remover dependências não usadas
   - Usar `npm prune --production`

3. **Lazy loading:**
   ```javascript
   // Carregar MongoDB apenas quando necessário
   let db = null;
   async function getDB() {
     if (!db) {
       db = await connectMongoDB();
     }
     return db;
   }
   ```

---

## 💰 Custos e Otimização

### Calculadora de Custos

Para **1 milhão de requisições/mês** com configuração atual:

```
Lambda:
  - Requisições: 1M x $0.20 / 1M = $0.20
  - Compute: 1M x 200ms x 1GB x $0.0000166667 = $3.33
  Subtotal: $3.53

API Gateway:
  - Requisições: 1M x $3.50 / 1M = $3.50
  Subtotal: $3.50

CloudWatch:
  - Logs: ~1 GB x $0.50 = $0.50
  Subtotal: $0.50

Total mensal: ~$7.53
```

---

### Otimizações de Custo

#### **1. Reduzir memória se possível:**

```yaml
provider:
  memorySize: 512  # Em vez de 1024
```

**Impacto:**
- Custo: -50%
- Performance: pode cair ~20%

---

#### **2. Reduzir timeout:**

```yaml
provider:
  timeout: 10  # Em vez de 30
```

---

#### **3. Configurar log retention:**

```yaml
provider:
  logRetentionInDays: 7  # Em vez de indefinido
```

**Economia:** ~$0.03/GB/mês após 7 dias

---

#### **4. Usar VPC apenas se necessário:**

VPC endpoints custam ~$7/mês. Só use se precisar acessar recursos privados.

---

### Monitorar Custos

#### **Cost Explorer:**

1. Acesse: https://console.aws.amazon.com/cost-management/
2. **Cost Explorer** → **Launch Cost Explorer**
3. Filtrar por:
   - Service: Lambda, API Gateway, CloudWatch
   - Tag: backend-msl-app

---

#### **Configurar Budget:**

```bash
aws budgets create-budget \
  --account-id 517392056367 \
  --budget '{
    "BudgetName": "backend-msl-app-monthly",
    "BudgetLimit": {
      "Amount": "10",
      "Unit": "USD"
    },
    "TimeUnit": "MONTHLY",
    "BudgetType": "COST"
  }'
```

---

## 🔒 Segurança

### Checklist de Segurança

- [x] ✅ HTTPS obrigatório (API Gateway)
- [x] ✅ CORS configurado
- [x] ✅ Helmet.js (security headers)
- [x] ✅ API Key authentication
- [x] ✅ JWT authentication
- [x] ✅ Variáveis sensíveis em config files
- [x] ✅ Config files no .gitignore
- [ ] 🔲 AWS Secrets Manager
- [ ] 🔲 WAF (Web Application Firewall)
- [ ] 🔲 Rate limiting avançado
- [ ] 🔲 IP whitelist
- [ ] 🔲 CloudWatch Alarms
- [ ] 🔲 Backup automatizado MongoDB

---

### Implementar AWS Secrets Manager

#### **Criar secrets:**

```bash
# DB URL
aws secretsmanager create-secret \
  --name msl-app/prod/db-url \
  --description "MongoDB connection string" \
  --secret-string "mongodb+srv://user:password@cluster.mongodb.net/database"

# Secret Token
aws secretsmanager create-secret \
  --name msl-app/prod/secret-token \
  --description "JWT secret token" \
  --secret-string "your-super-secret-token-here"
```

#### **Atualizar serverless.yml:**

```yaml
provider:
  environment:
    DB_URL: ${ssm:/aws/reference/secretsmanager/msl-app/prod/db-url}
    SECRET_TOKEN: ${ssm:/aws/reference/secretsmanager/msl-app/prod/secret-token}
  iamRoleStatements:
    - Effect: Allow
      Action:
        - secretsmanager:GetSecretValue
      Resource:
        - arn:aws:secretsmanager:us-east-1:*:secret:msl-app/prod/*
```

---

### Implementar WAF

```bash
# Criar Web ACL
aws wafv2 create-web-acl \
  --name msl-app-prod-waf \
  --scope REGIONAL \
  --region us-east-1 \
  --default-action Allow={} \
  --rules '[
    {
      "Name": "RateLimitRule",
      "Priority": 1,
      "Statement": {
        "RateBasedStatement": {
          "Limit": 2000,
          "AggregateKeyType": "IP"
        }
      },
      "Action": {
        "Block": {}
      },
      "VisibilityConfig": {
        "SampledRequestsEnabled": true,
        "CloudWatchMetricsEnabled": true,
        "MetricName": "RateLimitRule"
      }
    }
  ]'
```

---

## 📚 Comandos Úteis

### Deploy e Gerenciamento

```bash
# Deploy produção
npm run deploy:prod

# Deploy dev
npm run deploy:dev

# Ver informações
npm run info:prod

# Remover deploy
npx serverless remove --stage prod

# Deploy com logs verbosos
npx serverless deploy --stage prod --verbose
```

---

### Logs

```bash
# Logs em tempo real
npm run logs:prod

# Logs de período específico
npx serverless logs -f app --stage prod --startTime 1h

# Logs de erro apenas
npx serverless logs -f app --stage prod --filter ERROR
```

---

### Invocar função diretamente

```bash
# Invocar Lambda direto (sem API Gateway)
npx serverless invoke -f app --stage prod --data '{
  "httpMethod": "GET",
  "path": "/api/kols"
}'
```

---

### Informações da stack

```bash
# CloudFormation stack
aws cloudformation describe-stacks \
  --stack-name backend-msl-app-prod \
  --region us-east-1

# Recursos da stack
aws cloudformation list-stack-resources \
  --stack-name backend-msl-app-prod
```

---

### Métricas

```bash
# Invocações nas últimas 24h
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=backend-msl-app-prod-app \
  --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Sum
```

---

## 🎓 Resumo Final

### O que foi criado?

✅ Usuário IAM na AWS (`msl-app`)
✅ Credenciais configuradas localmente
✅ Arquivos de configuração (dev/prod)
✅ Deploy na AWS Lambda
✅ API Gateway com URL pública
✅ CloudWatch Logs configurado
✅ Scripts de deploy automatizados
✅ Documentação completa

---

### URLs Importantes

**API Produção:**
```
https://7xd18364z4.execute-api.us-east-1.amazonaws.com/prod
```

**Console AWS:**
- Lambda: https://console.aws.amazon.com/lambda/
- API Gateway: https://console.aws.amazon.com/apigateway/
- CloudWatch: https://console.aws.amazon.com/cloudwatch/
- IAM: https://console.aws.amazon.com/iam/

---

### Próximos Passos

1. ✅ Deploy concluído
2. 🔲 Testar todos os endpoints
3. 🔲 Configurar URL customizada (opcional)
4. 🔲 Integrar com frontend
5. 🔲 Configurar monitoramento (alarmes)
6. 🔲 Implementar CI/CD
7. 🔲 Configurar backup MongoDB
8. 🔲 Documentar API (Swagger)
9. 🔲 Testes de carga
10. 🔲 Lançamento para usuários

---

**🎉 Parabéns! Você completou o deploy na AWS! 🚀**

---

**Última atualização:** 2026-02-07
**Versão:** 1.0
**Autor:** Claude Code
**Contato:** [Link para suporte]
