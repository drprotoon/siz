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

// Executa o script de debug
try {
  console.log('Executando script de debug...');
  execSync('node scripts/debug-vercel.js', { stdio: 'inherit', cwd: rootDir });
  console.log('Script de debug executado com sucesso!');
} catch (error) {
  console.error('Erro durante a execução do script de debug:', error);
  // Não falha o build se o script de debug falhar
}

// Copia o arquivo vercel.html para o diretório public se ele existir
const vercelHtmlSrc = path.join(rootDir, 'public', 'vercel.html');
const vercelHtmlDest = path.join(publicDir, 'vercel.html');
if (fs.existsSync(vercelHtmlSrc)) {
  try {
    fs.copyFileSync(vercelHtmlSrc, vercelHtmlDest);
    console.log(`Arquivo vercel.html copiado para ${vercelHtmlDest}`);
  } catch (error) {
    console.error('Erro ao copiar arquivo vercel.html:', error);
  }
}

console.log('Build para Vercel concluído com sucesso!');
