#!/bin/bash

# Script para fazer deploy rápido e testar os endpoints
# Execute com: ./scripts/quick-deploy-test.sh

echo "🚀 Deploy rápido para teste na Vercel..."
echo ""

# Verificar se o Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI não encontrado. Instale com: npm i -g vercel"
    exit 1
fi

# Verificar se está logado no Vercel
if ! vercel whoami &> /dev/null; then
    echo "❌ Não está logado no Vercel. Execute: vercel login"
    exit 1
fi

echo "✅ Vercel CLI configurado"

# Fazer build local primeiro para verificar se não há erros
echo "🔨 Fazendo build local..."
npm run build:prod

if [ $? -ne 0 ]; then
    echo "❌ Erro no build local. Corrija os erros antes de fazer deploy."
    exit 1
fi

echo "✅ Build local bem-sucedido"

# Deploy para produção
echo "📤 Fazendo deploy para produção..."
vercel --prod --yes

if [ $? -ne 0 ]; then
    echo "❌ Erro no deploy. Verifique os logs."
    exit 1
fi

echo "✅ Deploy concluído!"

# Obter URL do deploy
DEPLOY_URL=$(vercel ls --scope=team_siz 2>/dev/null | grep "https://" | head -1 | awk '{print $2}')

if [ -z "$DEPLOY_URL" ]; then
    # Fallback para URL padrão se não conseguir obter automaticamente
    DEPLOY_URL="https://sizcosmeticos.vercel.app"
    echo "⚠️  Não foi possível obter URL automaticamente. Usando URL padrão: $DEPLOY_URL"
else
    echo "🌐 URL do deploy: $DEPLOY_URL"
fi

# Aguardar um pouco para o deploy estar totalmente ativo
echo "⏳ Aguardando deploy estar ativo (30 segundos)..."
sleep 30

# Testar endpoints
echo "🧪 Testando endpoints..."
node test-production-api.js "$DEPLOY_URL"

echo ""
echo "🎉 Processo concluído!"
echo ""
echo "📋 Próximos passos:"
echo "  1. Verifique os resultados dos testes acima"
echo "  2. Se houver erros 404, verifique a configuração do vercel.json"
echo "  3. Se houver erros 500, verifique os logs: vercel logs --follow"
echo "  4. Teste manualmente no navegador: $DEPLOY_URL"
echo ""
echo "🔍 Comandos úteis:"
echo "  - Ver logs: vercel logs --follow"
echo "  - Ver deployments: vercel ls"
echo "  - Testar novamente: node test-production-api.js $DEPLOY_URL"
