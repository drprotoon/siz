#!/bin/bash

# Script para configurar as categorias no banco de dados

echo "Iniciando configuração das categorias..."

# Executar migração para adicionar novos campos à tabela de categorias
echo "Executando migração da tabela de categorias..."
node scripts/migrate-categories.js

# Aguardar um momento para garantir que a migração foi concluída
sleep 2

# Atualizar as categorias com a nova estrutura
echo "Atualizando categorias..."
node scripts/update-categories.js

echo "Configuração das categorias concluída com sucesso!"
