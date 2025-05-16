// Servidor Express unificado para Vercel
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cors from 'cors';

// Configuração para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

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

// Importar rotas dinamicamente
const registerRoutes = async () => {
  try {
    // Tentar importar as rotas do servidor original
    const { registerRoutes } = await import('../dist/server/server/routes.js');
    return registerRoutes(app);
  } catch (error) {
    console.error('Erro ao importar rotas originais:', error);
    
    // Fallback para rotas básicas
    app.get('/api/health', (req, res) => {
      res.json({
        status: 'ok',
        message: 'API está funcionando!',
        timestamp: new Date().toISOString()
      });
    });
    
    return app;
  }
};

// Servir arquivos estáticos
const serveStatic = () => {
  // Encontrar o diretório de arquivos estáticos
  const possiblePaths = [
    path.resolve(rootDir, 'dist', 'public'),
    path.resolve(rootDir, 'public')
  ];

  const distPath = possiblePaths.find(p => fs.existsSync(p)) || path.resolve(rootDir, 'dist', 'public');

  console.log(`Servindo arquivos estáticos de: ${distPath}`);

  // Servir arquivos estáticos
  app.use(express.static(distPath));

  // Lidar com rotas do cliente
  app.get('*', (req, res) => {
    // Ignorar rotas de API
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ message: 'API endpoint não encontrado' });
    }

    const indexPath = path.join(distPath, 'index.html');

    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    } else {
      return res.status(404).send('Não encontrado: index.html está faltando');
    }
  });
};

// Inicializar o servidor
const initServer = async () => {
  try {
    // Registrar rotas da API
    await registerRoutes();

    // Middleware de tratamento de erros
    app.use((err, req, res, next) => {
      console.error('Erro no servidor:', err);
      res.status(500).json({ message: 'Erro Interno do Servidor' });
    });

    // Servir arquivos estáticos e lidar com rotas do cliente
    serveStatic();

    // Iniciar servidor se não estiver no ambiente Vercel
    if (process.env.VERCEL !== '1') {
      const port = process.env.PORT || 5000;
      app.listen(port, () => {
        console.log(`Servidor rodando na porta ${port}`);
      });
    }
  } catch (error) {
    console.error('Falha ao inicializar servidor:', error);
  }
};

// Inicializar o servidor
initServer();

// Exportar para Vercel
export default app;
