/**
 * Script para preparar o deploy para a Vercel
 * Este script copia os arquivos necessários e configura o ambiente
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Preparando deploy para Vercel...');

// Caminhos dos arquivos
const rootDir = path.resolve(__dirname, '..');
const vercelJsonPath = path.join(rootDir, 'vercel.json');
const envProductionPath = path.join(rootDir, '.env.production');
const envVercelPath = path.join(rootDir, '.env.vercel');

// Verifica se o arquivo vercel.json existe
if (!fs.existsSync(vercelJsonPath)) {
  console.error('Erro: arquivo vercel.json não encontrado');
  process.exit(1);
}

// Verifica se o arquivo .env.production existe
if (!fs.existsSync(envProductionPath)) {
  console.error('Erro: arquivo .env.production não encontrado');
  process.exit(1);
}

// Cria um arquivo .env para o deploy se não existir
if (!fs.existsSync(envVercelPath)) {
  console.log('Criando arquivo .env.vercel para o deploy...');

  const envContent = `NODE_ENV=production
STORE_NAME=SIZ COSMETICOS
# As variáveis abaixo devem ser configuradas no painel da Vercel
# DATABASE_URL=
# SUPABASE_URL=
# SUPABASE_ANON_KEY=
# SUPABASE_SERVICE_ROLE_KEY=
# SESSION_SECRET=
`;

  fs.writeFileSync(envVercelPath, envContent);
  console.log('Arquivo .env.vercel criado com sucesso');
}

console.log('Preparação concluída!');
console.log('\nInstruções para deploy na Vercel:');
console.log('1. Instale a CLI da Vercel: npm i -g vercel');
console.log('2. Execute: vercel');
console.log('3. Siga as instruções na tela');
console.log('4. Configure as variáveis de ambiente no painel da Vercel:');
console.log('   - DATABASE_URL');
console.log('   - SUPABASE_URL');
console.log('   - SUPABASE_ANON_KEY');
console.log('   - SUPABASE_SERVICE_ROLE_KEY');
console.log('   - SESSION_SECRET');
console.log('\nOu faça o deploy pelo GitHub conectando seu repositório à Vercel.');
