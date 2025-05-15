/**
 * Script para testar a autenticação em modo de produção
 * Este script executa o build e inicia o servidor em modo de produção
 * com configurações específicas para testar a autenticação
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('Iniciando teste de autenticação em modo de produção...');

try {
  // Limpa o diretório dist
  console.log('Limpando diretório dist...');
  if (fs.existsSync(path.join(rootDir, 'dist'))) {
    fs.rmSync(path.join(rootDir, 'dist'), { recursive: true, force: true });
  }
  
  // Executa o build
  console.log('Executando build...');
  execSync('npm run build', { stdio: 'inherit', cwd: rootDir });
  
  // Copia o index.html
  console.log('Copiando index.html...');
  execSync('node scripts/copy-index-html.js', { stdio: 'inherit', cwd: rootDir });
  
  // Verifica os arquivos CSS
  console.log('Verificando arquivos CSS...');
  execSync('node scripts/ensure-css.js', { stdio: 'inherit', cwd: rootDir });
  
  // Inicia o servidor em modo de produção com cookies não seguros para testes locais
  console.log('\nIniciando servidor em modo de produção com cookies não seguros...');
  console.log('Acesse http://localhost:5000 para testar a aplicação');
  console.log('Pressione Ctrl+C para encerrar o servidor');
  
  // Define a variável de ambiente para desativar cookies seguros
  process.env.DISABLE_SECURE_COOKIE = 'true';
  
  execSync('NODE_ENV=production DISABLE_SECURE_COOKIE=true node dist/index.js', { 
    stdio: 'inherit', 
    cwd: rootDir,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      DISABLE_SECURE_COOKIE: 'true'
    }
  });
} catch (error) {
  console.error('Erro durante o teste de autenticação:', error);
  process.exit(1);
}
