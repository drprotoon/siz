// Script para copiar o arquivo .env.production para .env durante o build
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuração para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Caminhos dos arquivos
const envProductionPath = path.join(rootDir, '.env.production');
const envPath = path.join(rootDir, '.env');
const distEnvPath = path.join(rootDir, 'dist', '.env');

// Verificar se o arquivo .env.production existe
if (!fs.existsSync(envProductionPath)) {
  console.log('Arquivo .env.production não encontrado. Criando arquivo .env com variáveis de ambiente do processo...');

  // Create a basic .env file with process.env variables
  const envContent = `
NODE_ENV=production
STORE_NAME=${process.env.STORE_NAME || 'SIZ COSMETICOS'}
VITE_API_URL=${process.env.VITE_API_URL || '/api'}
VITE_SUPABASE_URL=${process.env.VITE_SUPABASE_URL || 'https://wvknjjquuztcoszluuxu.supabase.co'}
VITE_SUPABASE_ANON_KEY=${process.env.VITE_SUPABASE_ANON_KEY || ''}
DISABLE_SECURE_COOKIE=true
TS_NODE_TRANSPILE_ONLY=true

# Configurações de sessão
SESSION_SECRET=${process.env.SESSION_SECRET || 'beauty-essence-secret'}

# Supabase Configuration
SUPABASE_URL=${process.env.SUPABASE_URL || 'https://wvknjjquuztcoszluuxu.supabase.co'}
SUPABASE_ANON_KEY=${process.env.SUPABASE_ANON_KEY || ''}
SUPABASE_SERVICE_ROLE_KEY=${process.env.SUPABASE_SERVICE_ROLE_KEY || ''}

# Database URL
DATABASE_URL=${process.env.DATABASE_URL || ''}
`;

  // Write the .env file
  fs.writeFileSync(envPath, envContent);
  console.log('Arquivo .env criado com variáveis de ambiente do processo.');

  // Also create a copy in dist/.env
  if (!fs.existsSync(path.dirname(distEnvPath))) {
    fs.mkdirSync(path.dirname(distEnvPath), { recursive: true });
  }
  fs.writeFileSync(distEnvPath, envContent);
  console.log('Arquivo dist/.env criado com variáveis de ambiente do processo.');

  // Skip the rest of the script
} else {
  // Copiar .env.production para .env
  try {
    console.log('Copiando .env.production para .env...');
    fs.copyFileSync(envProductionPath, envPath);
    console.log('Arquivo .env criado com sucesso!');
  } catch (error) {
    console.error('Erro ao copiar .env.production para .env:', error);
  }

  // Garantir que o diretório dist existe
  if (!fs.existsSync(path.dirname(distEnvPath))) {
    fs.mkdirSync(path.dirname(distEnvPath), { recursive: true });
  }

  // Copiar .env.production para dist/.env
  try {
    console.log('Copiando .env.production para dist/.env...');
    fs.copyFileSync(envProductionPath, distEnvPath);
    console.log('Arquivo dist/.env criado com sucesso!');
  } catch (error) {
    console.error('Erro ao copiar .env.production para dist/.env:', error);
  }

// Closing brace for the else block
}
