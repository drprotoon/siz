# Otimização de Funções Serverless - Resumo

## Problema Original
O projeto estava excedendo o limite de 12 funções serverless do plano Hobby do Vercel, com **18 funções** originalmente.

## Estratégia de Consolidação

### 1. Consolidação de Endpoints de Autenticação
**Antes:**
- `api/auth/login-jwt.ts`
- `api/auth/me.ts`

**Depois:**
- `api/auth.ts` (consolidada)
  - POST: Login com JWT
  - GET: Obter usuário atual

### 2. Consolidação de Endpoints de Pagamento
**Antes:**
- `api/payment/abacatepay/create.ts`
- `api/payment/abacatepay/create-card.ts`
- `api/payment/abacatepay/create-boleto.ts`

**Depois:**
- `api/payment.ts` (consolidada)
  - Suporte a PIX, cartão de crédito e boleto
  - Detecção automática do método de pagamento

### 3. Consolidação de Endpoints de Usuário
**Antes:**
- `api/users/[userId]/address.ts`
- `api/users/[userId]/profile.ts`

**Depois:**
- `api/users/[userId].ts` (consolidada)
  - Detecção de endpoint por URL (/address ou /profile)
  - Suporte a GET e POST/PUT

### 4. Consolidação de Endpoints de Debug
**Antes:**
- `api/debug.ts`
- `api/debug/payment-config.ts`

**Depois:**
- `api/debug.ts` (consolidada)
  - Detecção de endpoint por URL (/payment-config)
  - Informações de debug e configuração de pagamento

### 5. Consolidação de Endpoints de Pedidos
**Antes:**
- `api/orders/index.ts`
- `api/orders/[id].ts`

**Depois:**
- `api/orders.ts` (consolidada)
  - Detecção automática de ID na URL
  - Suporte a GET (lista e específico), POST e PUT

### 6. Remoção de Funções Desnecessárias
**Removidas:**
- `api/migrate.ts` (migrações devem ser executadas no deploy)

## Resultado Final

### Funções Serverless Atuais (10 funções)
1. `api/address/[cep].ts` - Consulta de CEP
2. `api/auth.ts` - Autenticação consolidada
3. `api/cart.ts` - Carrinho de compras
4. `api/categories.ts` - Categorias de produtos
5. `api/debug.ts` - Debug e configurações consolidadas
6. `api/orders.ts` - Pedidos consolidados
7. `api/payment.ts` - Pagamentos consolidados
8. `api/products.ts` - Produtos
9. `api/users/[userId].ts` - Usuários consolidados
10. `api/webhook/abacatepay.ts` - Webhook do AbacatePay

### Redução Alcançada
- **Antes:** 18 funções (excedia o limite)
- **Depois:** 10 funções (dentro do limite de 12)
- **Redução:** 44% menos funções

## Otimizações Adicionais

### Arquivos Removidos
- Scripts de teste: `test-*.js`, `test-*.html`
- Arquivos de desenvolvimento: `check-users.js`, `cookies.txt`
- Funções antigas consolidadas

### .vercelignore Atualizado
Adicionadas exclusões para:
- Scripts de desenvolvimento
- Arquivos de teste
- Arquivos de servidor não necessários para Vercel

### Frontend Atualizado
- Endpoints de API atualizados para usar as novas URLs consolidadas
- Mantida compatibilidade com funcionalidades existentes
- Testes de build bem-sucedidos

## Benefícios

1. **Conformidade com Vercel Hobby:** Agora dentro do limite de 12 funções
2. **Manutenibilidade:** Menos arquivos para manter
3. **Performance:** Menos cold starts
4. **Organização:** Lógica relacionada agrupada
5. **Escalabilidade:** Margem para adicionar 2 funções futuras

## Próximos Passos

1. Testar deploy no Vercel
2. Verificar funcionamento de todos os endpoints
3. Monitorar performance das funções consolidadas
4. Considerar cache para otimizar ainda mais

## Notas Técnicas

- Todas as funções consolidadas mantêm compatibilidade com URLs existentes
- Detecção de endpoints por análise de URL (`req.url`)
- Validação de métodos HTTP mantida
- Headers CORS configurados corretamente
- Autenticação JWT preservada onde necessária
