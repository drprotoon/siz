// Script para preparar a API para o Vercel sem depender do TypeScript
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuração para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('Preparando API para o Vercel...');

// Diretórios
const apiDir = path.join(rootDir, 'api');
const distDir = path.join(rootDir, 'dist');
const distApiDir = path.join(distDir, 'api');

// Garantir que o diretório dist/api existe
if (!fs.existsSync(distApiDir)) {
  fs.mkdirSync(distApiDir, { recursive: true });
}

// Copiar todos os arquivos da pasta api para dist/api
if (fs.existsSync(apiDir)) {
  const apiFiles = fs.readdirSync(apiDir);
  for (const file of apiFiles) {
    const srcPath = path.join(apiDir, file);
    const destPath = path.join(distApiDir, file);
    
    if (fs.statSync(srcPath).isFile()) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copiado: ${srcPath} -> ${destPath}`);
    }
  }
}

// Criar um arquivo index.js simplificado que não depende de TypeScript
const simplifiedApiIndex = `// API handler for Vercel - Versão simplificada
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuração para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');

// Create Express app
const app = express();

// Enable CORS
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With', 'Accept', 'Accept-Version', 'Content-Length', 'Content-MD5', 'Date', 'X-Api-Version']
}));

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Rotas da API
app.get('/api/hello', (req, res) => {
  res.json({ 
    message: 'API está funcionando!', 
    timestamp: new Date().toISOString() 
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
  
  // Filtrar por categoria se especificado
  if (req.query.category) {
    return res.json(products.filter(p => p.category.slug === req.query.category));
  }
  
  // Filtrar por featured se especificado
  if (req.query.featured === 'true') {
    return res.json(products.filter(p => p.featured));
  }
  
  res.json(products);
});

// Rota para autenticação (mock)
app.get('/api/auth/me', (req, res) => {
  res.json({
    user: {
      id: 1,
      username: 'demo_user',
      email: 'demo@example.com',
      role: 'customer'
    }
  });
});

// Rota para carrinho (mock)
app.get('/api/cart', (req, res) => {
  res.json([]);
});

// Rota de teste
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API test endpoint is working!',
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method,
    vercel: process.env.VERCEL === '1' ? 'true' : 'false',
    nodeEnv: process.env.NODE_ENV || 'development'
  });
});

// Rota de fallback para endpoints não encontrados
app.all('*', (req, res) => {
  console.log(\`Requisição não tratada para \${req.method} \${req.path}\`);
  res.status(404).json({ 
    message: 'API endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Export the Express API
export default app;
`;

// Escrever o arquivo index.js simplificado
fs.writeFileSync(path.join(apiDir, 'index.js'), simplifiedApiIndex);
console.log('Arquivo api/index.js atualizado com versão simplificada');

// Copiar o arquivo index.js atualizado para dist/api
fs.copyFileSync(path.join(apiDir, 'index.js'), path.join(distApiDir, 'index.js'));
console.log('Arquivo api/index.js copiado para dist/api/index.js');

console.log('✅ API preparada para o Vercel com sucesso');
