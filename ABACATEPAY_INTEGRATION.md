# Integração AbacatePay - Documentação

Esta documentação explica como usar a integração do AbacatePay para pagamentos PIX no sistema SIZ Cosméticos.

## URL do Webhook

A URL do webhook para configurar no painel do AbacatePay é:

```
https://siz-cosmetic-store-pro.vercel.app/api/webhook/abacatepay?webhookSecret=SUA_CHAVE_SECRETA
```

**Importante:** Substitua `SUA_CHAVE_SECRETA` pela chave secreta configurada na variável de ambiente `ABACATEPAY_WEBHOOK_SECRET`.

## Configuração das Variáveis de Ambiente

### No painel da Vercel, configure as seguintes variáveis:

1. **ABACATEPAY_API_KEY**: Sua chave de API do AbacatePay
2. **ABACATEPAY_API_URL**: URL da API (padrão: `https://api.abacatepay.com`)
3. **ABACATEPAY_WEBHOOK_SECRET**: Chave secreta para validar webhooks
4. **WEBHOOK_BASE_URL**: URL base do seu site (ex: `https://siz-cosmetic-store-pro.vercel.app`)

### Exemplo de configuração:
```env
ABACATEPAY_API_KEY=abacate_live_xxxxxxxxxxxxxxxx
ABACATEPAY_API_URL=https://api.abacatepay.com
ABACATEPAY_WEBHOOK_SECRET=minha-chave-secreta-super-segura
WEBHOOK_BASE_URL=https://siz-cosmetic-store-pro.vercel.app
```

## Como Usar os Componentes

### 1. Componente PixCheckout

O componente `PixCheckout` é responsável por exibir o QR Code PIX e gerenciar o status do pagamento.

```tsx
import { PixCheckout } from '@/components/checkout/PixCheckout';

function MeuCheckout() {
  return (
    <PixCheckout
      amount={100.50}
      orderId={12345}
      customerInfo={{
        name: "João Silva",
        email: "joao@email.com",
        phone: "(11) 99999-9999"
      }}
      onPaymentSuccess={(paymentData) => {
        console.log('Pagamento confirmado!', paymentData);
        // Redirecionar para página de sucesso
      }}
      onPaymentError={(error) => {
        console.error('Erro no pagamento:', error);
        // Exibir mensagem de erro
      }}
      onCancel={() => {
        console.log('Pagamento cancelado');
        // Voltar para página anterior
      }}
    />
  );
}
```

### 2. Componente CheckoutExample

O componente `CheckoutExample` mostra um exemplo completo de checkout com seleção de método de pagamento.

```tsx
import { CheckoutExample } from '@/components/checkout/CheckoutExample';

function MinhaPageCheckout() {
  return (
    <CheckoutExample
      orderId={12345}
      amount={100.50}
      customerInfo={{
        name: "João Silva",
        email: "joao@email.com"
      }}
      onPaymentSuccess={() => {
        // Redirecionar para página de sucesso
        window.location.href = '/pedido/sucesso';
      }}
      onPaymentCancel={() => {
        // Voltar para carrinho
        window.location.href = '/carrinho';
      }}
    />
  );
}
```

## Serviços Disponíveis

### AbacatePayService

```tsx
import {
  createAbacatePayment,
  checkPaymentStatus,
  copyPixCode,
  formatCurrency
} from '@/lib/abacatePayService';

// Criar pagamento PIX
const payment = await createAbacatePayment({
  amount: 100.50,
  orderId: 12345,
  customerInfo: {
    name: "João Silva",
    email: "joao@email.com"
  }
});

// Verificar status do pagamento
const status = await checkPaymentStatus(payment.id);

// Copiar código PIX
await copyPixCode(payment.qrCodeText);

// Formatar valor monetário
const formatted = formatCurrency(100.50); // "R$ 100,50"
```

## Fluxo de Pagamento

1. **Cliente escolhe PIX**: O cliente seleciona PIX como método de pagamento
2. **Criação do pagamento**: Sistema chama a API do AbacatePay para criar o pagamento
3. **Exibição do QR Code**: QR Code PIX é exibido para o cliente
4. **Cliente paga**: Cliente escaneia o QR Code ou copia o código PIX
5. **Webhook recebido**: AbacatePay envia webhook confirmando o pagamento
6. **Atualização do pedido**: Sistema atualiza o status do pedido para "pago"
7. **Notificação**: Cliente é notificado sobre a confirmação do pagamento

## Eventos de Webhook Suportados

### billing.paid
Disparado quando o pagamento é confirmado.

```json
{
  "data": {
    "payment": {
      "amount": 10000,
      "fee": 80,
      "method": "PIX"
    },
    "pixQrCode": {
      "amount": 10000,
      "id": "pix_char_mXTWdj6sABWnc4uL2Rh1r6tb",
      "kind": "PIX",
      "status": "PAID"
    }
  },
  "devMode": false,
  "event": "billing.paid"
}
```

