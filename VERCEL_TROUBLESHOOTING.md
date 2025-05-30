# Guia de Solução de Problemas - Vercel

## Problemas Identificados e Soluções

### 1. **Rotas da API não funcionando**

**Problema**: As rotas da API retornam 404 ou não respondem.

**Causas possíveis**:
- Configuração incorreta do `vercel.json`
- Variáveis de ambiente não configuradas
- Problemas no build das funções serverless

**Soluções**:

### 2. **Admin não consegue acessar dashboard após login (FORBIDDEN)**

**Problema**: Usuário admin faz login com sucesso, mas recebe erro 403 (Forbidden) ao tentar acessar o dashboard.

**Causa Principal**: O Vercel usa funções serverless que são stateless, ou seja, não mantêm sessões entre requisições. O sistema de autenticação baseado em sessões do Express não funciona no ambiente serverless.

**Soluções Implementadas**:

1. **Sistema de Autenticação JWT para Serverless**:
   - Criado endpoint `/api/auth/login-jwt` que funciona com tokens JWT
   - Criado endpoint `/api/auth/admin-check` para verificar privilégios de admin
   - Implementado armazenamento de tokens no localStorage do frontend

2. **Endpoints de Debug**:
   - `/api/auth/debug` - Informações detalhadas sobre autenticação
   - `/api/test` - Teste básico de funcionamento da API
   - `/api/env-check` - Verificação de variáveis de ambiente

3. **Componente de Teste**:
   - Criada página `/auth-test` para testar autenticação
   - Componente `AdminAuthTester` para debug em tempo real

### 3. **Como Resolver o Problema do Admin**

**Passos para testar e corrigir**:

1. **Acessar a página de teste**: Vá para `https://seu-site.vercel.app/auth-test`

2. **Testar login JWT**:
   - Use as credenciais: `admin` / `admin123`
   - Clique em "Test JWT Login"
   - Verifique se o login é bem-sucedido

3. **Testar verificação de admin**:
   - Após login bem-sucedido, clique em "Test Admin Check"
   - Deve retornar `isAdmin: true`

4. **Verificar informações de debug**:
   - Clique em "Test Debug Info" para ver detalhes do ambiente

5. **Configurar variáveis de ambiente no Vercel**:
   ```
   NODE_ENV=production
   SUPABASE_URL=https://wvknjjquuztcoszluuxu.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SESSION_SECRET=beauty-essence-secret
   DISABLE_SECURE_COOKIE=true
   ```

3. **Testar endpoints**:
   - `/api/test` - Endpoint de teste simples
   - `/api/env-check` - Verificação de variáveis de ambiente
   - `/api/health` - Health check da aplicação

### 2. **Problemas com Edge Functions**

**Problema**: Edge Functions não funcionam corretamente.

**Solução**:
- Verificar se o runtime está configurado como `nodejs18.x`
- Garantir que as dependências estão disponíveis no ambiente edge

### 3. **Problemas de CORS**

**Problema**: Requisições bloqueadas por CORS.

**Solução**:
- Verificar se os headers CORS estão configurados em todos os endpoints
- Configurar `Access-Control-Allow-Credentials: true` se necessário

### 4. **Problemas de Build**

**Problema**: Build falha no Vercel.

**Soluções**:
1. Verificar se todas as dependências estão listadas no `package.json`
2. Garantir que o comando de build está correto: `npm run vercel-build`
3. Verificar logs de build no dashboard do Vercel

## Comandos de Teste

### Testar localmente:
```bash
npm run dev
```

### Testar build:
```bash
npm run build
npm run preview
```

### Deploy para Vercel:
```bash
vercel --prod
```

## Endpoints de Teste

Após o deploy, teste os seguintes endpoints:

1. **Health Check**: `GET /api/health`
2. **Environment Check**: `GET /api/env-check`
3. **Test Endpoint**: `GET /api/test`
4. **Products**: `GET /api/products`

## Logs e Debug

Para verificar logs no Vercel:
1. Acesse o dashboard do Vercel
2. Vá para o projeto
3. Clique em "Functions"
4. Selecione a função que está falhando
5. Verifique os logs de execução

## Checklist de Deploy

- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Build executado com sucesso
- [ ] Endpoints de teste funcionando
- [ ] CORS configurado corretamente
- [ ] Logs sem erros críticos
- [ ] Frontend carregando corretamente
- [ ] API respondendo às requisições

## Contatos e Suporte

Se os problemas persistirem:
1. Verificar logs detalhados no Vercel
2. Testar endpoints individualmente
3. Verificar configuração do Supabase
4. Revisar configurações de rede e DNS
