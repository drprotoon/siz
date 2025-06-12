# Edge Functions do Supabase

Este diretório contém as Edge Functions do Supabase para o projeto SIZ Cosméticos.

## Estrutura

```
supabase/
├── functions/
│   ├── payment/
│   │   └── index.ts          # Processamento de pagamentos
│   └── webhook-abacatepay/
│       └── index.ts          # Webhook do AbacatePay
├── config.toml               # Configuração do Supabase
└── README.md                 # Este arquivo
```

## Edge Functions Disponíveis

### 1. Payment Function (`/functions/v1/payment`)

**Descrição**: Processa pagamentos PIX, cartão de crédito e boleto via AbacatePay.

**Métodos**: POST

**Payload**:
```json
{
  "amount": 100,
  "orderId": 12345,
  "paymentMethod": "pix|credit_card|boleto",
  "customerInfo": {
    "name": "João Silva",
    "email": "joao@email.com",
    "document": "12345678901",
    "phone": "11999999999"
  },
  "cardDetails": {
    "number": "4111111111111111",
    "name": "João Silva",
    "expiry": "12/25",
    "cvc": "123"
  }
}
```

**Resposta PIX**:
```json
{
  "id": "payment-id",
  "status": "pending",
  "amount": 100,
  "paymentMethod": "pix",
  "qrCode": "base64-qr-code",
  "qrCodeText": "pix-code-text",
  "expiresAt": "2024-01-01T12:00:00Z",
  "databaseId": 123
}
```

### 2. Webhook Function (`/functions/v1/webhook-abacatepay`)

**Descrição**: Processa webhooks do AbacatePay para atualizar status de pagamentos.

**Métodos**: POST

**Eventos Suportados**:
- `billing.paid` - Pagamento confirmado
- `billing.failed` - Pagamento falhou
- `billing.expired` - Pagamento expirou

**Payload**:
```json
{
  "event": "billing.paid",
  "payment": {
    "id": "payment-id",
    "status": "paid"
  },
  "pixQrCode": {
    "id": "payment-id",
    "status": "paid"
  }
}
```

## Configuração

### Variáveis de Ambiente (Supabase)

Configure no painel do Supabase em Settings > Edge Functions:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
ABACATEPAY_API_KEY=sua_chave_api_abacatepay
ABACATEPAY_API_URL=https://api.abacatepay.com
ABACATEPAY_WEBHOOK_SECRET=sua_chave_secreta_webhook
WEBHOOK_BASE_URL=https://seu-projeto.supabase.co
```

### Variáveis de Ambiente (Frontend)

Configure no arquivo `.env` do projeto:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key
```

## Deploy

### Pré-requisitos

1. **Instalar Supabase CLI**:
   ```bash
   npm install -g supabase
   ```

2. **Fazer login**:
   ```bash
   supabase login
   ```

3. **Linkar projeto**:
   ```bash
   supabase link --project-ref SEU_PROJECT_REF
   ```

### Deploy Automático

Use o script automatizado:

```bash
npm run supabase:deploy
```

### Deploy Manual

```bash
# Deploy função de pagamento
supabase functions deploy payment

# Deploy função de webhook
supabase functions deploy webhook-abacatepay
```

## Testes

### Verificar Schema do Supabase

```bash
npm run supabase:verify
```

### Testar Edge Functions

```bash
npm run test:edge-functions
```

### Monitorar Logs

```bash
# Logs da função de pagamento
supabase functions logs payment

# Logs da função de webhook
supabase functions logs webhook-abacatepay
```

## Desenvolvimento Local

### Iniciar Supabase Local

```bash
supabase start
```

### Servir Edge Functions Localmente

```bash
supabase functions serve
```

As funções estarão disponíveis em:
- Payment: `http://localhost:54321/functions/v1/payment`
- Webhook: `http://localhost:54321/functions/v1/webhook-abacatepay`

## Troubleshooting

### Erro: "Function not found"

1. Verifique se o deploy foi feito corretamente
2. Confirme o nome da função no painel do Supabase
3. Verifique se as variáveis de ambiente estão configuradas

### Erro: "Database connection failed"

1. Verifique `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`
2. Confirme se as tabelas existem no banco
3. Execute `npm run supabase:verify` para verificar o schema

### Erro: "AbacatePay API error"

1. Verifique `ABACATEPAY_API_KEY` e `ABACATEPAY_API_URL`
2. Confirme se a chave API está ativa no painel do AbacatePay
3. Verifique os logs: `supabase functions logs payment`

### Erro: "Invalid webhook signature"

1. Verifique `ABACATEPAY_WEBHOOK_SECRET`
2. Confirme se a URL do webhook está correta no AbacatePay
3. Verifique os logs: `supabase functions logs webhook-abacatepay`

## Monitoramento

### Métricas no Painel Supabase

1. Acesse Settings > Edge Functions
2. Visualize execuções, erros e latência
3. Configure alertas se necessário

### Logs em Tempo Real

```bash
# Seguir logs em tempo real
supabase functions logs payment --follow
supabase functions logs webhook-abacatepay --follow
```

## Rollback

Se precisar voltar para as funções Vercel:

1. **Remover variável de ambiente**:
   ```env
   # Comentar ou remover
   # VITE_SUPABASE_URL=
   ```

2. **O frontend automaticamente usará `/api/payment`**

3. **Manter Edge Functions como backup**

## Suporte

Para problemas ou dúvidas:

1. Verifique os logs das funções
2. Execute os scripts de teste
3. Consulte a documentação do Supabase
4. Verifique a configuração das variáveis de ambiente
