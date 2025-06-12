#!/bin/bash

# Script para deploy das Edge Functions do Supabase
# Este script automatiza o processo de deploy das funções de pagamento

set -e

echo "🚀 Deploy das Edge Functions do Supabase"
echo "========================================"

# Verificar se o Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI não encontrado"
    echo "📦 Instalando Supabase CLI..."
    npm install -g supabase
fi

echo "✅ Supabase CLI encontrado"

# Verificar se está logado
if ! supabase projects list &> /dev/null; then
    echo "🔐 Fazendo login no Supabase..."
    supabase login
fi

echo "✅ Usuário logado no Supabase"

# Verificar se o projeto está linkado
if [ ! -f ".supabase/config.toml" ]; then
    echo "🔗 Projeto não está linkado"
    echo "Por favor, execute: supabase link --project-ref SEU_PROJECT_REF"
    exit 1
fi

echo "✅ Projeto linkado"

# Verificar se as funções existem
if [ ! -d "supabase/functions/payment" ]; then
    echo "❌ Função payment não encontrada em supabase/functions/payment"
    exit 1
fi

if [ ! -d "supabase/functions/webhook-abacatepay" ]; then
    echo "❌ Função webhook-abacatepay não encontrada em supabase/functions/webhook-abacatepay"
    exit 1
fi

echo "✅ Funções encontradas"

# Deploy da função de pagamento
echo ""
echo "📤 Fazendo deploy da função payment..."
if supabase functions deploy payment; then
    echo "✅ Função payment deployada com sucesso"
else
    echo "❌ Erro no deploy da função payment"
    exit 1
fi

# Deploy da função de webhook
echo ""
echo "📤 Fazendo deploy da função webhook-abacatepay..."
if supabase functions deploy webhook-abacatepay; then
    echo "✅ Função webhook-abacatepay deployada com sucesso"
else
    echo "❌ Erro no deploy da função webhook-abacatepay"
    exit 1
fi

# Obter informações do projeto
PROJECT_REF=$(supabase status | grep "Project ref" | awk '{print $3}' || echo "")
if [ -z "$PROJECT_REF" ]; then
    PROJECT_REF=$(cat .supabase/config.toml | grep project_id | cut -d'"' -f2 || echo "seu-projeto")
fi

echo ""
echo "🎉 Deploy concluído com sucesso!"
echo "================================"
echo ""
echo "📋 URLs das Edge Functions:"
echo "💳 Payment: https://${PROJECT_REF}.supabase.co/functions/v1/payment"
echo "🔗 Webhook: https://${PROJECT_REF}.supabase.co/functions/v1/webhook-abacatepay"
echo ""
echo "⚙️  Próximos passos:"
echo "1. Configure as variáveis de ambiente no painel do Supabase:"
echo "   - ABACATEPAY_API_KEY"
echo "   - ABACATEPAY_API_URL"
echo "   - ABACATEPAY_WEBHOOK_SECRET"
echo "   - WEBHOOK_BASE_URL"
echo ""
echo "2. Configure a URL do webhook no AbacatePay:"
echo "   https://${PROJECT_REF}.supabase.co/functions/v1/webhook-abacatepay"
echo ""
echo "3. Atualize as variáveis de ambiente do frontend:"
echo "   VITE_SUPABASE_URL=https://${PROJECT_REF}.supabase.co"
echo ""
echo "4. Teste as funções:"
echo "   npm run test:edge-functions"
echo ""
echo "📊 Para monitorar as funções:"
echo "   supabase functions logs payment"
echo "   supabase functions logs webhook-abacatepay"
