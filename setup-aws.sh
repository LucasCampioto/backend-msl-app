#!/bin/bash

# Script para configurar credenciais AWS
# Execute: ./setup-aws.sh

echo "==================================="
echo "  Configuração AWS para Deploy"
echo "==================================="
echo ""

# Verificar se já existe configuração
if [ -f ~/.aws/credentials ]; then
    echo "⚠️  Já existe uma configuração AWS."
    read -p "Deseja sobrescrever? (s/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo "Configuração cancelada."
        exit 0
    fi
fi

# Criar diretório .aws se não existir
mkdir -p ~/.aws

# Solicitar credenciais
echo "Por favor, forneça suas credenciais AWS:"
echo "(Você pode obtê-las em: https://console.aws.amazon.com/iam/)"
echo ""

read -p "AWS Access Key ID: " AWS_ACCESS_KEY_ID
read -sp "AWS Secret Access Key: " AWS_SECRET_ACCESS_KEY
echo ""
read -p "Região (padrão: us-east-1): " AWS_REGION
AWS_REGION=${AWS_REGION:-us-east-1}

# Criar arquivo de credenciais
cat > ~/.aws/credentials << EOF
[default]
aws_access_key_id = $AWS_ACCESS_KEY_ID
aws_secret_access_key = $AWS_SECRET_ACCESS_KEY
EOF

# Criar arquivo de configuração
cat > ~/.aws/config << EOF
[default]
region = $AWS_REGION
output = json
EOF

# Definir permissões corretas
chmod 600 ~/.aws/credentials
chmod 600 ~/.aws/config

echo ""
echo "✅ Credenciais AWS configuradas com sucesso!"
echo ""
echo "Agora você pode fazer o deploy com:"
echo "  npx serverless deploy --stage prod"
echo ""
