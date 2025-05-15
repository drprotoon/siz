// Script para compilar o servidor para produção
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuração para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Diretórios
const serverDir = path.join(rootDir, 'server');
const distDir = path.join(rootDir, 'dist');
const distServerDir = path.join(distDir, 'server');

// Garantir que o diretório dist/server existe
if (!fs.existsSync(distServerDir)) {
  fs.mkdirSync(distServerDir, { recursive: true });
}

// Função para executar comandos
function runCommand(command, description) {
  try {
    console.log(`Executando: ${description}...`);
    execSync(command, { stdio: 'inherit', cwd: rootDir });
    console.log(`✅ ${description} concluído com sucesso`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao executar ${description}:`, error.message);
    return false;
  }
}

// Compilar o servidor com esbuild
console.log('Compilando o servidor para produção...');

// Copiar o arquivo api/index.js para dist/api/index.js
const apiDir = path.join(distDir, 'api');
if (!fs.existsSync(apiDir)) {
  fs.mkdirSync(apiDir, { recursive: true });
}

// Copiar todos os arquivos da pasta api para dist/api
const apiSrcDir = path.join(rootDir, 'api');
if (fs.existsSync(apiSrcDir)) {
  const apiFiles = fs.readdirSync(apiSrcDir);
  for (const file of apiFiles) {
    const srcPath = path.join(apiSrcDir, file);
    const destPath = path.join(apiDir, file);
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copiado: ${srcPath} -> ${destPath}`);
  }
}

console.log('✅ Compilação do servidor concluída com sucesso');
