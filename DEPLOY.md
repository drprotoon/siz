# Guia de Deploy para Vercel

Este guia explica como fazer o deploy da aplicação SIZ COSMETICOS na Vercel.

## Pré-requisitos

1. Conta na [Vercel](https://vercel.com)
2. Conta no [Supabase](https://supabase.com) (para banco de dados e armazenamento)
3. Git instalado na sua máquina
4. Node.js instalado na sua máquina

## Preparação

Antes de fazer o deploy, execute o script de preparação:

```bash
npm run prepare-deploy
```

Este script irá:
- Verificar se os arquivos necessários existem
- Criar um arquivo `.env.vercel` com as configurações básicas

## Configurações Importantes

### Configuração do Projeto na Vercel

Ao configurar o projeto na Vercel, certifique-se de:

1. **Framework Preset**: Selecione "Other" (não Node.js)
2. **Build Command**: Use `npm run vercel-build`
3. **Output Directory**: Deixe em branco (já está configurado no vercel.json)
4. **Install Command**: `npm install`

## Opção 1: Deploy via CLI da Vercel

1. Instale a CLI da Vercel:

```bash
npm install -g vercel
```

2. Faça login na sua conta Vercel:

```bash
vercel login
```

3. Execute o comando de deploy:

```bash
vercel
```

4. Siga as instruções na tela.

## Opção 2: Deploy via GitHub

1. Faça o push do seu código para um repositório GitHub.

2. Acesse o [Dashboard da Vercel](https://vercel.com/dashboard).

3. Clique em "New Project".

4. Importe o repositório do GitHub.

5. Configure as variáveis de ambiente (veja abaixo).

6. Clique em "Deploy".

## Variáveis de Ambiente

Configure as seguintes variáveis de ambiente no painel da Vercel:

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | URL de conexão com o banco de dados PostgreSQL do Supabase |
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_ANON_KEY` | Chave anônima do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço do Supabase |
| `SESSION_SECRET` | Chave secreta para sessões (gere uma string aleatória) |
| `NODE_ENV` | Deve ser configurada como `production` |
| `STORE_NAME` | Nome da loja (SIZ COSMETICOS) |

## Configuração do Banco de Dados

Certifique-se de que o banco de dados PostgreSQL no Supabase está configurado corretamente:

1. Crie um novo projeto no Supabase.
2. Obtenha a URL de conexão PostgreSQL.
3. Execute os scripts de migração:

```bash
# Localmente, com a URL do Supabase configurada em DATABASE_URL
npm run db:setup
npm run db:seed
```

## Configuração do Storage

1. No painel do Supabase, vá para "Storage".
2. Crie um bucket chamado `product-images`.
3. Configure as permissões do bucket para permitir acesso público às imagens.

## Verificação do Deploy

Após o deploy, verifique se:

1. A aplicação está funcionando corretamente.
2. A conexão com o banco de dados está funcionando.
3. As imagens estão sendo carregadas corretamente do Supabase Storage.

## Solução de Problemas

### Erro 404 após o deploy

Se você encontrar um erro 404 após o deploy, verifique:

1. **Configuração do vercel.json**: Certifique-se de que o arquivo `vercel.json` está configurado corretamente com as rotas e o diretório de saída.
2. **Logs de build**: Verifique os logs de build na Vercel para garantir que os arquivos estáticos foram gerados corretamente.
3. **Variáveis de ambiente**: Confirme se todas as variáveis de ambiente necessárias estão configuradas no painel da Vercel.
4. **Configurações do projeto**: Verifique se as configurações do projeto na Vercel estão corretas, especialmente o comando de build e o diretório de saída.

### Outros problemas comuns

Se encontrar outros problemas durante o deploy:

1. Verifique os logs de build e runtime na Vercel.
2. Confirme se todas as variáveis de ambiente estão configuradas corretamente.
3. Verifique se o banco de dados está acessível a partir da Vercel.
4. Certifique-se de que o Supabase Storage está configurado corretamente e acessível.

## Recursos Adicionais

- [Documentação da Vercel](https://vercel.com/docs)
- [Documentação do Supabase](https://supabase.com/docs)
