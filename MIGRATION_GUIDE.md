# Guia de Migrações do Banco de Dados

## Problema Identificado

As tabelas `users` e `addresses` (e outras) funcionam em desenvolvimento mas não são encontradas no deploy em produção. Isso acontece porque as migrações não estavam sendo executadas automaticamente no ambiente de produção.

## Solução Implementada

### 1. Migrações Automáticas

O sistema agora executa migrações essenciais automaticamente na inicialização do servidor em produção:

- **Arquivo modificado**: `server/db.ts`
- **Função**: `runEssentialMigrations()`
- **Tabelas criadas automaticamente**:
  - `users`
  - `addresses`
  - `categories`
  - `products`
  - `orders`
  - `cart_items`

### 2. Execução Manual de Migrações

Se necessário, você pode executar as migrações manualmente:

#### Via Script Local
```bash
npm run db:migrate:essential
```

#### Via API (em produção)
```bash
curl -X POST https://siz-cosmetic-store-pro.vercel.app/api/migrate
```

### 3. Verificação do Status

Para verificar se as tabelas existem e estão funcionando:

#### Via API Debug
```bash
curl https://siz-cosmetic-store-pro.vercel.app/api/debug
```

Isso retornará informações sobre:
- Tabelas existentes
- Contagem de registros
- Status da conexão com o banco

## Como Funciona

### Desenvolvimento
1. Execute `npm run db:setup` para criar as tabelas
2. Execute `npm run db:seed` para popular com dados de teste

### Produção
1. As migrações são executadas automaticamente na inicialização
2. Se falhar, você pode usar o endpoint `/api/migrate`
3. Use `/api/debug` para verificar o status

## Arquivos Modificados

1. **`server/db.ts`**: Adicionada função de migração automática
2. **`server/vercel.ts`**: Executa migrações na inicialização
3. **`vercel.json`**: Inclui pasta `migrations/` no build
4. **`package.json`**: Novo script `db:migrate:essential`
5. **`api/debug.ts`**: Endpoint melhorado para debug
6. **`api/migrate.ts`**: Novo endpoint para migração manual

## Verificação Pós-Deploy

Após o próximo deploy, verifique:

1. **Status das tabelas**:
   ```
   GET https://siz-cosmetic-store-pro.vercel.app/api/debug
   ```

2. **Se necessário, execute migração manual**:
   ```
   POST https://siz-cosmetic-store-pro.vercel.app/api/migrate
   ```

3. **Teste uma rota que usa as tabelas**:
   ```
   GET https://siz-cosmetic-store-pro.vercel.app/api/users
   ```

## Logs para Monitoramento

O sistema agora loga:
- ✅ Quando as migrações são executadas com sucesso
- ❌ Quando há erros nas migrações
- 📊 Status das tabelas na inicialização

Verifique os logs do Vercel para acompanhar o processo.
