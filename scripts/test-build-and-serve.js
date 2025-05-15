/**
 * Script para testar o build e servir a aplicação em modo de produção
 * Este script executa o build completo e inicia o servidor em modo de produção
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('Iniciando teste completo de build e servidor...');

// Função para listar arquivos em um diretório
function listFiles(dir, indent = '') {
  if (!fs.existsSync(dir)) {
    console.log(`${indent}Diretório não encontrado: ${dir}`);
    return;
  }
  
  const files = fs.readdirSync(dir);
  console.log(`${indent}${dir}:`);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      listFiles(filePath, `${indent}  `);
    } else {
      console.log(`${indent}  ${file} (${stats.size} bytes)`);
    }
  });
}

try {
  // Limpa o diretório dist
  console.log('Limpando diretório dist...');
  if (fs.existsSync(path.join(rootDir, 'dist'))) {
    fs.rmSync(path.join(rootDir, 'dist'), { recursive: true, force: true });
  }
  
  // Executa o build completo
  console.log('Executando build completo...');
  execSync('npm run build', { stdio: 'inherit', cwd: rootDir });
  
  // Verifica o conteúdo do arquivo index.html
  const indexHtmlPath = path.join(rootDir, 'dist', 'public', 'index.html');
  if (fs.existsSync(indexHtmlPath)) {
    console.log('\nConteúdo do arquivo index.html:');
    const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf-8');
    console.log(indexHtmlContent);
  } else {
    console.warn('Arquivo index.html não encontrado!');
  }
  
  // Lista os arquivos gerados
  console.log('\nArquivos gerados:');
  listFiles(path.join(rootDir, 'dist'));
  
  // Inicia o servidor em modo de produção
  console.log('\nIniciando servidor em modo de produção...');
  console.log('Acesse http://localhost:5000 para testar a aplicação');
  console.log('Pressione Ctrl+C para encerrar o servidor');
  execSync('NODE_ENV=production node dist/index.js', { stdio: 'inherit', cwd: rootDir });
} catch (error) {
  console.error('Erro durante o teste:', error);
  process.exit(1);
}
