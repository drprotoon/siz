#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Função para corrigir imports em um arquivo
function fixImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Corrigir imports estáticos que não têm extensão .js
    content = content.replace(
      /import\s+([^'"]*)\s+from\s+['"](\.[^'"]*?)(?<!\.js)['"];?/g,
      (match, imports, path) => {
        // Não adicionar .js se já termina com .js ou se é um diretório
        if (path.endsWith('.js') || path.endsWith('/')) {
          return match;
        }
        modified = true;
        return `import ${imports} from '${path}.js';`;
      }
    );

    // Corrigir imports dinâmicos que não têm extensão .js
    content = content.replace(
      /import\(['"](\.[^'"]*?)(?<!\.js)['"]\)/g,
      (match, path) => {
        // Não adicionar .js se já termina com .js ou se é um diretório
        if (path.endsWith('.js') || path.endsWith('/')) {
          return match;
        }
        modified = true;
        return `import('${path}.js')`;
      }
    );

    // Corrigir imports de @shared para caminhos relativos
    content = content.replace(
      /from\s+['"]@shared\/([^'"]*?)['"];?/g,
      (match, modulePath) => {
        modified = true;
        return `from '../shared/${modulePath}.js';`;
      }
    );

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed imports in: ${filePath}`);
    }

    return modified;
  } catch (error) {
    console.error(`❌ Error fixing imports in ${filePath}:`, error.message);
    return false;
  }
}

// Função para percorrer diretórios recursivamente
function fixImportsInDirectory(dirPath) {
  try {
    const items = fs.readdirSync(dirPath);
    let totalFixed = 0;

    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        totalFixed += fixImportsInDirectory(itemPath);
      } else if (item.endsWith('.js')) {
        if (fixImportsInFile(itemPath)) {
          totalFixed++;
        }
      }
    }

    return totalFixed;
  } catch (error) {
    console.error(`❌ Error reading directory ${dirPath}:`, error.message);
    return 0;
  }
}

// Executar o script
console.log('🔧 Fixing ES module imports...');

const distServerPath = path.join(__dirname, '..', 'dist', 'server');

if (!fs.existsSync(distServerPath)) {
  console.error('❌ dist/server directory not found. Run build:server first.');
  process.exit(1);
}

const totalFixed = fixImportsInDirectory(distServerPath);

console.log(`\n✅ Fixed imports in ${totalFixed} files.`);
console.log('🚀 You can now run: npm start');
