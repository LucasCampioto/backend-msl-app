# 🚀 Guia Completo de Deploy para Produção - Backend MSL App

Este guia contém todas as informações necessárias para fazer o deploy da aplicação Backend MSL para AWS Lambda em ambiente de produção.

---

## 📋 Índice

1. [Configurações Realizadas](#configurações-realizadas)
2. [Pré-requisitos](#pré-requisitos)
3. [Passo a Passo do Deploy](#passo-a-passo-do-deploy)
4. [Comandos Úteis](#comandos-úteis)
5. [Verificação Pós-Deploy](#verificação-pós-deploy)
6. [Troubleshooting](#troubleshooting)
7. [Custos AWS](#custos-aws)
8. [Segurança](#segurança)

---

## ✅ Configurações Realizadas

### 1. Arquivos de Configuração

**`config.dev.json`** - Ambiente de desenvolvimento
```json
{
  "DB_URL": "mongodb://localhost:27017/msl-dev",
  "SECRET_TOKEN": "dev-secret-token-change-me"
}
```

**`config.prod.json`** - Ambiente de produção
```json
{
  "DB_URL": "mongodb+srv://user:password@cluster.mongodb.net/database?appName=app",
  "SECRET_TOKEN": "your-super-secret-token-min-32-characters-random"
}
```

> ⚠️ **IMPORTANTE:** Estes arquivos estão no `.gitignore` e não devem ser commitados no repositório!

### 2. Serverless Framework

**Runtime atualizado:** Node.js 16.x → Node.js 18.x

**Configuração (`serverless.yml`):**
```yaml
service: backend-msl-app

provider:
  name: aws
  runtime: nodejs18.x
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
```

### 3. Scripts Criados

- **`setup-aws.sh`** - Script para configurar credenciais AWS
- **`deploy-prod.sh`** - Script automatizado de deploy para produção

### 4. Novos comandos npm

Adicionados ao `package.json`:
```json
{
  "scripts": {
    "deploy:prod": "serverless deploy --stage prod",
    "deploy:dev": "serverless deploy --stage dev",
    "logs:prod": "serverless logs -f app --stage prod --tail",
    "logs:dev": "serverless logs -f app --stage dev --tail",
    "info:prod": "serverless info --stage prod"
  }
}
```

---

## 🔧 Pré-requisitos

### 1. Conta AWS

- Ter uma conta ativa na AWS
- Acesso ao Console AWS: https://console.aws.amazon.com/

### 2. Credenciais AWS (IAM)

Você precisa de um usuário IAM com permissões para:
- AWS Lambda
- API Gateway
- CloudWatch Logs
- IAM (criação de roles)
- CloudFormation

### 3. MongoDB

- URL de conexão do MongoDB Atlas ou MongoDB self-hosted
- Banco de dados configurado e acessível

---

## 🚀 Passo a Passo do Deploy

### **Passo 1: Obter Credenciais AWS**

1. Acesse o Console AWS: https://console.aws.amazon.com/
2. Navegue para **IAM** (Identity and Access Management)
3. No menu lateral, clique em **Users**
4. Selecione seu usuário ou crie um novo:
   - Clique em **Add users**
   - Nome: `serverless-deploy-user` (ou outro de sua preferência)
   - Selecione **Programmatic access**
   - Attach policy: **AdministratorAccess** (ou permissões específicas)
5. Vá para a aba **Security credentials**
6. Clique em **Create access key**
7. Escolha **Command Line Interface (CLI)**
8. **Anote as credenciais:**
   - **Access Key ID**: `AKIA...`
   - **Secret Access Key**: `xxxxx...` (mostrado apenas uma vez!)

> 💡 **Dica:** Salve as credenciais em um local seguro temporariamente.

---

### **Passo 2: Configurar Credenciais AWS Localmente**

#### **Opção A: Usando o script automático (Recomendado)**

```bash
./setup-aws.sh
```

O script vai solicitar:
- AWS Access Key ID
- AWS Secret Access Key
- Região (padrão: us-east-1)

#### **Opção B: Configuração manual**

```bash
# Criar diretório .aws
mkdir -p ~/.aws

# Criar arquivo de credenciais
cat > ~/.aws/credentials << EOF
[default]
aws_access_key_id = SUA_ACCESS_KEY_ID_AQUI
aws_secret_access_key = SUA_SECRET_ACCESS_KEY_AQUI
EOF

# Criar arquivo de configuração
cat > ~/.aws/config << EOF
[default]
region = us-east-1
output = json
EOF

# Definir permissões corretas
chmod 600 ~/.aws/credentials
chmod 600 ~/.aws/config
```

#### **Opção C: Variáveis de ambiente**

```bash
export AWS_ACCESS_KEY_ID=sua_access_key_id
export AWS_SECRET_ACCESS_KEY=sua_secret_access_key
export AWS_REGION=us-east-1
```

---

### **Passo 3: Instalar Dependências**

```bash
npm install
```

---

### **Passo 4: Fazer o Deploy**

#### **Opção A: Usando o script automatizado**

```bash
./deploy-prod.sh
```

#### **Opção B: Usando npm**

```bash
npm run deploy:prod
```

#### **Opção C: Comando direto do Serverless**

```bash
npx serverless deploy --stage prod
```

---

### **Passo 5: Aguardar o Deploy**

O processo pode levar de 2 a 5 minutos. Você verá algo como:

```
Deploying backend-msl-app to stage prod (us-east-1)

✔ Service deployed to stack backend-msl-app-prod (112s)

endpoints:
  ANY - https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod/{proxy+}

functions:
  app: backend-msl-app-prod-app (51 MB)
```

---

### **Passo 6: Anotar o Endpoint**

⭐ **IMPORTANTE:** Copie a URL do endpoint!

Exemplo:
```
https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod
```

Esta é a URL base da sua API em produção!

---

## 📝 Comandos Úteis

### Ver informações do deploy

```bash
npm run info:prod
```

Ou:

```bash
npx serverless info --stage prod
```

### Ver logs em tempo real

```bash
npm run logs:prod
```

Ou:

```bash
npx serverless logs -f app --stage prod --tail
```

### Ver logs de um período específico

```bash
npx serverless logs -f app --stage prod --startTime 1h
```

### Fazer redeploy (atualização)

```bash
npm run deploy:prod
```

### Remover o deploy (deletar tudo)

```bash
npx serverless remove --stage prod
```

> ⚠️ **CUIDADO:** Este comando remove completamente a stack da AWS!

### Deploy para ambiente de desenvolvimento

```bash
npm run deploy:dev
```

---

## ✅ Verificação Pós-Deploy

### 1. Testar a API

#### Health Check (se implementado)

```bash
curl https://SEU-ENDPOINT.execute-api.us-east-1.amazonaws.com/prod/api/health
```

#### Listar KOLs (requer autenticação)

```bash
curl -X GET \
  https://SEU-ENDPOINT.execute-api.us-east-1.amazonaws.com/prod/api/kols \
  -H 'X-API-Key: F8mhwFjI2Ueo2BqPWr6AXC2Z-YpS073JJqstcVk' \
  -H 'Authorization: Bearer SEU_JWT_TOKEN'
```

### 2. Verificar no Console AWS

1. Acesse: https://console.aws.amazon.com/lambda/
2. Procure por: `backend-msl-app-prod-app`
3. Verifique os logs em **CloudWatch Logs**

### 3. Configurar MongoDB Network Access

Se estiver usando MongoDB Atlas:

1. Acesse: https://cloud.mongodb.com/
2. Vá em **Network Access**
3. Clique em **Add IP Address**
4. Selecione **Allow Access from Anywhere** (`0.0.0.0/0`)
5. Ou adicione os IPs específicos da AWS

> 💡 Para encontrar os IPs da Lambda, verifique os logs da primeira execução.

---

## 🔧 Troubleshooting

### Erro: "User is not authorized to perform: lambda:CreateFunction"

**Problema:** Usuário IAM não tem permissões suficientes.

**Solução:**
1. Vá ao Console IAM
2. Adicione a policy **AWSLambdaFullAccess** ao usuário
3. Adicione também **AmazonAPIGatewayAdministrator**

---

### Erro: "Unable to connect to MongoDB"

**Problema:** Lambda não consegue conectar ao MongoDB.

**Solução:**
1. Verifique se o `DB_URL` em `config.prod.json` está correto
2. No MongoDB Atlas:
   - **Network Access** → Permitir `0.0.0.0/0`
3. Verifique se o banco existe e está online

---

### Erro: "Task timed out after 30.00 seconds"

**Problema:** Função Lambda excedeu o timeout.

**Solução:**
Aumentar o timeout no `serverless.yml`:

```yaml
provider:
  timeout: 60  # Aumentar para 60 segundos
```

Depois fazer redeploy:
```bash
npm run deploy:prod
```

---

### Erro: "Cannot find module 'mongoose'"

**Problema:** Dependências não foram empacotadas corretamente.

**Solução:**
```bash
# Limpar node_modules
rm -rf node_modules

# Reinstalar dependências
npm install

# Fazer redeploy
npm run deploy:prod
```

---

### Erro: "Serverless command not found"

**Problema:** Serverless Framework não está instalado.

**Solução:**
```bash
# Instalar globalmente (opcional)
npm install -g serverless

# Ou usar via npx
npx serverless deploy --stage prod
```

---

### Lambda retorna erro 502/504

**Problema:** Erro interno na função ou timeout.

**Solução:**
1. Verificar logs:
   ```bash
   npm run logs:prod
   ```
2. Procurar por erros de conexão com MongoDB
3. Verificar se as variáveis de ambiente estão corretas
4. Testar localmente com:
   ```bash
   npm run dev
   ```

---

## 💰 Custos AWS

### AWS Lambda - Free Tier

A AWS oferece o seguinte free tier permanente:

- **1 milhão de requisições gratuitas por mês**
- **400.000 GB-segundo de computação por mês**

### Cálculo para esta aplicação

Com a configuração atual:
- **Memória:** 1024 MB (1 GB)
- **Timeout:** 30 segundos

**Tempo gratuito por mês:**
```
400.000 GB-segundo ÷ 1 GB = 400.000 segundos
400.000 segundos ÷ 3600 = ~111 horas de execução
```

### Após o Free Tier

**Preço aproximado (us-east-1):**
- **Requisições:** $0.20 por 1 milhão de requisições
- **Computação:** $0.0000166667 por GB-segundo

**Exemplo:** 1 milhão de requisições + 500.000 GB-segundo
```
$0.20 (requisições) + $8.33 (computação) = ~$8.53/mês
```

### API Gateway - Free Tier

- **1 milhão de chamadas gratuitas por mês** (primeiros 12 meses)
- Após: $3.50 por milhão de requisições

### CloudWatch Logs

- **5 GB de ingestão de logs grátis por mês**
- **5 GB de armazenamento grátis por mês**

### Estimativa Total

Para uso moderado (< 1M requisições/mês):
- **Custo mensal estimado:** $0 - $15/mês

---

## 🔒 Segurança

### ✅ Boas Práticas Implementadas

1. **Arquivos sensíveis no .gitignore**
   - `config.*.json` não são commitados
   - Credenciais AWS não estão no código

2. **Helmet.js**
   - Headers de segurança HTTP configurados

3. **CORS configurado**
   - Controle de origens permitidas

4. **Autenticação**
   - API Key obrigatório (`X-API-Key` header)
   - JWT para autenticação de usuários

### ⚠️ Recomendações Adicionais

#### 1. Usar AWS Secrets Manager

Em vez de `config.prod.json`, armazene secrets na AWS:

```bash
# Criar secret no AWS Secrets Manager
aws secretsmanager create-secret \
  --name msl-app-prod-db-url \
  --secret-string "mongodb+srv://..."

aws secretsmanager create-secret \
  --name msl-app-prod-secret-token \
  --secret-string "seu-secret-token"
```

Depois, atualizar `serverless.yml`:
```yaml
environment:
  DB_URL: ${ssm:/aws/reference/secretsmanager/msl-app-prod-db-url}
  SECRET_TOKEN: ${ssm:/aws/reference/secretsmanager/msl-app-prod-secret-token}
```

#### 2. Configurar API Gateway Throttling

Limite de requisições por segundo para evitar abusos:

```yaml
provider:
  apiGateway:
    throttle:
      rateLimit: 100  # requisições por segundo
      burstLimit: 200  # pico de requisições
```

#### 3. Configurar CloudWatch Alarms

Monitorar erros e performance:

```bash
# Criar alarme para erros
aws cloudwatch put-metric-alarm \
  --alarm-name backend-msl-app-prod-errors \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
```

#### 4. Habilitar AWS WAF

Proteção contra ataques web comuns:
- SQL Injection
- XSS (Cross-Site Scripting)
- Rate limiting avançado

#### 5. Rotação de Credenciais

- Trocar `SECRET_TOKEN` periodicamente (ex: a cada 90 dias)
- Rotacionar Access Keys da AWS
- Usar senhas fortes no MongoDB

#### 6. MongoDB Atlas Security

- **Network Access:** Limitar IPs específicos (em vez de 0.0.0.0/0)
- **Database Access:** Usar usuários com permissões mínimas necessárias
- **Encryption:** Habilitar encryption at rest

#### 7. Monitoramento

Configurar alertas para:
- Número excessivo de requisições
- Taxa de erro alta (> 5%)
- Latência alta (> 3 segundos)
- Uso de memória próximo ao limite

---

## 📚 Recursos Adicionais

### Documentação Oficial

- **AWS Lambda:** https://docs.aws.amazon.com/lambda/
- **Serverless Framework:** https://www.serverless.com/framework/docs
- **MongoDB Atlas:** https://docs.atlas.mongodb.com/
- **API Gateway:** https://docs.aws.amazon.com/apigateway/

### Ferramentas Úteis

- **AWS Console:** https://console.aws.amazon.com/
- **Serverless Dashboard:** https://app.serverless.com/
- **MongoDB Atlas:** https://cloud.mongodb.com/
- **Postman:** Para testar a API

---

## 📞 Suporte

### Em caso de problemas:

1. Verifique os logs: `npm run logs:prod`
2. Consulte a seção [Troubleshooting](#troubleshooting)
3. Verifique a documentação completa em `API_SPECIFICATION.md`
4. Revise as configurações em `serverless.yml` e `config.prod.json`

---

## 🎯 Checklist Final

Antes de ir para produção, verifique:

- [ ] Credenciais AWS configuradas
- [ ] `config.prod.json` com dados corretos
- [ ] MongoDB acessível da AWS
- [ ] Deploy executado com sucesso
- [ ] Endpoint da API anotado
- [ ] API testada e funcionando
- [ ] Logs sendo gerados no CloudWatch
- [ ] Monitoramento configurado (opcional)
- [ ] Backup do MongoDB configurado
- [ ] Documentação da API compartilhada com o time

---

## 🔄 Atualizações

Para atualizar a aplicação em produção:

```bash
# 1. Fazer alterações no código
# 2. Testar localmente
npm run dev

# 3. Fazer commit
git add .
git commit -m "feat: nova funcionalidade"

# 4. Fazer redeploy
npm run deploy:prod

# 5. Verificar logs
npm run logs:prod
```

---

**Última atualização:** 2026-02-07
**Versão do Node.js:** 18.x
**Serverless Framework:** 3.40.0
**Região AWS:** us-east-1

---

🎉 **Parabéns! Sua aplicação está pronta para produção!**
