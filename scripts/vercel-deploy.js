/**
 * Script para preparar o deploy para a Vercel
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('Preparando deploy para Vercel...');

// Verifica se estamos no ambiente da Vercel
const isVercel = process.env.VERCEL === '1';
console.log(`Ambiente Vercel: ${isVercel ? 'Sim' : 'Não'}`);

// Função para executar comandos com tratamento de erro
function runCommand(command, description) {
  try {
    console.log(`Executando ${description}...`);
    execSync(command, { stdio: 'inherit', cwd: rootDir });
    console.log(`✅ ${description} concluído com sucesso!`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao executar ${description}:`, error.message);
    return false;
  }
}

// Verifica se o diretório dist existe
const distDir = path.join(rootDir, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Verifica se o diretório dist/public existe
const publicDir = path.join(distDir, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Executa o build do frontend com Vite
runCommand('npx vite build', 'build do frontend');

// Executa o build do backend com esbuild
runCommand(
  'npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --external:./dist/public/* --external:./api/*',
  'build do backend'
);

// Copia o index.html
runCommand('node scripts/copy-index-html.js', 'cópia do index.html');

// Verifica os arquivos CSS
runCommand('node scripts/ensure-css.js', 'verificação de CSS');

// Verifica se o diretório api existe
const apiDir = path.join(rootDir, 'api');
if (!fs.existsSync(apiDir)) {
  console.log('Diretório api não encontrado, criando...');
  fs.mkdirSync(apiDir, { recursive: true });
}

// Cria um arquivo de verificação para debug
const verificationFile = path.join(publicDir, 'vercel-build-info.json');
fs.writeFileSync(
  verificationFile,
  JSON.stringify(
    {
      buildTime: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      isVercel,
    },
    null,
    2
  )
);

console.log('Build para Vercel concluído com sucesso!');
