# 🎉 Deploy Concluído com Sucesso!

**Data do Deploy:** 2026-02-07
**Ambiente:** Produção (prod)
**Região AWS:** us-east-1 (Virginia do Norte)

---

## ✅ Sua API está no ar!

### 🌐 URL da API em Produção

**URL atual (gerada automaticamente):**
```
https://7xd18364z4.execute-api.us-east-1.amazonaws.com/prod
```

**URL desejada (custom domain):**
```
https://msl-app.us-east-1.amazonaws.com/
```

> 📌 **Nota:** Para usar a URL customizada, veja a seção [Configurar URL Customizada](#-configurar-url-customizada) abaixo.

---

## 📦 Recursos Criados Automaticamente

### 1. API Gateway REST API
- **URL:** https://7xd18364z4.execute-api.us-east-1.amazonaws.com/prod
- **Configuração:** CORS habilitado
- **Método:** ANY (aceita GET, POST, PUT, DELETE, etc)
- **Path:** `/{proxy+}` (repassa todas as rotas para a Lambda)
- **Stage:** prod

### 2. Lambda Function
- **Nome:** `backend-msl-app-prod-app`
- **Runtime:** Node.js 18.x
- **Memória:** 1024 MB (1 GB)
- **Timeout:** 30 segundos
- **Tamanho do pacote:** 10 MB
- **Handler:** handler.index

### 3. S3 Bucket
- **Bucket de deployment** (armazena o código empacotado)
- Criado automaticamente pelo Serverless Framework

### 4. CloudWatch Logs
- **Log Group:** `/aws/lambda/backend-msl-app-prod-app`
- Logs da aplicação disponíveis em tempo real

### 5. IAM Roles
- **Role:** Permissões para Lambda executar
- **Políticas:** Acesso ao CloudWatch Logs

---

## 🔗 Como Funciona a Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    Fluxo de Requisição                  │
└─────────────────────────────────────────────────────────┘

Internet (Cliente/Frontend)
   │
   ↓ 📱 HTTP Request
   │
   ↓ GET /api/kols
   │
┌──▼────────────────────────────────────────┐
│  API Gateway                              │
│  https://7xd18364z4...amazonaws.com/prod  │
│                                           │
│  • Recebe requisição                     │
│  • Valida CORS                           │
│  • Aplica throttling                     │
└──┬────────────────────────────────────────┘
   │
   ↓ Invoca Lambda
   │
┌──▼────────────────────────────────────────┐
│  AWS Lambda Function                      │
│  backend-msl-app-prod-app                 │
│                                           │
│  • Executa handler.js (Express app)      │
│  • Processa rotas (routes.json)          │
│  • Executa controllers                   │
└──┬────────────────────────────────────────┘
   │
   ↓ Consulta banco
   │
┌──▼────────────────────────────────────────┐
│  MongoDB Atlas                            │
│  msl-app.qbxqviy.mongodb.net             │
│                                           │
│  • Busca/Insere/Atualiza dados           │
│  • Retorna resultado                     │
└──┬────────────────────────────────────────┘
   │
   ↓ Resposta
   │
┌──▼────────────────────────────────────────┐
│  Lambda → API Gateway → Cliente           │
│                                           │
│  • Formata resposta JSON                 │
│  • Retorna status code                   │
│  • Adiciona headers CORS                 │
└───────────────────────────────────────────┘
```

---

## 🧪 Testar a API

### Teste 1: Endpoint Raiz

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

### Teste 2: Health Check (se implementado)

```bash
curl https://7xd18364z4.execute-api.us-east-1.amazonaws.com/prod/api/health
```

---

### Teste 3: Listar KOLs (com autenticação)

```bash
curl -X GET \
  https://7xd18364z4.execute-api.us-east-1.amazonaws.com/prod/api/kols \
  -H 'X-API-Key: F8mhwFjI2Ueo2BqPWr6AXC2Z-YpS073JJqstcVk' \
  -H 'Authorization: Bearer SEU_JWT_TOKEN'
```

---

### Teste 4: Criar um KOL

```bash
curl -X POST \
  https://7xd18364z4.execute-api.us-east-1.amazonaws.com/prod/api/kols \
  -H 'X-API-Key: F8mhwFjI2Ueo2BqPWr6AXC2Z-YpS073JJqstcVk' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Dr. João Silva",
    "specialty": "Cardiologia",
    "email": "joao.silva@example.com"
  }'
```

---

## 📊 Comandos Úteis

### Ver logs em tempo real

```bash
npm run logs:prod
```

Ou diretamente:

```bash
npx serverless logs -f app --stage prod --tail
```

---

### Ver informações do deploy

```bash
npm run info:prod
```

Ou:

```bash
npx serverless info --stage prod
```

**Saída esperada:**
```
service: backend-msl-app
stage: prod
region: us-east-1
stack: backend-msl-app-prod
endpoint: ANY - https://7xd18364z4.execute-api.us-east-1.amazonaws.com/prod/{proxy+}
functions:
  app: backend-msl-app-prod-app
