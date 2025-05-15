// Script para garantir que os arquivos necessários para o Vercel estejam presentes
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuração para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('Verificando arquivos necessários para o Vercel...');

// Diretórios
const distDir = path.join(rootDir, 'dist');
const distPublicDir = path.join(distDir, 'public');
const clientDir = path.join(rootDir, 'client');

// Garantir que o diretório dist/public existe
if (!fs.existsSync(distPublicDir)) {
  fs.mkdirSync(distPublicDir, { recursive: true });
  console.log(`Diretório criado: ${distPublicDir}`);
}

// Verificar se o arquivo index.html existe na pasta dist/public
const indexHtmlPath = path.join(distPublicDir, 'index.html');
if (!fs.existsSync(indexHtmlPath)) {
  console.log(`Arquivo index.html não encontrado em ${indexHtmlPath}`);
  
  // Verificar se o arquivo existe na pasta client
  const clientIndexHtmlPath = path.join(clientDir, 'index.html');
  if (fs.existsSync(clientIndexHtmlPath)) {
    console.log(`Encontrado index.html em ${clientIndexHtmlPath}`);
    
    // Copiar o arquivo para dist/public
    const indexHtmlContent = fs.readFileSync(clientIndexHtmlPath, 'utf8');
    
    // Modificar o conteúdo para apontar para os arquivos corretos
    const modifiedContent = indexHtmlContent
      .replace('<script type="module" src="/src/main.tsx"></script>', '<script type="module" src="/assets/main.js"></script>')
      .replace('<link rel="icon" href="/favicon.ico" />', '<link rel="icon" href="/favicon.ico" />');
    
    fs.writeFileSync(indexHtmlPath, modifiedContent);
    console.log(`Arquivo index.html copiado e modificado para ${indexHtmlPath}`);
  } else {
    console.log(`Arquivo index.html não encontrado em ${clientIndexHtmlPath}`);
    
    // Criar um arquivo index.html básico
    const basicIndexHtml = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
    <title>SIZ Cosméticos - Beleza e Cuidados Pessoais</title>
    <meta name="description" content="Loja de cosméticos e produtos de beleza premium. Encontre perfumes, maquiagem, skincare e muito mais." />
    <link rel="icon" href="/favicon.ico" />
    <link rel="stylesheet" href="/assets/index.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/main.js"></script>
  </body>
</html>`;
    
    fs.writeFileSync(indexHtmlPath, basicIndexHtml);
    console.log(`Arquivo index.html básico criado em ${indexHtmlPath}`);
  }
}

// Verificar se há arquivos CSS e JS na pasta dist/public/assets
const assetsDir = path.join(distPublicDir, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
  console.log(`Diretório criado: ${assetsDir}`);
}

// Verificar se há arquivos na pasta assets
const assetsFiles = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir) : [];
if (assetsFiles.length === 0) {
  console.log(`Nenhum arquivo encontrado em ${assetsDir}`);
  
  // Criar um arquivo CSS básico
  const basicCss = `/* Arquivo CSS básico */
body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  margin: 0;
  padding: 0;
  background-color: #f5f5f5;
}

#root {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}`;
  
  fs.writeFileSync(path.join(assetsDir, 'index.css'), basicCss);
  console.log(`Arquivo CSS básico criado em ${path.join(assetsDir, 'index.css')}`);
  
  // Criar um arquivo JS básico
  const basicJs = `// Arquivo JS básico
console.log('SIZ Cosméticos - Aplicação carregada');

// Criar um elemento para exibir uma mensagem
const root = document.getElementById('root');
if (root) {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.alignItems = 'center';
  container.style.justifyContent = 'center';
  container.style.height = '100vh';
  container.style.textAlign = 'center';
  container.style.padding = '20px';
  
  const title = document.createElement('h1');
  title.textContent = 'SIZ Cosméticos';
  title.style.color = '#333';
  title.style.marginBottom = '20px';
  
  const message = document.createElement('p');
  message.textContent = 'Estamos em manutenção. Voltaremos em breve!';
  message.style.fontSize = '18px';
  message.style.color = '#666';
  
  container.appendChild(title);
  container.appendChild(message);
  root.appendChild(container);
}`;
  
  fs.writeFileSync(path.join(assetsDir, 'main.js'), basicJs);
  console.log(`Arquivo JS básico criado em ${path.join(assetsDir, 'main.js')}`);
}

console.log('✅ Verificação de arquivos para o Vercel concluída');
