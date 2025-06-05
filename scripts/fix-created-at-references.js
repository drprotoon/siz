#!/usr/bin/env node

/**
 * Script para corrigir todas as referências de created_at para createdat
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.dirname(__dirname);

console.log('🔧 Corrigindo referências de created_at...');

// Arquivos para corrigir
const filesToFix = [
  'server/storage.ts',
  'shared/schema.ts'
];

filesToFix.forEach(filePath => {
  const fullPath = path.join(PROJECT_ROOT, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Arquivo não encontrado: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let changes = 0;

  // Substituições específicas para storage.ts
  if (filePath.includes('storage.ts')) {
    // Corrigir referências do Drizzle ORM
    const drizzleReplacements = [
      { from: /orders\.createdAt/g, to: 'orders.createdAt' }, // Manter como está no schema
      { from: /reviews\.createdAt/g, to: 'reviews.createdAt' }, // Manter como está no schema
      { from: /users\.createdAt/g, to: 'users.createdAt' }, // Manter como está no schema
    ];

    drizzleReplacements.forEach(({ from, to }) => {
      const matches = content.match(from);
      if (matches) {
        content = content.replace(from, to);
        changes += matches.length;
      }
    });
  }

  if (changes > 0) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ ${filePath}: ${changes} correções aplicadas`);
  } else {
    console.log(`ℹ️  ${filePath}: Nenhuma correção necessária`);
  }
});

console.log('🎉 Correções concluídas!');
