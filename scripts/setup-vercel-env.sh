#!/bin/bash

# Script para configurar variáveis de ambiente no Vercel
# Execute este script após fazer login no Vercel CLI: vercel login

echo "🚀 Configurando variáveis de ambiente para produção no Vercel..."

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

echo "✅ Vercel CLI encontrado e usuário logado"

# Configurar variáveis de ambiente essenciais
echo "📝 Configurando variáveis de ambiente..."

# Banco de dados
echo "🗄️  Configurando DATABASE_URL..."
read -p "Digite a DATABASE_URL (PostgreSQL): " DATABASE_URL
vercel env add DATABASE_URL production <<< "$DATABASE_URL"

# Autenticação
echo "🔐 Configurando secrets de autenticação..."
read -p "Digite o SESSION_SECRET: " SESSION_SECRET
vercel env add SESSION_SECRET production <<< "$SESSION_SECRET"

read -p "Digite o JWT_SECRET: " JWT_SECRET
vercel env add JWT_SECRET production <<< "$JWT_SECRET"

# Supabase
echo "☁️  Configurando Supabase..."
read -p "Digite a SUPABASE_URL: " SUPABASE_URL
vercel env add SUPABASE_URL production <<< "$SUPABASE_URL"

read -p "Digite a SUPABASE_ANON_KEY: " SUPABASE_ANON_KEY
vercel env add SUPABASE_ANON_KEY production <<< "$SUPABASE_ANON_KEY"

read -p "Digite a SUPABASE_SERVICE_ROLE_KEY: " SUPABASE_SERVICE_ROLE_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY production <<< "$SUPABASE_SERVICE_ROLE_KEY"

# AbacatePay (PIX)
echo "💳 Configurando AbacatePay..."
read -p "Digite a ABACATEPAY_API_KEY: " ABACATEPAY_API_KEY
vercel env add ABACATEPAY_API_KEY production <<< "$ABACATEPAY_API_KEY"

read -p "Digite a ABACATEPAY_WEBHOOK_SECRET: " ABACATEPAY_WEBHOOK_SECRET
vercel env add ABACATEPAY_WEBHOOK_SECRET production <<< "$ABACATEPAY_WEBHOOK_SECRET"

read -p "Digite a WEBHOOK_BASE_URL (ex: https://seu-site.vercel.app): " WEBHOOK_BASE_URL
vercel env add WEBHOOK_BASE_URL production <<< "$WEBHOOK_BASE_URL"

# Configurações de produção
echo "⚙️  Configurando variáveis de produção..."
vercel env add NODE_ENV production <<< "production"
vercel env add DISABLE_SECURE_COOKIE production <<< "false"
vercel env add ABACATEPAY_API_URL production <<< "https://api.abacatepay.com"

# Configurações opcionais
echo "🔧 Configurações opcionais..."
read -p "Digite o STORE_NAME (padrão: SIZ COSMETICOS): " STORE_NAME
STORE_NAME=${STORE_NAME:-"SIZ COSMETICOS"}
vercel env add STORE_NAME production <<< "$STORE_NAME"

read -p "Digite o COOKIE_DOMAIN (opcional, deixe vazio se não souber): " COOKIE_DOMAIN
if [ ! -z "$COOKIE_DOMAIN" ]; then
    vercel env add COOKIE_DOMAIN production <<< "$COOKIE_DOMAIN"
fi

echo ""
echo "✅ Configuração concluída!"
echo ""
echo "📋 Variáveis configuradas:"
echo "  - DATABASE_URL"
echo "  - SESSION_SECRET"
echo "  - JWT_SECRET"
echo "  - SUPABASE_URL"
echo "  - SUPABASE_ANON_KEY"
echo "  - SUPABASE_SERVICE_ROLE_KEY"
echo "  - ABACATEPAY_API_KEY"
echo "  - ABACATEPAY_WEBHOOK_SECRET"
echo "  - WEBHOOK_BASE_URL"
echo "  - NODE_ENV"
echo "  - DISABLE_SECURE_COOKIE"
echo "  - ABACATEPAY_API_URL"
echo "  - STORE_NAME"
if [ ! -z "$COOKIE_DOMAIN" ]; then
    echo "  - COOKIE_DOMAIN"
fi

echo ""
echo "🚀 Agora você pode fazer o deploy com: vercel --prod"
echo ""
echo "💡 Dicas:"
echo "  - Verifique se todas as URLs estão corretas"
echo "  - Teste a aplicação após o deploy"
echo "  - Monitore os logs com: vercel logs"