```

---

### Fazer redeploy (atualização)

```bash
npm run deploy:prod
```

Ou:

```bash
npx serverless deploy --stage prod
```

---

### Remover deploy (deletar tudo)

```bash
npx serverless remove --stage prod
```

⚠️ **CUIDADO:** Remove completamente todos os recursos da AWS!

---

## 🌐 Acessar Recursos na AWS

### Lambda Function

1. Acesse: https://console.aws.amazon.com/lambda/
2. Região: **us-east-1**
3. Busque por: `backend-msl-app-prod-app`
4. Aqui você pode:
   - Ver o código
   - Testar a função
   - Ver métricas (invocações, erros, duração)
   - Configurar variáveis de ambiente

---

### API Gateway

1. Acesse: https://console.aws.amazon.com/apigateway/
2. Região: **us-east-1**
3. Busque por: `dev-backend-msl-app` (nome do API)
4. Stage: **prod**
5. Aqui você pode:
   - Ver endpoints
   - Configurar throttling
   - Ver logs de acesso
   - Configurar custom domain

---

### CloudWatch Logs

1. Acesse: https://console.aws.amazon.com/cloudwatch/
2. Região: **us-east-1**
3. No menu lateral: **Logs** → **Log groups**
4. Busque por: `/aws/lambda/backend-msl-app-prod-app`
5. Aqui você pode:
   - Ver logs em tempo real
   - Criar filtros
   - Criar métricas customizadas
   - Configurar alarmes

---

### CloudFormation

1. Acesse: https://console.aws.amazon.com/cloudformation/
2. Região: **us-east-1**
3. Busque por: `backend-msl-app-prod`
4. Aqui você pode:
   - Ver todos os recursos criados
   - Ver eventos de deploy
   - Ver template gerado

---

## 🔧 Configurar URL Customizada

Para usar `https://msl-app.us-east-1.amazonaws.com/` em vez da URL padrão, você tem **3 opções**:

---

### Opção 1: Custom Domain no API Gateway (Recomendado)

#### **Pré-requisitos:**
- Ter um domínio próprio (ex: `msl-app.com`)
- Certificado SSL/TLS no AWS Certificate Manager (ACM)

#### **Passos:**

**1. Registrar/Importar domínio no Route 53:**

Se você não tem domínio ainda:
- Acesse: https://console.aws.amazon.com/route53/
- **Register domain** → Compre `msl-app.com` (custo: ~$12/ano)

Se já tem domínio externo:
- Aponte os nameservers para Route 53

---

**2. Criar certificado SSL no ACM:**

```bash
# Pelo Console AWS
# 1. Acesse: https://console.aws.amazon.com/acm/
# 2. IMPORTANTE: Mude região para us-east-1
# 3. Request certificate
# 4. Domain name: msl-app.com ou api.msl-app.com
# 5. Validation method: DNS validation (recomendado)
# 6. Adicione o CNAME no Route 53 para validar
```

---

**3. Configurar Custom Domain no API Gateway:**

Via Console AWS:

1. Acesse: https://console.aws.amazon.com/apigateway/
2. No menu lateral: **Custom domain names**
3. Clique em **Create**
4. Configurações:
   - **Domain name:** `api.msl-app.com` ou `msl-app.com`
   - **Endpoint type:** Regional
   - **ACM certificate:** Selecione o certificado criado
5. Clique em **Create domain name**
6. Na aba **API mappings**, clique em **Configure API mappings**
7. Adicione:
   - **API:** backend-msl-app
   - **Stage:** prod
   - **Path:** deixe vazio ou coloque `/`
8. Clique em **Save**

---

**4. Criar registro DNS no Route 53:**

1. Acesse: https://console.aws.amazon.com/route53/
2. Vá em **Hosted zones**
3. Selecione seu domínio
4. Clique em **Create record**
5. Configurações:
   - **Record name:** `api` (ou deixe vazio)
   - **Record type:** A - IPv4 address
   - **Alias:** Yes
   - **Alias target:** Selecione o API Gateway domain criado
6. Clique em **Create records**

---

**5. Atualizar serverless.yml (opcional):**

```yaml
provider:
  name: aws
  runtime: nodejs18.x
  stage: ${opt:stage, 'dev'}
  region: us-east-1
  apiGateway:
    domainName: api.msl-app.com
```

---

### Opção 2: CloudFront + API Gateway

Para melhor performance global:

1. Criar distribuição CloudFront
2. Origin: Apontar para o API Gateway
3. Custom domain no CloudFront
4. Certificado SSL no ACM (us-east-1 para CloudFront)
5. DNS no Route 53 apontando para CloudFront

