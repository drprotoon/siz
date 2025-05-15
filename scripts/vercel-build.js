/**
 * Script para ajudar no processo de build na Vercel
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('Iniciando build para Vercel...');

// Verifica se estamos no ambiente da Vercel
const isVercel = process.env.VERCEL === '1';
console.log(`Ambiente Vercel: ${isVercel ? 'Sim' : 'Não'}`);

// Executa o build
try {
  console.log('Executando build do frontend e backend...');
  execSync('npm run build', { stdio: 'inherit', cwd: rootDir });
  console.log('Build concluído com sucesso!');
} catch (error) {
  console.error('Erro durante o build:', error);
  process.exit(1);
}

// Verifica se os arquivos foram gerados corretamente
const distDir = path.join(rootDir, 'dist');
const publicDir = path.join(distDir, 'public');
const serverFile = path.join(distDir, 'index.js');

if (!fs.existsSync(publicDir)) {
  console.error(`Diretório ${publicDir} não foi criado!`);
  process.exit(1);
}

if (!fs.existsSync(serverFile)) {
  console.error(`Arquivo ${serverFile} não foi criado!`);
  process.exit(1);
}

console.log('Verificação de arquivos concluída com sucesso!');
console.log(`Diretório público: ${publicDir}`);
console.log(`Arquivo do servidor: ${serverFile}`);

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
