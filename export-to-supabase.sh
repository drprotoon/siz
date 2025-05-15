#!/bin/bash

# Exit on error
set -e

# Configurações
DB_NAME="siz_cosmeticos"
DB_USER="postgres"
DB_PASSWORD="postgres"
DB_HOST="localhost"
DB_PORT="5433"  # Porta externa atualizada
DUMP_FILE="siz_cosmeticos_dump.sql"

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Exportando banco de dados PostgreSQL para Supabase...${NC}"

# Verificar se o PostgreSQL está rodando
echo -e "${YELLOW}Verificando se o PostgreSQL está rodando...${NC}"
if ! docker exec siz_cosmeticos_postgres pg_isready -h localhost -U postgres > /dev/null 2>&1; then
  echo -e "${RED}PostgreSQL não está rodando. Iniciando o container...${NC}"
  docker-compose up -d postgres

  # Aguardar o PostgreSQL iniciar
  echo -e "${YELLOW}Aguardando o PostgreSQL iniciar...${NC}"
  sleep 10

  if ! docker exec siz_cosmeticos_postgres pg_isready -h localhost -U postgres > /dev/null 2>&1; then
    echo -e "${RED}Falha ao iniciar o PostgreSQL. Verifique os logs do Docker.${NC}"
    exit 1
  fi
fi

# Criar dump do banco de dados
echo -e "${YELLOW}Criando dump do banco de dados...${NC}"
docker exec siz_cosmeticos_postgres pg_dump -U postgres -d $DB_NAME > $DUMP_FILE

# Verificar se o dump foi criado com sucesso
if [ ! -f "$DUMP_FILE" ]; then
  echo -e "${RED}Falha ao criar o dump do banco de dados.${NC}"
  exit 1
fi

echo -e "${GREEN}Dump do banco de dados criado com sucesso: $DUMP_FILE${NC}"
echo ""
echo -e "${YELLOW}Instruções para importar no Supabase:${NC}"
echo "1. Acesse o painel do Supabase (https://app.supabase.com)"
echo "2. Selecione seu projeto"
echo "3. Vá para 'Database' > 'SQL Editor'"
echo "4. Crie um novo banco de dados ou use um existente"
echo "5. Clique em 'New query' e cole o conteúdo do arquivo $DUMP_FILE"
echo "6. Execute a query para importar os dados"
echo ""
echo -e "${YELLOW}Alternativamente, você pode usar a CLI do Supabase:${NC}"
echo "1. Instale a CLI do Supabase: npm install -g supabase"
echo "2. Faça login: supabase login"
echo "3. Importe o dump: supabase db push -d $DUMP_FILE"
echo ""
echo -e "${GREEN}Processo concluído!${NC}"