**Vantagens:**
- Cache na borda (mais rápido)
- HTTPS obrigatório
- WAF (proteção contra ataques)

---

### Opção 3: Plugin Serverless Domain Manager

Via código (automatizado):

```bash
# Instalar plugin
npm install --save-dev serverless-domain-manager
```

**Adicionar ao serverless.yml:**

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
```

**Deploy:**

```bash
# Criar domain (primeira vez)
npx serverless create_domain --stage prod

# Deploy normal
npx serverless deploy --stage prod
```

---

## 💰 Custos AWS

### Free Tier (Permanente)

#### Lambda
- ✅ **1 milhão de requisições/mês = GRÁTIS**
- ✅ **400.000 GB-segundo/mês = GRÁTIS**

Com a configuração atual (1GB RAM, 30s timeout):
- **~111 horas de execução grátis/mês**

#### API Gateway
- ✅ **1 milhão de chamadas/mês = GRÁTIS** (primeiros 12 meses)
- Após: $3.50 por milhão de requisições

#### CloudWatch Logs
- ✅ **5 GB de ingestão/mês = GRÁTIS**
- ✅ **5 GB de armazenamento/mês = GRÁTIS**

#### Route 53 (se usar custom domain)
- **$0.50/mês** por hosted zone
- **$0.40** por milhão de queries

#### ACM (Certificate Manager)
- ✅ **Certificados SSL = GRÁTIS**

---

### Estimativa de Custo Mensal

Para uso moderado (< 1M requisições/mês):

```
Lambda:           $0 (dentro do free tier)
API Gateway:      $0 (free tier primeiro ano) ou $3.50
CloudWatch:       $0 (dentro do free tier)
Route 53:         $0.50 (se usar custom domain)
─────────────────────────────────────────────
TOTAL:            $0 - $4/mês
```

Para alto volume (5M requisições/mês):

```
Lambda:           ~$8
API Gateway:      ~$17.50
CloudWatch:       ~$2
Route 53:         $0.50
─────────────────────────────────────────────
TOTAL:            ~$28/mês
```

---

## 📱 Configurar no Frontend

### React/Next.js

```javascript
// .env.production
NEXT_PUBLIC_API_URL=https://7xd18364z4.execute-api.us-east-1.amazonaws.com/prod
NEXT_PUBLIC_API_KEY=F8mhwFjI2Ueo2BqPWr6AXC2Z-YpS073JJqstcVk

// services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'X-API-Key': process.env.NEXT_PUBLIC_API_KEY,
  },
});

// Adicionar token JWT se disponível
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

---

### React Native

```javascript
// config/api.js
import axios from 'axios';

const API_URL = 'https://7xd18364z4.execute-api.us-east-1.amazonaws.com/prod';
const API_KEY = 'F8mhwFjI2Ueo2BqPWr6AXC2Z-YpS073JJqstcVk';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'X-API-Key': API_KEY,
  },
});

export default api;
```

---

## 🔒 Segurança

### ✅ Implementado

- [x] CORS configurado
- [x] Helmet.js (headers de segurança)
- [x] Autenticação via API Key + JWT
- [x] Variáveis sensíveis em config files (não commitados)
- [x] HTTPS obrigatório (API Gateway)
- [x] Logs no CloudWatch

---

### ⚠️ Recomendações Adicionais

#### 1. AWS Secrets Manager

Armazenar credenciais de forma segura:

```bash
# Criar secrets
aws secretsmanager create-secret \
  --name msl-app/prod/db-url \
  --secret-string "mongodb+srv://..."

aws secretsmanager create-secret \
  --name msl-app/prod/secret-token \
  --secret-string "sO2ZlvLJQqWpGxT..."
```

Atualizar `serverless.yml`:

```yaml
environment:
  DB_URL: ${ssm:/aws/reference/secretsmanager/msl-app/prod/db-url}
  SECRET_TOKEN: ${ssm:/aws/reference/secretsmanager/msl-app/prod/secret-token}
```

---

#### 2. API Gateway Throttling

Proteger contra abuso:

```yaml
provider:
  apiGateway:
    throttle:
      rateLimit: 100   # requests por segundo
      burstLimit: 200  # pico de requests
```

---

#### 3. MongoDB Network Access

No MongoDB Atlas:

1. Acesse: https://cloud.mongodb.com/
2. **Network Access** → **Add IP Address**
3. Para produção, adicione IPs específicos da AWS
4. Evite usar `0.0.0.0/0` em produção

**Encontrar IPs da Lambda:**
```bash
# Ver logs e procurar por IP de saída
npm run logs:prod
```

---

#### 4. CloudWatch Alarms

Criar alertas:

