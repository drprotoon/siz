import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: ['localhost', '.vercel.app'],
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // Em produção, os arquivos estáticos estão em dist/public
  let distPath;

  if (process.env.NODE_ENV === 'production') {
    // Definir o caminho para os arquivos estáticos em produção
    distPath = path.resolve(process.cwd(), "dist", "public");

    // Verificar se o diretório existe
    if (!fs.existsSync(distPath)) {
      console.warn(`Diretório de produção não encontrado: ${distPath}`);
      console.warn("Tentando caminhos alternativos...");

      // Tentar caminhos alternativos
      const possiblePaths = [
        path.resolve(import.meta.dirname, "..", "dist", "public"),
        path.resolve(import.meta.dirname, "..", "public"),
        path.resolve(process.cwd(), "public")
      ];

      // Encontrar o primeiro caminho que existe
      const foundPath = possiblePaths.find(p => fs.existsSync(p));

      if (foundPath) {
        console.warn(`Usando diretório alternativo: ${foundPath}`);
        distPath = foundPath;
      } else {
        console.error("ERRO CRÍTICO: Nenhum diretório de arquivos estáticos encontrado!");
        // Não falhar, apenas continuar e tentar servir o que for possível
      }
    }
  } else {
    // Em desenvolvimento, os arquivos estáticos estão em client
    distPath = path.resolve(import.meta.dirname, "..", "client");
  }

  console.log(`Serving static files from: ${distPath}`);

  // Verificar se o diretório existe antes de tentar servir arquivos estáticos
  if (fs.existsSync(distPath)) {
    // Servir arquivos estáticos com cache control
    app.use(express.static(distPath, {
      maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
      etag: true
    }));

    // Adiciona um middleware específico para servir arquivos de assets
    const assetsDir = path.join(distPath, 'assets');
    if (fs.existsSync(assetsDir)) {
      console.log(`Configurando middleware específico para assets em: ${assetsDir}`);
      app.use('/assets', express.static(assetsDir, {
        maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0,
        etag: true
      }));
    } else {
      console.warn(`Diretório de assets não encontrado: ${assetsDir}`);
    }
  }

  // Adiciona middleware para lidar com rotas do cliente (SPA)
  app.use("*", (req, res, next) => {
    // Ignora requisições de API
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }

    // Log para debug
    console.log(`Handling request for: ${req.originalUrl}`);

    // Não servir index.html para requisições de assets
    const isAssetRequest = req.originalUrl.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/);

    if (isAssetRequest) {
      // Determina o tipo de asset
      const isJsRequest = req.originalUrl.endsWith('.js');
      const isCssRequest = req.originalUrl.endsWith('.css');

      // Tenta encontrar o arquivo de asset diretamente
      let assetPath = path.join(distPath, req.originalUrl);

      // Se o caminho começa com /assets, tenta encontrar no diretório de assets
      if (req.originalUrl.startsWith('/assets/')) {
        const assetsDir = path.join(distPath, 'assets');
        const assetName = req.originalUrl.replace('/assets/', '');
        const alternativePath = path.join(assetsDir, assetName);

        if (fs.existsSync(alternativePath)) {
          console.log(`Serving asset from assets directory: ${alternativePath}`);
          return res.sendFile(alternativePath);
        }
      }

      if (fs.existsSync(assetPath)) {
        console.log(`Serving asset: ${assetPath}`);
        return res.sendFile(assetPath);
      }

      // Se não encontrar o arquivo, procura por arquivos similares
      if (req.originalUrl.includes('/assets/')) {
        const assetsDir = path.join(distPath, 'assets');
        if (fs.existsSync(assetsDir)) {
          try {
            const files = fs.readdirSync(assetsDir);
            console.log(`Available files in assets directory: ${files.join(', ')}`);

            const requestedFile = path.basename(req.originalUrl);
            const fileExt = path.extname(requestedFile);
            const baseNameWithoutHash = requestedFile.replace(/\.[a-f0-9]+\./, '.');

            // Procura por um arquivo com nome similar
            const similarFile = files.find(file =>
              file.endsWith(fileExt) &&
              (file.includes(path.basename(requestedFile, fileExt)) ||
               file.includes(baseNameWithoutHash))
            );

            if (similarFile) {
              const similarPath = path.join(assetsDir, similarFile);
              console.log(`Found similar asset: ${similarPath}`);
              return res.sendFile(similarPath);
            }

            // Para CSS e JS, tenta encontrar qualquer arquivo do mesmo tipo
            if (isJsRequest || isCssRequest) {
              const anyFileOfType = files.find(file => file.endsWith(fileExt));
              if (anyFileOfType) {
                const anyFilePath = path.join(assetsDir, anyFileOfType);
                console.log(`Found alternative ${fileExt} file: ${anyFilePath}`);
                return res.sendFile(anyFilePath);
              }
            }
          } catch (error) {
            console.error('Error searching for similar assets:', error);
          }
        }
      }

      // Se não encontrar o arquivo, retorna 404 para assets
      console.warn(`Asset not found: ${req.originalUrl}`);
      return res.status(404).send('Asset not found');
    }

    // Para rotas normais, serve o index.html
    let indexPath;

    if (process.env.NODE_ENV === 'production') {
      indexPath = path.resolve(distPath, "index.html");
    } else {
      indexPath = path.resolve(import.meta.dirname, "..", "client", "index.html");
    }

    // Verificar se o arquivo existe
    if (fs.existsSync(indexPath)) {
      console.log(`Serving index.html for client-side route: ${req.originalUrl}`);
      res.sendFile(indexPath);
    } else {
      console.warn(`Warning: index.html not found at ${indexPath}`);

      // Tenta encontrar o index.html em outros locais
      const possibleIndexPaths = [
        path.resolve(process.cwd(), "dist", "public", "index.html"),
        path.resolve(process.cwd(), "public", "index.html"),
        path.resolve(process.cwd(), "client", "index.html")
      ];

      for (const possiblePath of possibleIndexPaths) {
        if (fs.existsSync(possiblePath)) {
          console.log(`Found index.html at alternative location: ${possiblePath}`);
          return res.sendFile(possiblePath);
        }
      }

      res.status(404).send('Not found: index.html is missing. Please make sure the build process completed successfully.');
    }
  });
}
