# Guia de Autenticação em Produção

Este documento explica as diferenças entre autenticação em desenvolvimento e produção, e como resolver problemas comuns.

## 🔍 Principais Diferenças

### 1. Configuração de Cookies
- **Development**: `secure: false`, `sameSite: 'lax'`
- **Production**: `secure: true`, `sameSite: 'none'`

### 2. SSL/TLS
- **Development**: Sem SSL no banco de dados
- **Production**: SSL habilitado com `rejectUnauthorized: false`

### 3. Rate Limiting
- **Development**: 50 tentativas de login por 15 minutos
- **Production**: 5 tentativas de login por 15 minutos

## 🛠️ Configuração no Vercel

### Variáveis de Ambiente Obrigatórias

```bash
# Banco de dados
DATABASE_URL=postgresql://user:pass@host:port/db

# Autenticação
SESSION_SECRET=seu-session-secret-super-seguro
JWT_SECRET=seu-jwt-secret-super-seguro

# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role

# AbacatePay (PIX)
ABACATEPAY_API_KEY=abacate_live_xxxxxxxx
ABACATEPAY_WEBHOOK_SECRET=seu-webhook-secret
WEBHOOK_BASE_URL=https://seu-site.vercel.app

# Configurações de produção
NODE_ENV=production
DISABLE_SECURE_COOKIE=false
ABACATEPAY_API_URL=https://api.abacatepay.com
```

### Script de Configuração

Execute o script para configurar automaticamente:

```bash
chmod +x scripts/setup-vercel-env.sh
./scripts/setup-vercel-env.sh
```

## 🐛 Problemas Comuns e Soluções

### 1. Cookies não funcionam em produção

**Problema**: Usuário não consegue fazer login ou perde a sessão.

**Causa**: Configuração incorreta de cookies para HTTPS.

**Solução**:
```bash
# Verificar se está configurado corretamente
vercel env ls

# Configurar se necessário
vercel env add DISABLE_SECURE_COOKIE production
# Digite: false
```

### 2. CORS errors

**Problema**: Erro de CORS ao fazer requests da API.

**Causa**: Domínio não está na lista de origens permitidas.

**Solução**:
1. Verificar se `WEBHOOK_BASE_URL` está correto
2. Adicionar domínio personalizado se necessário:
```bash
vercel env add FRONTEND_URL production
# Digite: https://seu-dominio-personalizado.com
```

### 3. Banco de dados não conecta

**Problema**: Erro de conexão SSL com o banco.

**Causa**: Configuração SSL incorreta.

**Solução**:
1. Verificar se `DATABASE_URL` está correto
2. Verificar se o banco permite conexões SSL
3. Para Neon/Supabase, usar `?sslmode=require` na URL

### 4. Rate limiting muito restritivo

**Problema**: Muitos erros 429 (Too Many Requests).

**Causa**: Rate limiting de produção é mais restritivo.

**Solução**:
- Implementar retry logic no frontend
- Considerar aumentar limites se necessário
- Usar autenticação JWT para reduzir requests

### 5. Sessões não persistem

**Problema**: Usuário é deslogado constantemente.

**Causa**: Configuração de sessão incompatível com Vercel.

**Solução**:
1. Verificar se `SESSION_SECRET` está configurado
2. Considerar usar JWT em vez de sessões:
```typescript
// Use JWT authentication
const token = localStorage.getItem('authToken');
fetch('/api/protected', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## 🔧 Debugging

### Logs do Vercel

```bash
# Ver logs em tempo real
vercel logs --follow

# Ver logs de uma função específica
vercel logs --follow --since=1h
```

### Verificar configuração

```bash
# Listar todas as variáveis de ambiente
vercel env ls

# Verificar uma variável específica
vercel env get DATABASE_URL production
```

### Testar localmente com configuração de produção

```bash
# Baixar variáveis de ambiente do Vercel
vercel env pull .env.production

# Executar com configuração de produção
NODE_ENV=production npm run dev
```

## 📝 Checklist de Deploy

- [ ] Todas as variáveis de ambiente configuradas
- [ ] `DATABASE_URL` testada e funcionando
- [ ] SSL configurado no banco de dados
- [ ] `WEBHOOK_BASE_URL` aponta para o domínio correto
- [ ] Secrets de autenticação são únicos e seguros
- [ ] CORS configurado para o domínio correto
- [ ] Rate limiting apropriado para o uso esperado
- [ ] Logs monitorados após deploy

## 🚀 Deploy

```bash
# Deploy para produção
vercel --prod

# Verificar status
vercel ls

# Ver logs
vercel logs --follow
```

## 📞 Suporte

Se ainda tiver problemas:

1. Verificar logs do Vercel
2. Testar endpoints individualmente
3. Verificar configuração de rede/firewall
4. Consultar documentação do provedor de banco
5. Verificar status dos serviços externos (Supabase, AbacatePay)
