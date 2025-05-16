/**
 * Script para build na Vercel
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('Iniciando processo de build para Vercel...');

// Função para executar comandos
function runCommand(command, description) {
  console.log(`Executando ${description}...`);
  try {
    execSync(command, { stdio: 'inherit', cwd: rootDir });
    console.log(`✅ ${description} concluído com sucesso`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao executar ${description}:`, error.message);
    return false;
  }
}

// Verificar se os diretórios necessários existem
const distDir = path.join(rootDir, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

const publicDir = path.join(distDir, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const apiDir = path.join(rootDir, 'api');
if (!fs.existsSync(apiDir)) {
  fs.mkdirSync(apiDir, { recursive: true });
}

// Build do frontend
runCommand('npx vite build', 'build do frontend');

// Build do backend
runCommand(
  'npx tsc -p tsconfig.server.json',
  'compilação do backend'
);

// Copiar o index.html
runCommand('node scripts/copy-index-html.js', 'cópia do index.html');

// Verificar os arquivos CSS
runCommand('node scripts/ensure-css.js', 'verificação de CSS');

console.log('Build para Vercel concluído com sucesso!');