```bash
# Alerta para erros
aws cloudwatch put-metric-alarm \
  --alarm-name msl-app-prod-errors \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=FunctionName,Value=backend-msl-app-prod-app
```

---

#### 5. WAF (Web Application Firewall)

Proteção avançada:

- SQL Injection
- XSS
- Rate limiting por IP
- Bloqueio de países

```bash
# Criar Web ACL
aws wafv2 create-web-acl \
  --name msl-app-prod-waf \
  --scope REGIONAL \
  --region us-east-1
```

---

## 🔍 Monitoramento

### Métricas do Lambda (CloudWatch)

- **Invocations:** Número de execuções
- **Errors:** Número de erros
- **Duration:** Tempo de execução
- **Throttles:** Requisições limitadas
- **Concurrent executions:** Execuções simultâneas

**Acesse:** https://console.aws.amazon.com/lambda/ → Métricas

---

### Logs Estruturados

Os logs aparecem no CloudWatch com formato:

```
2026-02-07T10:30:45.123Z  INFO  GET /api/kols 200 45ms
2026-02-07T10:30:46.456Z  ERROR Failed to connect to MongoDB
```

---

### X-Ray (Tracing)

Para debug avançado, habilite X-Ray:

```yaml
provider:
  tracing:
    lambda: true
    apiGateway: true
```

---

## 🚨 Troubleshooting

### Erro: "Internal Server Error"

**Verificar logs:**
```bash
npm run logs:prod
```

**Causas comuns:**
- Erro de conexão com MongoDB
- Variável de ambiente incorreta
- Erro no código

---

### Erro: "Forbidden" ou "Unauthorized"

**Causa:** API Key ou JWT inválido

**Solução:**
```bash
# Verificar API Key
curl -H "X-API-Key: F8mhwFjI2Ueo2BqPWr6AXC2Z-YpS073JJqstcVk" \
  https://7xd18364z4.execute-api.us-east-1.amazonaws.com/prod/api/kols
```

---

### Erro: "Timeout"

**Causa:** Lambda excedeu 30 segundos

**Solução:** Aumentar timeout no `serverless.yml`:

```yaml
provider:
  timeout: 60  # segundos
```

Depois fazer redeploy:
```bash
npm run deploy:prod
```

---

### MongoDB não conecta

**Verificar:**
1. DB_URL correto em `config.prod.json`
2. MongoDB Atlas Network Access permite IPs da AWS
3. MongoDB está online

**Logs:**
```bash
npm run logs:prod | grep -i mongo
```

---

## 📚 Recursos Úteis

### Documentação Oficial

- **AWS Lambda:** https://docs.aws.amazon.com/lambda/
- **API Gateway:** https://docs.aws.amazon.com/apigateway/
- **Serverless Framework:** https://www.serverless.com/framework/docs
- **MongoDB Atlas:** https://docs.atlas.mongodb.com/

---

### Ferramentas

- **Postman:** Testar APIs
- **AWS Console:** Gerenciar recursos
- **MongoDB Compass:** Gerenciar banco
- **CloudWatch Insights:** Analisar logs

---

## 🎯 Checklist Pós-Deploy

- [x] ✅ Deploy concluído com sucesso
- [x] ✅ URL da API anotada
- [ ] 🔲 Testar endpoints principais
- [ ] 🔲 Configurar URL customizada (opcional)
- [ ] 🔲 Configurar no frontend
- [ ] 🔲 Configurar monitoramento (CloudWatch Alarms)
- [ ] 🔲 Configurar backup do MongoDB
- [ ] 🔲 Documentar API (Swagger/OpenAPI)
- [ ] 🔲 Configurar CI/CD (opcional)
- [ ] 🔲 Testar em produção com usuários reais

---

## 🔄 Próximas Atualizações

Para atualizar a aplicação:

```bash
# 1. Fazer alterações no código
# 2. Testar localmente
npm run dev

# 3. Commit
git add .
git commit -m "feat: nova funcionalidade"

# 4. Deploy
npm run deploy:prod

# 5. Verificar
npm run logs:prod
```

---

## 📞 Suporte

Em caso de problemas:

1. Verificar logs: `npm run logs:prod`
2. Consultar [Troubleshooting](#-troubleshooting)
3. Verificar Console AWS
4. Consultar documentação completa: `GUIA_DEPLOY_PRODUCAO.md`

---

**🎉 Parabéns! Sua API está em produção na AWS! 🚀**

---

**Informações do Deploy:**
- **Service:** backend-msl-app
- **Stage:** prod
- **Region:** us-east-1
- **Stack:** backend-msl-app-prod
- **Function:** backend-msl-app-prod-app
- **Endpoint:** https://7xd18364z4.execute-api.us-east-1.amazonaws.com/prod
- **Deploy Date:** 2026-02-07
