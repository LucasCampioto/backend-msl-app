# Guia de Deploy para Produção

## Pré-requisitos

### 1. Configurar credenciais AWS

Você tem duas opções:

#### Opção A: Usar AWS CLI (Recomendado)

```bash
# Instalar AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configurar credenciais
aws configure
# AWS Access Key ID: [SUA_ACCESS_KEY]
# AWS Secret Access Key: [SUA_SECRET_KEY]
# Default region name: us-east-1
# Default output format: json
```

#### Opção B: Variáveis de ambiente

```bash
export AWS_ACCESS_KEY_ID=sua_access_key_id
export AWS_SECRET_ACCESS_KEY=sua_secret_access_key
export AWS_REGION=us-east-1
```

### 2. Configurar variáveis de ambiente de produção

Edite o arquivo `config.prod.json`:

```json
{
  "DB_URL": "mongodb+srv://user:password@cluster.mongodb.net/database",
  "SECRET_TOKEN": "um-token-secreto-muito-forte-e-aleatorio"
}
```

**IMPORTANTE:**
- Use um banco MongoDB diferente para produção
- Gere um SECRET_TOKEN forte (32+ caracteres aleatórios)
- Nunca commite este arquivo no git (já está no .gitignore)

## Deploy

### Deploy para produção

```bash
# Instalar dependências
npm install

# Deploy
npx serverless deploy --stage prod
```

### Deploy para desenvolvimento

```bash
npx serverless deploy --stage dev
```

## Após o deploy

O Serverless vai mostrar:
- **endpoint**: URL da sua API Lambda (ex: https://xxxxxx.execute-api.us-east-1.amazonaws.com/prod)
- **functions**: Nome da função Lambda criada

Anote o endpoint e use-o no frontend!

## Comandos úteis

```bash
# Ver logs em tempo real
npx serverless logs -f app --stage prod --tail

# Remover deploy
npx serverless remove --stage prod

# Ver informações do deploy
npx serverless info --stage prod
```

## Testando a API

```bash
# Substitua pela sua URL após o deploy
curl https://xxxxxx.execute-api.us-east-1.amazonaws.com/prod/api/health
```

## Custos AWS

Lambda tem free tier de:
- 1 milhão de requisições gratuitas por mês
- 400.000 GB-segundo de tempo de computação

Para esta configuração (1GB RAM, 30s timeout), você tem ~11 horas de execução grátis por mês.

## Troubleshooting

### Erro de permissões AWS
- Verifique se suas credenciais AWS estão corretas
- Verifique se o usuário IAM tem permissões para Lambda, API Gateway, CloudWatch, IAM

### Erro de conexão com MongoDB
- Verifique se o DB_URL está correto no config.prod.json
- Verifique se o MongoDB Atlas permite conexões de qualquer IP (0.0.0.0/0) ou dos IPs da AWS
- No MongoDB Atlas: Network Access → Add IP Address → Allow Access from Anywhere

### Lambda timeout
- Aumente o timeout no serverless.yml (linha 8: `timeout: 30`)
- Otimize queries do MongoDB
- Adicione índices nas collections

## Segurança

✅ **Boas práticas implementadas:**
- Config files no .gitignore
- Helmet.js para headers de segurança
- CORS configurado
- Autenticação via API Key + JWT

⚠️ **Recomendações:**
- Use AWS Secrets Manager para DB_URL e SECRET_TOKEN
- Configure API Gateway com throttling
- Configure CloudWatch Alarms para monitoramento
- Use MongoDB Atlas Network Access whitelist
