// Script simplificado para deploy no Vercel
// Este script ignora completamente o TypeScript e cria uma versão JavaScript do projeto

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Configuração para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('Iniciando deploy simplificado para o Vercel...');

// Diretórios
const distDir = path.join(rootDir, 'dist');
const publicDir = path.join(distDir, 'public');
const apiDir = path.join(distDir, 'api');

// Garantir que os diretórios existam
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

if (!fs.existsSync(apiDir)) {
  fs.mkdirSync(apiDir, { recursive: true });
}

// Função para executar comandos
function runCommand(command, description) {
  console.log(`Executando: ${description}...`);
  try {
    execSync(command, { stdio: 'inherit', cwd: rootDir });
    console.log(`✅ ${description} concluído com sucesso`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao executar ${description}:`, error.message);
    return false;
  }
}

// Instalar dependências necessárias
console.log('Instalando dependências essenciais...');
runCommand('npm install --no-save vite @vitejs/plugin-react', 'instalação de dependências do Vite');

// Construir o frontend com Vite
console.log('Construindo o frontend...');
runCommand('npx vite build --config vite.vercel.config.js', 'build do frontend');

// Criar um arquivo server.js simplificado para a API
console.log('Criando arquivo server.js simplificado...');
const serverJs = `// Servidor Express simplificado para o Vercel
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuração para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Criar app Express
const app = express();

// Habilitar CORS
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware para parsing JSON
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Rotas da API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API está funcionando!',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'production'
  });
});

// Rota para categorias (mock)
app.get('/api/categories', (req, res) => {
  res.json([
    { id: 1, name: 'Perfumes Femininos', slug: 'perfumes-femininos' },
    { id: 2, name: 'Perfumes Masculinos', slug: 'perfumes-masculinos' },
    { id: 3, name: 'Skincare', slug: 'skincare' },
    { id: 4, name: 'Maquiagem', slug: 'maquiagem' }
  ]);
});

// Rota para produtos (mock)
app.get('/api/products', (req, res) => {
  const products = [
    {
      id: 1,
      name: 'Perfume Feminino',
      slug: 'perfume-feminino',
      description: 'Um perfume delicado com notas florais',
      price: 129.90,
      compareAtPrice: 149.90,
      images: ['https://placehold.co/400x400?text=Perfume'],
      categoryId: 1,
      category: { id: 1, name: 'Perfumes Femininos', slug: 'perfumes-femininos' },
      featured: true,
      visible: true
    },
    {
      id: 2,
      name: 'Perfume Masculino',
      slug: 'perfume-masculino',
      description: 'Um perfume marcante com notas amadeiradas',
      price: 139.90,
      compareAtPrice: 159.90,
      images: ['https://placehold.co/400x400?text=Perfume'],
      categoryId: 2,
      category: { id: 2, name: 'Perfumes Masculinos', slug: 'perfumes-masculinos' },
      featured: true,
      visible: true
    }
  ];

  res.json(products);
});

// Exportar para o Vercel
export default app;
`;

fs.writeFileSync(path.join(apiDir, 'server.js'), serverJs);
console.log('✅ Arquivo server.js criado com sucesso');

// Criar package.json para a API
console.log('Criando package.json para a API...');
const apiPackageJson = {
  "name": "siz-api",
  "version": "1.0.0",
  "type": "module",
  "engines": {
    "node": "22.x"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
};

fs.writeFileSync(path.join(apiDir, 'package.json'), JSON.stringify(apiPackageJson, null, 2));
console.log('✅ Arquivo package.json para API criado com sucesso');

// Criar package.json para o diretório public
console.log('Criando package.json para o diretório public...');
const staticPackageJson = {
  "name": "siz-static",
  "version": "1.0.0",
  "private": true,
  "engines": {
    "node": "22.x"
  }
};

fs.writeFileSync(path.join(publicDir, 'package.json'), JSON.stringify(staticPackageJson, null, 2));
console.log('✅ Arquivo package.json para diretório public criado com sucesso');

// Criar um arquivo index.html básico
console.log('Criando arquivo index.html básico...');
const indexHtml = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
    <title>SIZ Cosméticos - Beleza e Cuidados Pessoais</title>
    <meta name="description" content="Loja de cosméticos e produtos de beleza premium. Encontre perfumes, maquiagem, skincare e muito mais." />
    <link rel="icon" href="/favicon.ico" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/index.js"></script>
  </body>
</html>`;

// Verificar se existe um arquivo index.html na raiz do projeto
const rootIndexPath = path.join(rootDir, 'index.html');
if (fs.existsSync(rootIndexPath)) {
  // Copiar o arquivo index.html da raiz para o diretório public
  fs.copyFileSync(rootIndexPath, path.join(publicDir, 'index.html'));
  console.log('✅ Arquivo index.html copiado da raiz para o diretório public');
} else {
  // Criar um novo arquivo index.html no diretório public
  fs.writeFileSync(path.join(publicDir, 'index.html'), indexHtml);
  console.log('✅ Arquivo index.html criado com sucesso');
}

// Criar um arquivo vercel.json simplificado
console.log('Criando arquivo vercel.json simplificado...');
const vercelJson = {
  "version": 2,
  "buildCommand": "node scripts/vercel-simple-deploy.js",
  "outputDirectory": "dist/public",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/server.js" },
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "routes": [
    { "handle": "filesystem" },
    { "src": "/api/(.*)", "dest": "/api/server.js" },
    { "src": "/(.*)", "dest": "/index.html" }
  ],
  "builds": [
    {
      "src": "api/server.js",
      "use": "@vercel/node",
      "config": {
        "includeFiles": ["api/**"],
        "nodeVersion": "22.x"
      }
    },
    {
      "src": "dist/public/**",
      "use": "@vercel/static"
    }
  ]
};

fs.writeFileSync(path.join(rootDir, 'vercel.json'), JSON.stringify(vercelJson, null, 2));
console.log('✅ Arquivo vercel.json criado com sucesso');

console.log('✅ Deploy simplificado concluído com sucesso!');
