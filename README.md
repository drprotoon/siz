# CosmeticStorePro

Sistema de e-commerce para loja de cosméticos com funcionalidades completas de gerenciamento de produtos, categorias, clientes e pedidos.

## Tecnologias Utilizadas

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express
- **Banco de Dados**: PostgreSQL
- **ORM**: Drizzle ORM
- **Autenticação**: Passport.js, bcrypt
- **Outros**: Docker, Supabase (opcional)

## Requisitos

- Node.js 18+
- Docker e Docker Compose
- PostgreSQL (via Docker ou instalação local)

## Configuração do Ambiente

### 1. Clonar o repositório

```bash
git clone <url-do-repositorio>
cd CosmeticStorePro
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar o banco de dados PostgreSQL

#### Opção 1: Usando Docker (Recomendado)

```bash
# Iniciar o PostgreSQL com Docker
docker-compose up -d postgres

# Configurar o banco de dados
./setup-docker-postgres.sh
```

#### Opção 2: PostgreSQL local

Se você já tem o PostgreSQL instalado localmente, configure o arquivo `.env` com suas credenciais:

```
DATABASE_URL=postgres://<usuario>:<senha>@localhost:5432/siz_cosmeticos
```

**Nota**: A configuração Docker usa a porta 5433 para evitar conflitos com instalações locais do PostgreSQL:

```
DATABASE_URL=postgres://postgres:postgres@localhost:5433/siz_cosmeticos
```

E execute:

```bash
npm run db:setup
npm run db:seed
```

### 4. Atualizar categorias (opcional)

Se você deseja atualizar as categorias para incluir as novas categorias Feminino e Masculino:

```bash
# Atualizar categorias no banco de dados
node scripts/update-categories.js

# Criar pastas para as novas categorias no Supabase Storage
node scripts/create-new-category-folders.js
```

### 5. Iniciar a aplicação

```bash
npm run dev
```

A aplicação estará disponível em: http://localhost:3000

## Integração com Supabase

Para utilizar o Supabase como banco de dados em produção:

### 1. Criar uma conta no Supabase

Acesse [Supabase](https://supabase.com) e crie uma conta gratuita.

### 2. Criar um novo projeto

- Dê um nome ao seu projeto
- Defina uma senha segura para o banco de dados
- Escolha a região mais próxima de seus usuários

### 3. Exportar o banco de dados local para o Supabase

```bash
# Gerar um dump do banco de dados
./export-to-supabase.sh
```

Siga as instruções exibidas no terminal para importar o dump no Supabase.

### 4. Configurar a aplicação para usar o Supabase

Atualize o arquivo `.env` com a URL de conexão do Supabase:

```
DATABASE_URL=postgres://<usuario>:<senha>@<host>.supabase.co:5432/postgres
```

## Estrutura do Projeto

- `/client` - Frontend React
- `/server` - Backend Express
- `/shared` - Código compartilhado entre frontend e backend
- `/migrations` - Migrações do banco de dados
- `/scripts` - Scripts utilitários

## Usuários Padrão

- **Administrador**:
  - Usuário: admin
  - Senha: 123456

- **Cliente**:
  - Usuário: teste
  - Senha: 123456

## Funcionalidades

### Área Pública
- Catálogo de produtos
- Detalhes do produto
- Carrinho de compras
- Checkout
- Cadastro e login de usuários

### Área Administrativa
- Dashboard com estatísticas
- Gerenciamento de produtos
- Gerenciamento de categorias
- Gerenciamento de clientes
- Gerenciamento de pedidos

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para mais detalhes.
