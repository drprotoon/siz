/**
 * Script para garantir que os arquivos CSS sejam incluídos corretamente no build
 * Este script é executado após o build para verificar e corrigir problemas com CSS
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('Verificando arquivos CSS no build...');

// Caminhos dos arquivos
const distDir = path.join(rootDir, 'dist');
const publicDir = path.join(distDir, 'public');
const assetsDir = path.join(publicDir, 'assets');
const indexHtmlPath = path.join(publicDir, 'index.html');

// Verifica se o diretório assets existe
if (!fs.existsSync(assetsDir)) {
  console.warn(`Diretório de assets não encontrado: ${assetsDir}`);
  process.exit(1);
}

// Lista todos os arquivos no diretório assets
const files = fs.readdirSync(assetsDir);
console.log('Arquivos encontrados no diretório assets:');
files.forEach(file => console.log(`- ${file}`));

// Procura por arquivos CSS
const cssFiles = files.filter(file => file.endsWith('.css'));

if (cssFiles.length === 0) {
  console.warn('Nenhum arquivo CSS encontrado no diretório assets!');
  console.warn('Verificando se o CSS está embutido no JavaScript...');
  
  // Procura por arquivos JavaScript
  const jsFiles = files.filter(file => file.endsWith('.js'));
  
  if (jsFiles.length === 0) {
    console.error('Nenhum arquivo JavaScript encontrado no diretório assets!');
    process.exit(1);
  }
  
  // Verifica se o CSS está embutido no JavaScript
  const jsFilePath = path.join(assetsDir, jsFiles[0]);
  const jsContent = fs.readFileSync(jsFilePath, 'utf-8');
  
  if (jsContent.includes('styleSheet') || jsContent.includes('insertCSS') || jsContent.includes('injectStyle')) {
    console.log('CSS parece estar embutido no JavaScript. Isso é normal em alguns builds do Vite.');
  } else {
    console.warn('Não foi possível detectar CSS embutido no JavaScript.');
  }
} else {
  console.log(`Arquivos CSS encontrados: ${cssFiles.join(', ')}`);
  
  // Verifica se o index.html inclui os arquivos CSS
  if (fs.existsSync(indexHtmlPath)) {
    const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf-8');
    
    // Verifica se cada arquivo CSS está incluído no index.html
    let missingCssFiles = [];
    for (const cssFile of cssFiles) {
      if (!indexHtmlContent.includes(`/assets/${cssFile}`)) {
        missingCssFiles.push(cssFile);
      }
    }
    
    if (missingCssFiles.length > 0) {
      console.warn(`Arquivos CSS não incluídos no index.html: ${missingCssFiles.join(', ')}`);
      console.log('Atualizando index.html para incluir os arquivos CSS...');
      
      // Adiciona os arquivos CSS ao head
      let updatedHtmlContent = indexHtmlContent;
      const cssLinks = missingCssFiles.map(cssFile => 
        `<link rel="stylesheet" href="/assets/${cssFile}" />`
      ).join('\n    ');
      
      // Adiciona os links CSS antes do fechamento da tag head
      updatedHtmlContent = updatedHtmlContent.replace(
        '</head>',
        `    ${cssLinks}\n  </head>`
      );
      
      // Escreve o arquivo modificado
      fs.writeFileSync(indexHtmlPath, updatedHtmlContent);
      console.log('index.html atualizado com sucesso!');
    } else {
      console.log('Todos os arquivos CSS já estão incluídos no index.html.');
    }
  } else {
    console.warn(`Arquivo index.html não encontrado: ${indexHtmlPath}`);
  }
}

console.log('Verificação de CSS concluída!');
