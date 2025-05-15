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

console.log('Iniciando build para Vercel...');

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
const frontendSuccess = runCommand('npx vite build', 'build do frontend');

if (!frontendSuccess) {
  console.error('❌ Falha no build do frontend. Abortando.');
  process.exit(1);
}

// Cria um arquivo de verificação para debug
const verificationFile = path.join(publicDir, 'vercel-build-info.json');
fs.writeFileSync(
  verificationFile,
  JSON.stringify(
    {
      buildTime: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      isVercel,
      nodeVersion: process.version
    },
    null,
    2
  )
);

// Cria um arquivo HTML básico se não existir
const indexHtmlPath = path.join(publicDir, 'index.html');
if (!fs.existsSync(indexHtmlPath)) {
  console.log('Criando arquivo index.html básico...');

  // Encontra os arquivos CSS e JS
  const assetsDir = path.join(publicDir, 'assets');
  let cssFiles = [];
  let jsFiles = [];

  if (fs.existsSync(assetsDir)) {
    const files = fs.readdirSync(assetsDir);
    cssFiles = files.filter(file => file.endsWith('.css')).map(file => `/assets/${file}`);
    jsFiles = files.filter(file => file.endsWith('.js')).map(file => `/assets/${file}`);
  }

  // Cria os links CSS
  const cssLinks = cssFiles.map(cssPath =>
    `<link rel="stylesheet" href="${cssPath}" />`
  ).join('\n    ');

  // Cria os scripts JS
  const jsScripts = jsFiles.map(jsPath =>
    `<script type="module" src="${jsPath}"></script>`
  ).join('\n    ');

  // HTML básico
  const basicHtml = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
    <title>SIZ Cosméticos - Beleza e Cuidados Pessoais</title>
    <meta name="description" content="Loja de cosméticos e produtos de beleza premium. Encontre perfumes, maquiagem, skincare e muito mais." />
    <link rel="icon" href="/favicon.ico" />
    ${cssLinks}
  </head>
  <body>
    <div id="root"></div>
    ${jsScripts}
  </body>
</html>`;

  fs.writeFileSync(indexHtmlPath, basicHtml);
  console.log('✅ Arquivo index.html básico criado com sucesso!');
}

console.log('Build para Vercel concluído com sucesso!');
