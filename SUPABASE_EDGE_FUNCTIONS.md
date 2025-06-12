# Migração para Edge Functions do Supabase

Este documento explica como migrar as funções de pagamento para Edge Functions do Supabase para resolver o problema de limite de funções serverless na Vercel.

## Problema Original

O projeto estava excedendo o limite de 12 funções serverless do plano Hobby da Vercel. Para resolver isso, migramos as funções críticas de pagamento para Edge Functions do Supabase.

## Edge Functions Criadas

### 1. `/supabase/functions/payment/index.ts`
- **Função**: Processar pagamentos PIX, cartão de crédito e boleto
- **Substitui**: `api/payment.ts`
- **URL**: `https://[seu-projeto].supabase.co/functions/v1/payment`

### 2. `/supabase/functions/webhook-abacatepay/index.ts`
- **Função**: Processar webhooks do AbacatePay
- **Substitui**: `api/webhook/abacatepay.ts`
- **URL**: `https://[seu-projeto].supabase.co/functions/v1/webhook-abacatepay`

## Configuração das Edge Functions

### 1. Instalar Supabase CLI

```bash
npm install -g supabase
```

### 2. Fazer login no Supabase

```bash
supabase login
```

### 3. Linkar o projeto

```bash
supabase link --project-ref [seu-project-ref]
```

### 4. Configurar variáveis de ambiente no Supabase

No painel do Supabase, vá em Settings > Edge Functions e configure:

```env
ABACATEPAY_API_KEY=sua_chave_api_abacatepay
ABACATEPAY_API_URL=https://api.abacatepay.com
ABACATEPAY_WEBHOOK_SECRET=sua_chave_secreta_webhook
WEBHOOK_BASE_URL=https://seu-projeto.supabase.co
```

### 5. Deploy das Edge Functions

```bash
# Deploy da função de pagamento
supabase functions deploy payment

# Deploy da função de webhook
supabase functions deploy webhook-abacatepay
```

## Verificação do Schema do Supabase

Execute o script de verificação para garantir que todas as tabelas estão corretas:

```bash
npx tsx scripts/verify-supabase-schema.ts
```

Este script irá:
- ✅ Verificar se todas as tabelas existem
- ✅ Validar colunas necessárias
- ✅ Criar tabelas faltando (se necessário)
- ✅ Gerar relatório em JSON

## Configuração do Frontend

O frontend foi atualizado para usar Edge Functions automaticamente quando disponíveis:

```typescript
// Em client/src/lib/abacatePayService.ts
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const useEdgeFunction = supabaseUrl && supabaseUrl !== 'https://your-project.supabase.co';

let endpoint = '/api/payment'; // Fallback para Vercel API

if (useEdgeFunction) {
  endpoint = `${supabaseUrl}/functions/v1/payment`;
}
```

## Variáveis de Ambiente Necessárias

### No Supabase (Edge Functions)
```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
ABACATEPAY_API_KEY=sua_chave_api
ABACATEPAY_API_URL=https://api.abacatepay.com
ABACATEPAY_WEBHOOK_SECRET=sua_chave_webhook
WEBHOOK_BASE_URL=https://seu-projeto.supabase.co
```

### No Frontend (Vite)
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key
```

## Configuração do Webhook no AbacatePay

Configure a URL do webhook no painel do AbacatePay:

```
https://seu-projeto.supabase.co/functions/v1/webhook-abacatepay
```

## Benefícios da Migração

### ✅ Redução de Funções Serverless
- **Antes**: 10 funções na Vercel
- **Depois**: 8 funções na Vercel (removendo payment e webhook)
- **Resultado**: Dentro do limite de 12 funções

### ✅ Melhor Performance
- Edge Functions executam mais próximo do usuário
- Menor latência para operações de pagamento
- Melhor escalabilidade

### ✅ Integração Nativa com Supabase
- Acesso direto ao banco sem configuração adicional
- Autenticação automática
- Logs centralizados

## Monitoramento

### Logs das Edge Functions
```bash
# Ver logs em tempo real
supabase functions logs payment

# Ver logs do webhook
supabase functions logs webhook-abacatepay
```

### Métricas no Painel Supabase
- Acesse Settings > Edge Functions
- Visualize métricas de execução
- Monitore erros e performance

## Rollback (se necessário)

Se precisar voltar para as funções Vercel:

1. **Remover variável de ambiente**:
   ```env
   # Remover ou comentar no .env
   # VITE_SUPABASE_URL=
   ```

2. **O frontend automaticamente usará `/api/payment`**

3. **Manter Edge Functions como backup**

## Testes

### Testar Edge Function de Pagamento
```bash
curl -X POST https://seu-projeto.supabase.co/functions/v1/payment \
  -H "Authorization: Bearer sua_anon_key" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "orderId": 123,
    "paymentMethod": "pix",
    "customerInfo": {
      "name": "Teste",
      "email": "teste@email.com"
    }
  }'
```

### Testar Webhook
```bash
curl -X POST https://seu-projeto.supabase.co/functions/v1/webhook-abacatepay \
  -H "Content-Type: application/json" \
  -d '{
    "event": "billing.paid",
    "payment": {
      "id": "test-payment-id"
    }
  }'
```

## Próximos Passos

1. ✅ Deploy das Edge Functions
2. ✅ Configurar variáveis de ambiente
3. ✅ Testar pagamentos PIX, cartão e boleto
4. ✅ Configurar webhook no AbacatePay
5. ✅ Monitorar logs e métricas
6. ✅ Remover funções Vercel antigas (opcional)

## Suporte

Se encontrar problemas:

1. **Verificar logs**: `supabase functions logs [nome-da-funcao]`
2. **Verificar variáveis**: Painel Supabase > Settings > Edge Functions
3. **Testar conectividade**: Execute `scripts/verify-supabase-schema.ts`
4. **Rollback**: Remover `VITE_SUPABASE_URL` para usar Vercel API