### billing.failed
Disparado quando o pagamento falha.

```json
{
  "data": {
    "payment": {
      "id": "pix_char_mXTWdj6sABWnc4uL2Rh1r6tb",
      "status": "FAILED",
      "reason": "expired"
    }
  },
  "devMode": false,
  "event": "billing.failed"
}
```

## Endpoints da API

### POST /api/payment/abacatepay/create
Cria um novo pagamento PIX.

**Body:**
```json
{
  "amount": 100.50,
  "orderId": 12345,
  "customerInfo": {
    "name": "João Silva",
    "email": "joao@email.com"
  }
}
```

**Response:**
```json
{
  "id": "pix_char_xxxxxxxx",
  "qrCode": "data:image/png;base64,...",
  "qrCodeText": "00020126580014br.gov.bcb.pix...",
  "amount": 100.50,
  "status": "pending",
  "expiresAt": "2024-01-01T12:00:00Z"
}
```

### GET /api/payment/abacatepay/status/:paymentId
Verifica o status de um pagamento.

**Response:**
```json
{
  "status": "paid"
}
```

### POST /api/webhook/abacatepay
Endpoint para receber webhooks do AbacatePay.

**Query Parameters:**
- `webhookSecret`: Chave secreta para validação

## Segurança

1. **Validação de Webhook**: Todos os webhooks são validados usando a chave secreta
2. **Autenticação**: Endpoints de pagamento requerem autenticação
3. **HTTPS**: Todas as comunicações devem usar HTTPS
4. **Logs**: Todos os eventos são logados para auditoria

## Troubleshooting

### Webhook não está sendo recebido
1. Verifique se a URL do webhook está correta no painel do AbacatePay
2. Confirme se a chave secreta está configurada corretamente
3. Verifique os logs do servidor para erros

### Pagamento não é confirmado
1. Verifique se o webhook está sendo processado corretamente
2. Confirme se o status do pedido está sendo atualizado
3. Verifique os logs do AbacatePay

### Erro ao criar pagamento
1. Verifique se a chave de API está correta
2. Confirme se o valor está no formato correto (centavos)
3. Verifique se todos os campos obrigatórios estão preenchidos

## Implementação Completa ✅

### ✅ **Arquivos Implementados**

**Backend:**
- `server/routes.ts` - Endpoints para AbacatePay e webhook
- `server/storage.ts` - Métodos para gerenciar pagamentos
- `migrations/0003_add_payments_table.sql` - Migração da tabela de pagamentos
- `shared/schema.ts` - Schema da tabela payments

**Frontend:**
- `client/src/lib/abacatePayService.ts` - Serviço de integração
- `client/src/components/checkout/PixCheckout.tsx` - Componente de checkout PIX
- `client/src/components/checkout/CheckoutExample.tsx` - Exemplo de uso
- `client/src/pages/Checkout.tsx` - Página de checkout integrada
- `client/src/api.ts` - APIs do AbacatePay

### ✅ **Funcionalidades Implementadas**

1. **Tabela de Pagamentos no Supabase** - Armazena todos os dados de pagamento
2. **Componente PixCheckout** - Interface completa para pagamento PIX
3. **Integração na Página de Checkout** - PIX como opção de pagamento
4. **Webhook de Confirmação** - Processamento automático de confirmações
5. **Verificação de Status** - Monitoramento em tempo real
6. **Persistência de Dados** - Todos os dados salvos no Supabase

### ✅ **Como Testar**

1. **Configurar variáveis de ambiente** no painel da Vercel
2. **Acessar a página de checkout** com itens no carrinho
3. **Selecionar PIX** como método de pagamento
4. **Finalizar compra** - será exibido o componente PixCheckout
5. **Simular pagamento** via webhook do AbacatePay

### ✅ **Estrutura da Tabela Payments**

```sql
CREATE TABLE "payments" (
  "id" SERIAL PRIMARY KEY,
  "order_id" INTEGER NOT NULL,
  "user_id" INTEGER NOT NULL,
  "payment_method" TEXT NOT NULL,
  "payment_provider" TEXT NOT NULL,
  "external_payment_id" TEXT UNIQUE,
  "amount" NUMERIC(10, 2) NOT NULL,
  "currency" TEXT DEFAULT 'BRL' NOT NULL,
  "status" TEXT DEFAULT 'pending' NOT NULL,
  "pix_qr_code" TEXT,
  "pix_qr_code_text" TEXT,
  "expires_at" TIMESTAMP,
  "paid_at" TIMESTAMP,
  "failed_at" TIMESTAMP,
  "failure_reason" TEXT,
  "webhook_data" JSONB,
  "customer_info" JSONB,
  "metadata" JSONB,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);
```

## Suporte

Para suporte técnico:
- Documentação do AbacatePay: https://docs.abacatepay.com
- Suporte do AbacatePay: suporte@abacatepay.com

## Status da Implementação

✅ **COMPLETO** - A integração AbacatePay está totalmente implementada e pronta para uso!
