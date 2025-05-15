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

console.log('Iniciando processo de pós-build para Vercel...');

// Verifica se estamos no ambiente da Vercel
const isVercel = process.env.VERCEL === '1';
console.log(`Ambiente Vercel: ${isVercel ? 'Sim' : 'Não'}`);

// O build já foi executado pelo comando vercel-build no package.json
console.log('Executando tarefas de pós-build...');

// Executa o script para copiar o index.html
try {
  console.log('Copiando index.html para o diretório dist/public...');
  execSync('node scripts/copy-index-html.js', { stdio: 'inherit', cwd: rootDir });
} catch (error) {
  console.error('Erro ao copiar index.html:', error);
  // Não falhar o build se o script falhar
}

// Executa o script para garantir que os arquivos CSS estão incluídos
try {
  console.log('Verificando arquivos CSS...');
  execSync('node scripts/ensure-css.js', { stdio: 'inherit', cwd: rootDir });
} catch (error) {
  console.error('Erro ao verificar arquivos CSS:', error);
  // Não falhar o build se o script falhar
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

// Copia o arquivo index.html do cliente para o diretório public
const clientIndexHtmlSrc = path.join(rootDir, 'client', 'index.html');
const clientIndexHtmlDest = path.join(publicDir, 'index.html');

// Verifica se o arquivo index.html já existe no diretório public
if (!fs.existsSync(clientIndexHtmlDest) && fs.existsSync(clientIndexHtmlSrc)) {
  try {
    // Lê o conteúdo do arquivo index.html
    let indexHtmlContent = fs.readFileSync(clientIndexHtmlSrc, 'utf-8');

    // Modifica o caminho do script para apontar para o arquivo correto
    indexHtmlContent = indexHtmlContent.replace(
      'src="/src/main.tsx"',
      'src="/main.js"'
    );

    // Adiciona título e meta tags
    indexHtmlContent = indexHtmlContent.replace(
      '<head>',
      `<head>
    <title>SIZ Cosméticos - Beleza e Cuidados Pessoais</title>
    <meta name="description" content="Loja de cosméticos e produtos de beleza premium. Encontre perfumes, maquiagem, skincare e muito mais." />
    <link rel="icon" href="/favicon.ico" />`
    );

    // Escreve o arquivo modificado
    fs.writeFileSync(clientIndexHtmlDest, indexHtmlContent);
    console.log(`Arquivo index.html copiado e modificado para ${clientIndexHtmlDest}`);
  } catch (error) {
    console.error('Erro ao copiar arquivo index.html:', error);
  }
} else if (fs.existsSync(clientIndexHtmlDest)) {
  console.log(`Arquivo index.html já existe em ${clientIndexHtmlDest}`);
} else {
  console.error(`Arquivo index.html não encontrado em ${clientIndexHtmlSrc}`);

  // Cria um arquivo index.html básico se não existir
  const basicIndexHtml = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
    <title>SIZ Cosméticos - Beleza e Cuidados Pessoais</title>
    <meta name="description" content="Loja de cosméticos e produtos de beleza premium. Encontre perfumes, maquiagem, skincare e muito mais." />
    <link rel="icon" href="/favicon.ico" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/main.js"></script>
  </body>
</html>`;

  fs.writeFileSync(clientIndexHtmlDest, basicIndexHtml);
  console.log(`Arquivo index.html básico criado em ${clientIndexHtmlDest}`);
}

console.log('Build para Vercel concluído com sucesso!');
