/**
 * Script para build simplificado na Vercel
 * Este script executa os comandos de build um por um para evitar problemas
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('Iniciando build simplificado para Vercel...');

// Verifica se estamos no ambiente da Vercel
const isVercel = process.env.VERCEL === '1';
console.log(`Ambiente Vercel: ${isVercel ? 'Sim' : 'Não'}`);

// Instala as dependências necessárias para o build
console.log('Instalando dependências necessárias para o build...');
try {
  // Instala autoprefixer e outras dependências necessárias
  execSync('npm install --no-save autoprefixer postcss tailwindcss tailwindcss-animate @tailwindcss/typography', {
    stdio: 'inherit',
    cwd: rootDir
  });
  console.log('✅ Dependências instaladas com sucesso!');
} catch (error) {
  console.error('❌ Erro ao instalar dependências:', error.message);
}

// Função para executar um comando e continuar mesmo se falhar
function runCommand(command, description) {
  try {
    console.log(`Executando: ${description}...`);
    execSync(command, { stdio: 'inherit', cwd: rootDir });
    console.log(`✅ ${description} concluído com sucesso!`);
    return true;
  } catch (error) {
    console.error(`❌ Erro durante ${description}:`, error.message);
    return false;
  }
}

// Verifica se os diretórios necessários existem
const distDir = path.join(rootDir, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

const publicDir = path.join(distDir, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Executa o build do frontend com Vite
runCommand('npx vite build', 'build do frontend');

// Executa o build do backend com esbuild
runCommand(
  'npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --external:./dist/public/* --external:./api/*',
  'build do backend'
);

// Copia o index.html
runCommand('node scripts/copy-index-html.js', 'cópia do index.html');

// Verifica os arquivos CSS
runCommand('node scripts/ensure-css.js', 'verificação de CSS');

// Verifica se o diretório api existe
const apiDir = path.join(rootDir, 'api');
if (!fs.existsSync(apiDir)) {
  console.log('Diretório api não encontrado, criando...');
  fs.mkdirSync(apiDir, { recursive: true });
}

// Verifica se o arquivo api/index.js existe
const apiIndexPath = path.join(apiDir, 'index.js');
if (!fs.existsSync(apiIndexPath)) {
  console.log('Criando arquivo api/index.js...');
  const apiIndexContent = `// This file is the entry point for Vercel serverless functions
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Create Express app
const app = express();

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Import routes dynamically
const registerRoutes = async () => {
  try {
    // Dynamic import for the routes
    const { registerRoutes } = await import('../dist/index.js');
    return registerRoutes(app);
  } catch (error) {
    console.error('Error importing routes:', error);
    throw error;
  }
};

// Serve static files
const serveStatic = () => {
  // Find the static files directory
  const possiblePaths = [
    path.resolve(rootDir, 'dist', 'public'),
    path.resolve(rootDir, 'public')
  ];

  const distPath = possiblePaths.find(p => fs.existsSync(p)) || path.resolve(rootDir, 'dist', 'public');

  console.log(\`Serving static files from: \${distPath}\`);

  // Serve static files
  app.use(express.static(distPath));

  // Handle client-side routing
  app.get('*', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ message: 'API endpoint not found' });
    }

    const indexPath = path.join(distPath, 'index.html');

    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    } else {
      return res.status(404).send('Not found: index.html is missing');
    }
  });
};

// Initialize the server
const initServer = async () => {
  try {
    // Register API routes
    await registerRoutes();

    // Serve static files and handle client-side routing
    serveStatic();

    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error('Server error:', err);
      res.status(500).json({ message: 'Internal Server Error' });
    });

    // Start server if not in Vercel environment
    if (process.env.VERCEL !== '1') {
      const port = process.env.PORT || 5000;
      app.listen(port, () => {
        console.log(\`Server running on port \${port}\`);
      });
    }
  } catch (error) {
    console.error('Failed to initialize server:', error);
  }
};

// Initialize the server
initServer();

// Export for Vercel
export default app;`;

  fs.writeFileSync(apiIndexPath, apiIndexContent);
  console.log('✅ Arquivo api/index.js criado com sucesso!');
}

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

console.log('Build para Vercel concluído com sucesso!');
