/**
 * Script para forçar um novo deploy no Vercel
 * 
 * Este script atualiza a versão no arquivo package.json para forçar um novo deploy
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

// Caminho para o arquivo package.json
const packageJsonPath = path.join(rootDir, 'package.json');

try {
  // Ler o arquivo package.json
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Obter a versão atual
  const currentVersion = packageJson.version;
  console.log(`Versão atual: ${currentVersion}`);
  
  // Incrementar a versão patch
  const versionParts = currentVersion.split('.');
  const newPatchVersion = parseInt(versionParts[2]) + 1;
  const newVersion = `${versionParts[0]}.${versionParts[1]}.${newPatchVersion}`;
  
  // Atualizar a versão
  packageJson.version = newVersion;
  
  // Escrever o arquivo atualizado
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  
  console.log(`Versão atualizada para: ${newVersion}`);
  
  // Verificar se estamos em um repositório Git
  try {
    // Adicionar o arquivo ao Git
    execSync('git add package.json', { stdio: 'inherit', cwd: rootDir });
    console.log('Arquivo adicionado ao Git');
    
    // Criar um commit
    execSync(`git commit -m "chore: bump version to ${newVersion} for deploy"`, { stdio: 'inherit', cwd: rootDir });
    console.log('Commit criado com sucesso');
    
    // Fazer push para o repositório remoto
    execSync('git push', { stdio: 'inherit', cwd: rootDir });
    console.log('Push realizado com sucesso');
    
    console.log('✅ Deploy acionado com sucesso! Verifique o painel do Vercel para acompanhar o progresso.');
  } catch (gitError) {
    console.error('Erro ao executar comandos Git:', gitError.message);
    console.log('Você pode fazer o commit e push manualmente:');
    console.log('git add package.json');
    console.log(`git commit -m "chore: bump version to ${newVersion} for deploy"`);
    console.log('git push');
  }
} catch (error) {
  console.error('Erro ao atualizar o arquivo package.json:', error.message);
}
