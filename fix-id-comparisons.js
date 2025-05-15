#!/usr/bin/env node

// Script para corrigir comparações de ID no arquivo routes.ts
const fs = require('fs');
const path = require('path');

// Caminho para o arquivo routes.ts
const routesFilePath = path.join(__dirname, 'server', 'routes.ts');

// Ler o conteúdo do arquivo
let content = fs.readFileSync(routesFilePath, 'utf8');

// Padrão para encontrar comparações de ID
const pattern = /if\s*\(\s*req\.user\.id\s*!==\s*userId\s*\)\s*\{/g;

// Substituir por comparações com parseInt
const replacement = 'if (req.user.id !== parseInt(userId)) {';

// Fazer a substituição
const newContent = content.replace(pattern, replacement);

// Escrever o arquivo de volta
fs.writeFileSync(routesFilePath, newContent, 'utf8');

console.log('Comparações de ID corrigidas em routes.ts');
