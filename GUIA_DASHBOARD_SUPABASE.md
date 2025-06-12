# Guia: Deploy Edge Functions via Dashboard Supabase

Este guia te ajuda a migrar as funções de pagamento para Edge Functions do Supabase usando apenas o dashboard, sem precisar do CLI.

## 🎯 Objetivo

Resolver o problema de limite de funções serverless na Vercel (12 funções) migrando as funções de pagamento para Edge Functions do Supabase.

## 📋 Pré-requisitos

1. ✅ Conta no Supabase
2. ✅ Projeto criado no Supabase
3. ✅ Variáveis `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` configuradas

## 🔍 Passo 1: Verificar Configuração

Execute este comando para verificar se tudo está configurado:

```bash
npm run supabase:check
```

Este script irá:
- ✅ Testar conexão com Supabase
- ✅ Verificar se as tabelas necessárias existem
- ✅ Gerar instruções personalizadas para seu projeto

## 🚀 Passo 2: Criar Edge Functions no Dashboard

### 2.1 Acessar Dashboard
1. Vá para [supabase.com](https://supabase.com)
2. Faça login e selecione seu projeto
3. No menu lateral, clique em **Edge Functions**

### 2.2 Criar Função de Pagamento

1. Clique em **Create a new function**
2. **Nome da função**: `payment`
3. **Código**: Cole o conteúdo do arquivo `supabase/functions/payment/index.ts`
4. Clique em **Deploy function**

### 2.3 Criar Função de Webhook

1. Clique em **Create a new function** novamente
2. **Nome da função**: `webhook-abacatepay`
3. **Código**: Cole o conteúdo do arquivo `supabase/functions/webhook-abacatepay/index.ts`
4. Clique em **Deploy function**

## ⚙️ Passo 3: Configurar Variáveis de Ambiente

No dashboard do Supabase:

1. Vá em **Settings** > **Edge Functions**
2. Na seção **Environment Variables**, adicione:

```env
ABACATEPAY_API_KEY=sua_chave_api_abacatepay
ABACATEPAY_API_URL=https://api.abacatepay.com
ABACATEPAY_WEBHOOK_SECRET=sua_chave_secreta_webhook
WEBHOOK_BASE_URL=https://seu-projeto.supabase.co
```

**⚠️ Importante**: Substitua `seu-projeto` pela referência real do seu projeto Supabase.

## 🔗 Passo 4: Configurar Webhook no AbacatePay

1. Acesse o painel do AbacatePay
2. Vá em configurações de webhook
3. Configure a URL: `https://seu-projeto.supabase.co/functions/v1/webhook-abacatepay`

## 🌐 Passo 5: Atualizar Frontend

Adicione/atualize no seu arquivo `.env`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key
```

O frontend já está configurado para usar Edge Functions automaticamente quando essas variáveis estiverem definidas.

## 🧪 Passo 6: Testar as Funções

### 6.1 Teste Básico
Execute o script de teste:

```bash
npm run test:edge-functions
```

### 6.2 Teste Manual

**Testar Função de Pagamento**:
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

**Testar Webhook**:
```bash
curl -X POST https://seu-projeto.supabase.co/functions/v1/webhook-abacatepay \
  -H "Content-Type: application/json" \
  -d '{
    "event": "billing.paid",
    "payment": { "id": "test-123" }
  }'
```

## 📊 Passo 7: Monitorar

### 7.1 Ver Logs
No dashboard do Supabase:
1. Vá em **Edge Functions**
2. Clique na função que quer monitorar
3. Veja os logs na aba **Logs**

### 7.2 Métricas
- Visualize execuções, erros e latência
- Configure alertas se necessário

## 🔄 Rollback (se necessário)

Se algo der errado, você pode voltar para as funções Vercel:

1. **Remover/comentar no `.env`**:
   ```env
   # VITE_SUPABASE_URL=
   ```

2. **O frontend automaticamente usará `/api/payment`**

## ✅ Benefícios Alcançados

- **Redução de funções Vercel**: De 10 para 8 funções
- **Melhor performance**: Edge Functions mais próximas do usuário
- **Integração nativa**: Acesso direto ao banco Supabase
- **Escalabilidade**: Sem limites de execução

## 🆘 Troubleshooting

### Erro: "Function not found"
- ✅ Verifique se o deploy foi feito corretamente
- ✅ Confirme o nome da função no dashboard

### Erro: "Database connection failed"
- ✅ Verifique `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`
- ✅ Execute `npm run supabase:check`

### Erro: "AbacatePay API error"
- ✅ Verifique `ABACATEPAY_API_KEY`
- ✅ Confirme se a chave está ativa no AbacatePay

### Erro: "Invalid webhook signature"
- ✅ Verifique `ABACATEPAY_WEBHOOK_SECRET`
- ✅ Confirme a URL do webhook no AbacatePay

## 📞 Suporte

Se encontrar problemas:

1. **Execute**: `npm run supabase:check`
2. **Verifique logs** no dashboard do Supabase
3. **Teste as funções** com `npm run test:edge-functions`
4. **Verifique variáveis** de ambiente

## 🎉 Próximos Passos

Após configurar as Edge Functions:

1. ✅ Testar pagamentos PIX, cartão e boleto
2. ✅ Monitorar logs e performance
3. ✅ Considerar remover funções Vercel antigas (opcional)
4. ✅ Configurar alertas de monitoramento

---

**💡 Dica**: Mantenha as funções Vercel como backup até ter certeza de que as Edge Functions estão funcionando perfeitamente em produção.
