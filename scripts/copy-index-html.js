/**
 * Script para copiar o arquivo index.html para o diretório dist/public
 * Este script é executado após o build para garantir que o arquivo index.html
 * esteja disponível para o servidor em produção.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('Copiando index.html para o diretório dist/public...');

// Caminhos dos arquivos
const distDir = path.join(rootDir, 'dist');
const publicDir = path.join(distDir, 'public');
const clientIndexHtmlSrc = path.join(rootDir, 'client', 'index.html');
const clientIndexHtmlDest = path.join(publicDir, 'index.html');

// Verifica se o diretório dist/public existe
if (!fs.existsSync(publicDir)) {
  console.log(`Criando diretório ${publicDir}...`);
  fs.mkdirSync(publicDir, { recursive: true });
}

// Encontra arquivos de assets no diretório assets
function findAssetFiles() {
  const assetsDir = path.join(publicDir, 'assets');
  const result = {
    js: '/assets/index.js', // Fallback padrão para JS
    css: [] // Array para múltiplos arquivos CSS
  };

  if (!fs.existsSync(assetsDir)) {
    console.warn(`Diretório de assets não encontrado: ${assetsDir}`);
    return result;
  }

  try {
    // Lista todos os arquivos no diretório assets
    const files = fs.readdirSync(assetsDir);
    console.log('Arquivos encontrados no diretório assets:');
    files.forEach(file => console.log(`- ${file}`));

    // Procura por arquivos JavaScript que começam com "index."
    const indexJsFiles = files.filter(file => file.startsWith('index.') && file.endsWith('.js'));

    if (indexJsFiles.length > 0) {
      console.log(`Arquivo JavaScript principal encontrado: ${indexJsFiles[0]}`);
      result.js = `/assets/${indexJsFiles[0]}`;
    } else {
      // Se não encontrar um arquivo index.js, procura por qualquer arquivo JavaScript
      const jsFiles = files.filter(file => file.endsWith('.js'));

      if (jsFiles.length > 0) {
        console.log(`Arquivo JavaScript encontrado: ${jsFiles[0]}`);
        result.js = `/assets/${jsFiles[0]}`;
      } else {
        console.warn('Nenhum arquivo JavaScript encontrado no diretório assets');
      }
    }

    // Procura por arquivos CSS
    const cssFiles = files.filter(file => file.endsWith('.css'));

    if (cssFiles.length > 0) {
      console.log(`Arquivos CSS encontrados: ${cssFiles.join(', ')}`);
      result.css = cssFiles.map(file => `/assets/${file}`);
    } else {
      console.warn('Nenhum arquivo CSS encontrado no diretório assets');
    }

    return result;
  } catch (error) {
    console.error('Erro ao procurar arquivos de assets:', error);
    return result;
  }
}

// Verifica se o arquivo index.html existe no diretório client
if (fs.existsSync(clientIndexHtmlSrc)) {
  try {
    // Lê o conteúdo do arquivo index.html
    let indexHtmlContent = fs.readFileSync(clientIndexHtmlSrc, 'utf-8');

    // Encontra os arquivos de assets
    const assets = findAssetFiles();

    // Modifica o caminho do script para apontar para o arquivo correto em produção
    indexHtmlContent = indexHtmlContent.replace(
      'src="/src/main.tsx"',
      `src="${assets.js}"`
    );

    // Adiciona os arquivos CSS ao head
    if (assets.css.length > 0) {
      const cssLinks = assets.css.map(cssPath =>
        `<link rel="stylesheet" href="${cssPath}" />`
      ).join('\n    ');

      // Adiciona os links CSS antes do fechamento da tag head
      indexHtmlContent = indexHtmlContent.replace(
        '</head>',
        `    ${cssLinks}\n  </head>`
      );
    }

    // Escreve o arquivo modificado
    fs.writeFileSync(clientIndexHtmlDest, indexHtmlContent);
    console.log(`Arquivo index.html copiado e modificado para ${clientIndexHtmlDest}`);
  } catch (error) {
    console.error('Erro ao copiar arquivo index.html:', error);
  }
} else {
  console.error(`Arquivo index.html não encontrado em ${clientIndexHtmlSrc}`);

  // Encontra os arquivos de assets
  const assets = findAssetFiles();

  // Cria os links CSS
  const cssLinks = assets.css.map(cssPath =>
    `<link rel="stylesheet" href="${cssPath}" />`
  ).join('\n    ');

  // Cria um arquivo index.html básico se não existir
  const basicIndexHtml = `<!DOCTYPE html>
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
    <script type="module" src="${assets.js}"></script>
  </body>
</html>`;

  fs.writeFileSync(clientIndexHtmlDest, basicIndexHtml);
  console.log(`Arquivo index.html básico criado em ${clientIndexHtmlDest}`);
}

console.log('Processo de cópia concluído com sucesso!');
