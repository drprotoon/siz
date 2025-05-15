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

// Função para servir arquivos estáticos
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

  // Adiciona middleware para lidar com rotas do cliente
  app.use("*", (req: express.Request, res: express.Response) => {
    // Ignora requisições de API (já tratadas pelas rotas)
    if (req.originalUrl && req.originalUrl.startsWith('/api')) {
      console.log(`API endpoint não encontrado: ${req.originalUrl}`);
      return res.status(404).json({
        message: "API endpoint not found",
        path: req.originalUrl,
        method: req.method
      });
    }

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
    // Registra as rotas da API
    const server = await registerRoutes(app);

    // Middleware de tratamento de erros
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error(`Error: ${message}`);
      res.status(status).json({ message });
    });

    // Configura o servidor para servir arquivos estáticos
    serveStatic(app);

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

    return app;
  } catch (error) {
    console.error('Failed to start server:', error);
    throw error;
  }
}

// Inicia o servidor se não estiver em ambiente de teste
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

// Exporta o handler para a Vercel
export default app;
