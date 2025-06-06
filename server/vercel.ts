/**
 * Arquivo especial para deploy na Vercel
 * Este arquivo é usado como ponto de entrada para o servidor na Vercel
 */

import express, { type Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes";

// Configuração para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cria o app Express
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware de debug para todas as requisições
app.use((req, res, next) => {
  console.log(`[VERCEL] ${req.method} ${req.url} - Headers:`, JSON.stringify(req.headers, null, 2));
  next();
});

// Função para servir arquivos estáticos (versão simplificada para Vercel)
function serveStatic(app: express.Express) {
  // Tenta diferentes caminhos possíveis para encontrar os arquivos estáticos
  const possiblePaths = [
    path.resolve(__dirname, "..", "dist", "public"),
    path.resolve(__dirname, "..", "public"),
    path.resolve(process.cwd(), "dist", "public"),
    path.resolve(process.cwd(), "public")
  ];

  // Encontra o primeiro caminho que existe
  let distPath = possiblePaths.find(p => fs.existsSync(p));

  if (!distPath) {
    console.warn("Nenhum diretório de arquivos estáticos encontrado. Usando o padrão.");
    distPath = path.resolve(process.cwd(), "dist", "public");
  }

  console.log(`Serving static files from: ${distPath}`);

  // Servir arquivos estáticos
  app.use(express.static(distPath));

  // Middleware para SPA - APENAS para rotas que NÃO são da API
  app.get("*", (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Se for uma rota da API, passa para o próximo middleware (que deve retornar 404)
    if (req.originalUrl && req.originalUrl.startsWith('/api')) {
      console.log(`API endpoint não encontrado: ${req.originalUrl}`);

      // Retornar mensagens específicas para diferentes endpoints
      if (req.originalUrl.includes('/api/users')) {
        return res.status(404).json({
          error: "Users endpoint not found"
        });
      } else if (req.originalUrl.includes('/api/auth/status')) {
        return res.status(404).json({
          error: "Auth status endpoint not found"
        });
      } else {
        return res.status(404).json({
          error: `API endpoint not found: ${req.originalUrl}`
        });
      }
    }

    // Se for um arquivo de asset, não serve o index.html
    const isAssetRequest = req.originalUrl.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/);
    if (isAssetRequest) {
      return res.status(404).send('Asset not found');
    }

    // Para rotas do cliente, serve o index.html
    const indexPath = path.resolve(distPath, "index.html");

    if (fs.existsSync(indexPath)) {
      console.log(`Serving index.html for client-side route: ${req.originalUrl || '/'}`);
      res.sendFile(indexPath);
    } else {
      console.warn(`Warning: index.html not found at ${indexPath}`);
      res.status(404).send('Not found: index.html is missing');
    }
  });
}

// Inicializa o servidor
async function startServer() {
  try {
    console.log('Starting server for Vercel...');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Vercel flag:', process.env.VERCEL);

    // Registra as rotas da API PRIMEIRO
    console.log('Registering API routes...');
    const server = await registerRoutes(app);
    console.log('API routes registered successfully');

    // Log das rotas registradas para debug
    console.log('Registered routes:');
    app._router.stack.forEach((middleware: any) => {
      if (middleware.route) {
        console.log(`  ${Object.keys(middleware.route.methods).join(', ').toUpperCase()} ${middleware.route.path}`);
      } else if (middleware.name === 'router') {
        middleware.handle.stack.forEach((handler: any) => {
          if (handler.route) {
            console.log(`  ${Object.keys(handler.route.methods).join(', ').toUpperCase()} ${handler.route.path}`);
          }
        });
      }
    });

    // Configura o servidor para servir arquivos estáticos DEPOIS das rotas da API
    serveStatic(app);

    // Middleware de tratamento de erros (deve ser o último)
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error(`Error: ${message}`);
      res.status(status).json({ message });
    });

    // Na Vercel, não precisamos iniciar o servidor explicitamente
    // A Vercel usa o handler do Express diretamente
    if (process.env.VERCEL !== '1') {
      const port = process.env.PORT || 5000;
      server.listen({
        port,
        host: "0.0.0.0",
        reusePort: true,
      }, () => {
        console.log(`Server running on port ${port}`);
      });
    }

    console.log('Server initialization completed');
    return app;
  } catch (error) {
    console.error('Failed to start server:', error);
    throw error;
  }
}

// Inicializa o servidor imediatamente para o Vercel
let serverInitialized = false;

async function initializeServer() {
  if (!serverInitialized) {
    console.log('Initializing server for Vercel deployment...');
    await startServer();
    serverInitialized = true;
    console.log('Server initialized successfully');
  }
}

// Inicializar o servidor se estivermos no Vercel ou em produção
if (process.env.VERCEL === '1' || process.env.NODE_ENV === 'production') {
  initializeServer().catch(error => {
    console.error('Failed to initialize server:', error);
  });
} else if (process.env.NODE_ENV !== 'test') {
  initializeServer().catch(error => {
    console.error('Failed to initialize server:', error);
  });
}

// Exporta o app Express diretamente para a Vercel
export default app;
