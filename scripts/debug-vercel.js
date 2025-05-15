/**
 * Script para ajudar a debugar problemas de deploy na Vercel
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('Iniciando debug para Vercel...');

// Verifica se estamos no ambiente da Vercel
const isVercel = process.env.VERCEL === '1';
console.log(`Ambiente Vercel: ${isVercel ? 'Sim' : 'Não'}`);

// Verifica a estrutura de diretórios
const distDir = path.join(rootDir, 'dist');
const publicDir = path.join(distDir, 'public');
const serverFile = path.join(distDir, 'index.js');

console.log('\n--- Verificando estrutura de diretórios ---');

// Verifica se o diretório dist existe
if (fs.existsSync(distDir)) {
  console.log(`✅ Diretório dist existe: ${distDir}`);
  
  // Lista os arquivos no diretório dist
  const distFiles = fs.readdirSync(distDir);
  console.log(`Arquivos em dist: ${distFiles.join(', ')}`);
} else {
  console.error(`❌ Diretório dist não existe: ${distDir}`);
}

// Verifica se o diretório public existe
if (fs.existsSync(publicDir)) {
  console.log(`✅ Diretório public existe: ${publicDir}`);
  
  // Lista os arquivos no diretório public
  const publicFiles = fs.readdirSync(publicDir);
  console.log(`Arquivos em public: ${publicFiles.length > 10 ? 
    publicFiles.slice(0, 10).join(', ') + ` e mais ${publicFiles.length - 10} arquivos` : 
    publicFiles.join(', ')}`);
  
  // Verifica se o arquivo index.html existe
  const indexHtmlPath = path.join(publicDir, 'index.html');
  if (fs.existsSync(indexHtmlPath)) {
    console.log(`✅ Arquivo index.html existe: ${indexHtmlPath}`);
  } else {
    console.error(`❌ Arquivo index.html não existe: ${indexHtmlPath}`);
  }
} else {
  console.error(`❌ Diretório public não existe: ${publicDir}`);
}

// Verifica se o arquivo do servidor existe
if (fs.existsSync(serverFile)) {
  console.log(`✅ Arquivo do servidor existe: ${serverFile}`);
} else {
  console.error(`❌ Arquivo do servidor não existe: ${serverFile}`);
}

// Verifica o arquivo vercel.json
const vercelJsonPath = path.join(rootDir, 'vercel.json');
if (fs.existsSync(vercelJsonPath)) {
  console.log(`✅ Arquivo vercel.json existe: ${vercelJsonPath}`);
  
  // Lê o conteúdo do arquivo vercel.json
  const vercelJson = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf-8'));
  console.log('Configuração do vercel.json:');
  console.log(JSON.stringify(vercelJson, null, 2));
} else {
  console.error(`❌ Arquivo vercel.json não existe: ${vercelJsonPath}`);
}

// Cria um arquivo de verificação para debug
if (fs.existsSync(publicDir)) {
  const verificationFile = path.join(publicDir, 'vercel-debug-info.json');
  fs.writeFileSync(
    verificationFile,
    JSON.stringify(
      {
        debugTime: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        isVercel,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        env: {
          NODE_ENV: process.env.NODE_ENV,
          VERCEL: process.env.VERCEL,
          VERCEL_ENV: process.env.VERCEL_ENV,
          VERCEL_URL: process.env.VERCEL_URL,
          VERCEL_REGION: process.env.VERCEL_REGION,
        }
      },
      null,
      2
    )
  );
  console.log(`✅ Arquivo de verificação criado: ${verificationFile}`);
}

console.log('\nDebug para Vercel concluído!');
