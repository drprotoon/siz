/**
 * Script para forçar um novo deploy no Vercel
 * 
 * Este script atualiza o timestamp no arquivo vercel.json para forçar um novo deploy
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Configuração para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('Preparando para forçar um novo deploy no Vercel...');

// Caminho para o arquivo vercel.json
const vercelJsonPath = path.join(rootDir, 'vercel.json');

try {
  // Ler o arquivo vercel.json
  const vercelJson = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
  
  // Atualizar o timestamp
  vercelJson.deployTimestamp = new Date().toISOString();
  
  // Escrever o arquivo atualizado
  fs.writeFileSync(vercelJsonPath, JSON.stringify(vercelJson, null, 2));
  
  console.log('Arquivo vercel.json atualizado com sucesso!');
  
  // Verificar se estamos em um repositório Git
  try {
    // Adicionar o arquivo ao Git
    execSync('git add vercel.json', { stdio: 'inherit', cwd: rootDir });
    console.log('Arquivo adicionado ao Git');
    
    // Criar um commit
    execSync('git commit -m "chore: trigger Vercel deployment"', { stdio: 'inherit', cwd: rootDir });
    console.log('Commit criado com sucesso');
    
    // Fazer push para o repositório remoto
    execSync('git push', { stdio: 'inherit', cwd: rootDir });
    console.log('Push realizado com sucesso');
    
    console.log('✅ Deploy acionado com sucesso! Verifique o painel do Vercel para acompanhar o progresso.');
  } catch (gitError) {
    console.error('Erro ao executar comandos Git:', gitError.message);
    console.log('Você pode fazer o commit e push manualmente:');
    console.log('git add vercel.json');
    console.log('git commit -m "chore: trigger Vercel deployment"');
    console.log('git push');
  }
} catch (error) {
  console.error('Erro ao atualizar o arquivo vercel.json:', error.message);
}
