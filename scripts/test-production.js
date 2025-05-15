/**
 * Script para testar o build de produção localmente
 * Este script executa o build e inicia o servidor em modo de produção
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('Iniciando teste de produção...');

try {
  // Executa o build
  console.log('Executando build...');
  execSync('npm run build', { stdio: 'inherit', cwd: rootDir });
  
  // Copia o index.html
  console.log('Copiando index.html...');
  execSync('node scripts/copy-index-html.js', { stdio: 'inherit', cwd: rootDir });
  
  // Inicia o servidor em modo de produção
  console.log('Iniciando servidor em modo de produção...');
  execSync('npm run start', { stdio: 'inherit', cwd: rootDir });
} catch (error) {
  console.error('Erro durante o teste de produção:', error);
  process.exit(1);
}
