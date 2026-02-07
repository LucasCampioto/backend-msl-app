#!/bin/bash

echo "==================================="
echo "  Deploy Backend MSL - Produção"
echo "==================================="
echo ""

# Verificar se AWS está configurado
if [ ! -f ~/.aws/credentials ] && [ -z "$AWS_ACCESS_KEY_ID" ]; then
    echo "❌ Credenciais AWS não configuradas!"
    echo ""
    echo "Execute primeiro: ./setup-aws.sh"
    echo "Ou configure manualmente as variáveis:"
    echo "  export AWS_ACCESS_KEY_ID=your_key"
    echo "  export AWS_SECRET_ACCESS_KEY=your_secret"
    exit 1
fi

# Verificar se config.prod.json existe e está configurado
if [ ! -f config.prod.json ]; then
    echo "❌ Arquivo config.prod.json não encontrado!"
    exit 1
fi

if grep -q "SUBSTITUA" config.prod.json; then
    echo "❌ config.prod.json ainda não foi configurado!"
    echo "Edite o arquivo e adicione as credenciais corretas."
    exit 1
fi

echo "✅ Pré-requisitos verificados"
echo ""
echo "Instalando dependências..."
npm install --production

echo ""
echo "🚀 Iniciando deploy para PRODUÇÃO..."
echo "   Região: us-east-1"
echo "   Stage: prod"
echo ""

npx serverless deploy --stage prod

if [ $? -eq 0 ]; then
    echo ""
    echo "================================================"
    echo "  ✅ Deploy concluído com sucesso!"
    echo "================================================"
    echo ""
    echo "Próximos passos:"
    echo "1. Anote a URL do endpoint fornecida acima"
    echo "2. Configure esta URL no seu frontend"
    echo "3. Teste a API com: curl [URL]/api/health"
    echo ""
    echo "Comandos úteis:"
    echo "  - Ver logs: npx serverless logs -f app --stage prod --tail"
    echo "  - Ver info: npx serverless info --stage prod"
    echo "  - Remover: npx serverless remove --stage prod"
    echo ""
else
    echo ""
    echo "❌ Erro no deploy. Verifique as mensagens acima."
    exit 1
fi
