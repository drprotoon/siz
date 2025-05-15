# Guia de Deploy para Vercel

Este guia explica como fazer o deploy da aplicação SIZ COSMETICOS na Vercel.

## Pré-requisitos

1. Conta na [Vercel](https://vercel.com)
2. Conta no [Supabase](https://supabase.com) (para banco de dados e armazenamento)
3. Git instalado na sua máquina
4. Node.js instalado na sua máquina

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

4. Siga as instruções na tela. Quando solicitado:
   - **Framework Preset**: Selecione "Other" (não Node.js)
   - **Build Command**: Use `npm run vercel-build`
   - **Output Directory**: Deixe em branco (já está configurado no vercel.json)
   - **Install Command**: `npm install`

## Opção 2: Deploy via GitHub

1. Faça o push do seu código para um repositório GitHub.

2. Acesse o [Dashboard da Vercel](https://vercel.com/dashboard).

3. Clique em "New Project".

4. Importe o repositório do GitHub.

5. Configure as variáveis de ambiente (veja abaixo).

6. Configure o projeto:
   - **Framework Preset**: Selecione "Other" (não Node.js)
   - **Build Command**: Use `npm run vercel-build`
   - **Output Directory**: Deixe em branco (já está configurado no vercel.json)
   - **Install Command**: `npm install`

7. Clique em "Deploy".

## Variáveis de Ambiente

Configure as seguintes variáveis de ambiente no painel da Vercel:

- `NODE_ENV`: `production`
- `STORE_NAME`: `SIZ COSMETICOS`
- `DATABASE_URL`: URL de conexão com o banco de dados PostgreSQL
- `SUPABASE_URL`: URL do projeto Supabase
- `SUPABASE_ANON_KEY`: Chave anônima do Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Chave de serviço do Supabase
- `SESSION_SECRET`: Uma string aleatória para criptografar as sessões

## Verificação do Deploy

Após o deploy, acesse a URL fornecida pela Vercel para verificar se a aplicação está funcionando corretamente.

## Solução de Problemas

Se encontrar problemas durante o deploy:

1. Verifique os logs de build na Vercel para identificar erros.
2. Certifique-se de que todas as variáveis de ambiente estão configuradas corretamente.
3. Verifique se o banco de dados está acessível a partir da Vercel.
4. Tente fazer o deploy novamente com a opção "Override" para forçar uma reconstrução completa.

## Estrutura de Arquivos Importantes para o Deploy

- `vercel.json`: Configuração principal para a Vercel
- `api/index.js`: Ponto de entrada para as funções serverless da Vercel
- `scripts/vercel-deploy.js`: Script de build para a Vercel
- `.env.vercel`: Variáveis de ambiente para o ambiente de produção na Vercel

## Notas Adicionais

- A aplicação usa o Express.js para servir tanto a API quanto o frontend.
- O frontend é construído com Vite e React.
- O backend é construído com Express e TypeScript.
- Os arquivos estáticos são servidos a partir do diretório `dist/public`.
- As rotas da API começam com `/api/`.
- As rotas do cliente são tratadas pelo React Router.
