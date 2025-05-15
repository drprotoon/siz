# Guia de Deploy para Vercel

Este guia explica como fazer o deploy da aplicação SIZ COSMETICOS na Vercel.

## Pré-requisitos

1. Conta na [Vercel](https://vercel.com)
2. Conta no [Supabase](https://supabase.com) (para banco de dados e armazenamento)
3. Git instalado na sua máquina
4. Node.js instalado na sua máquina (versão 18 ou superior)

## Arquivos Importantes para o Deploy

Antes de fazer o deploy, verifique se os seguintes arquivos estão configurados corretamente:

- `vercel.json`: Configuração principal para a Vercel
- `api/index.js`: Ponto de entrada para as funções serverless da Vercel
- `scripts/vercel-deploy.js`: Script de build para a Vercel
- `.env.vercel`: Variáveis de ambiente para o ambiente de produção na Vercel
- `.vercelignore`: Lista de arquivos e diretórios que não serão enviados para a Vercel

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

Você pode testar a API acessando o endpoint `/api/hello`, que deve retornar uma resposta JSON.

## Solução de Problemas

Se encontrar problemas durante o deploy:

1. **Erro de Runtime**: Verifique se o `vercel.json` está configurado com o runtime correto: `@vercel/node@3.0.0`.

2. **Problemas com o Build**: Verifique os logs de build na Vercel para identificar erros específicos.

3. **Arquivos Estáticos não Carregam**: Verifique se o script de build está gerando corretamente os arquivos no diretório `dist/public`.

4. **Problemas com Variáveis de Ambiente**: Certifique-se de que todas as variáveis de ambiente necessárias estão configuradas no painel da Vercel.

5. **Problemas com o Banco de Dados**: Verifique se o banco de dados está acessível a partir da Vercel e se a string de conexão está correta.

6. **Forçar Reconstrução**: Tente fazer o deploy novamente com a opção "Override" para forçar uma reconstrução completa.

## Estrutura do Projeto

- O frontend é construído com Vite e React.
- O backend é construído com Express e TypeScript.
- Os arquivos estáticos são servidos a partir do diretório `dist/public`.
- As rotas da API começam com `/api/`.
- As rotas do cliente são tratadas pelo React Router.

## Notas Adicionais

- A aplicação usa o Express.js para servir tanto a API quanto o frontend.
- O arquivo `api/index.js` é o ponto de entrada para as funções serverless da Vercel.
- O script `scripts/vercel-deploy.js` é responsável por construir a aplicação para a Vercel.
- O arquivo `.env.vercel` contém as variáveis de ambiente para o ambiente de produção na Vercel.
- O arquivo `.vercelignore` lista os arquivos e diretórios que não serão enviados para a Vercel.
