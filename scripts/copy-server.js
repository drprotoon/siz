// Script para copiar manualmente os arquivos do servidor para o diretório dist
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Configuração para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Diretórios
const serverDir = path.join(rootDir, 'server');
const distDir = path.join(rootDir, 'dist');
const distServerDir = path.join(distDir, 'server');
const sharedDir = path.join(rootDir, 'shared');
const distSharedDir = path.join(distDir, 'shared');

// Garantir que os diretórios existem
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

if (!fs.existsSync(distServerDir)) {
  fs.mkdirSync(distServerDir, { recursive: true });
}

if (!fs.existsSync(distSharedDir)) {
  fs.mkdirSync(distSharedDir, { recursive: true });
}

// Função para executar comandos
function runCommand(command, description) {
  try {
    console.log(`Executando: ${description}...`);
    execSync(command, { stdio: 'inherit', cwd: rootDir });
    console.log(`✅ ${description} concluído com sucesso`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao executar ${description}:`, error.message);
    return false;
  }
}

// Compilar o servidor com tsc
console.log('Compilando o servidor com tsc...');
runCommand('npx tsc -p tsconfig.server.json', 'Compilação do servidor com tsc');

// Verificar se os arquivos foram compilados
if (fs.existsSync(distServerDir)) {
  const serverFiles = fs.readdirSync(distServerDir);
  if (serverFiles.length > 0) {
    console.log(`Diretório dist/server contém ${serverFiles.length} arquivos:`);
    serverFiles.forEach(file => {
      console.log(`- ${file}`);
    });
  } else {
    console.warn('Aviso: Diretório dist/server está vazio!');
  }
} else {
  console.error('Erro: Diretório dist/server não existe!');
}

// Verificar se o arquivo index.js foi compilado corretamente
const indexJsPath = path.join(distServerDir, 'index.js');
if (!fs.existsSync(indexJsPath)) {
  console.warn('Aviso: Arquivo index.js não encontrado em dist/server!');
  console.log('Copiando manualmente os arquivos do servidor...');

  // Copiar todos os arquivos .ts do servidor para dist/server como .js
  const serverFiles = fs.readdirSync(serverDir);
  for (const file of serverFiles) {
    if (file.endsWith('.ts')) {
      const srcPath = path.join(serverDir, file);
      const destPath = path.join(distServerDir, file.replace('.ts', '.js'));

      // Ler o conteúdo do arquivo .ts
      let content = fs.readFileSync(srcPath, 'utf8');

      // Substituir importações
      content = content.replace(/from ["']\.\/([^"'\.]+)["']/g, 'from "./$1.js"');
      content = content.replace(/from ["']\.\.\/shared\/([^"'\.]+)["']/g, 'from "../shared/$1.js"');
      content = content.replace(/import\s*\{\s*([^}]+)\s*\}\s*from\s*["']@shared\/([^"'\.]+)["']/g, 'import { $1 } from "../shared/$2.js"');
      content = content.replace(/from ["']@shared\/([^"'\.]+)["']/g, 'from "../shared/$1.js"');
      content = content.replace(/from ["']\.\/([^"']+)\.ts["']/g, 'from "./$1.js"');
      content = content.replace(/from ["']\.\.\/shared\/([^"']+)\.ts["']/g, 'from "../shared/$1.js"');
      content = content.replace(/from ["']\.\/([^"']+)["']/g, 'from "./$1.js"');
      content = content.replace(/from ["']\.\/storage["']/g, 'from "./storage.js"');
      content = content.replace(/from ["']\.\/utils["']/g, 'from "./utils.js"');
      content = content.replace(/from ["']\.\/supabase["']/g, 'from "./supabase.js"');
      content = content.replace(/from ["']\.\/storage-service["']/g, 'from "./storage-service.js"');
      content = content.replace(/from ["']\.\/api-test["']/g, 'from "./api-test.js"');
      content = content.replace(/from ["']\.\/routes["']/g, 'from "./routes.js"');
      content = content.replace(/from ["']\.\/vite["']/g, 'from "./vite.js"');

      // Fix shared schema imports - this is critical for resolving @shared/schema
      content = content.replace(/from ["']@shared\/schema["']/g, 'from "../shared/schema.js"');
      content = content.replace(/from ["']@shared\/([^"']+)["']/g, 'from "../shared/$1.js"');

      // Remover tipos TypeScript
      content = content.replace(/import\s*.*,\s*\{\s*type\s+[^}]+\}\s*from\s*["'][^"']+["']/g, (match) => {
        return match.replace(/,\s*\{\s*type\s+[^}]+\}/, '');
      });
      content = content.replace(/\{\s*type\s+[^}]+\}\s*from\s*["'][^"']+["']/g, '');
      content = content.replace(/type\s+[A-Za-z]+\s*=\s*[^;]+;/g, '');
      content = content.replace(/:\s*[A-Za-z<>[\]|&]+/g, '');
      content = content.replace(/<[A-Za-z<>[\]|&,\s]+>/g, '');

      // Escrever o arquivo .js
      fs.writeFileSync(destPath, content);
      console.log(`Copiado e convertido: ${srcPath} -> ${destPath}`);
    }
  }

  // Copiar todos os arquivos .ts do shared para dist/shared como .js
  const sharedFiles = fs.readdirSync(sharedDir);
  for (const file of sharedFiles) {
    if (file.endsWith('.ts')) {
      const srcPath = path.join(sharedDir, file);
      const destPath = path.join(distSharedDir, file.replace('.ts', '.js'));

      // Ler o conteúdo do arquivo .ts
      let content = fs.readFileSync(srcPath, 'utf8');

      // Substituir importações
      content = content.replace(/from ["']\.\/([^"'\.]+)["']/g, 'from "./$1.js"');
      content = content.replace(/from ["']\.\/([^"']+)\.ts["']/g, 'from "./$1.js"');
      content = content.replace(/from ["']\.\/([^"']+)["']/g, 'from "./$1.js"');

      // Remover tipos TypeScript
      content = content.replace(/import\s*.*,\s*\{\s*type\s+[^}]+\}\s*from\s*["'][^"']+["']/g, (match) => {
        return match.replace(/,\s*\{\s*type\s+[^}]+\}/, '');
      });
      content = content.replace(/\{\s*type\s+[^}]+\}\s*from\s*["'][^"']+["']/g, '');
      content = content.replace(/type\s+[A-Za-z]+\s*=\s*[^;]+;/g, '');
      content = content.replace(/:\s*[A-Za-z<>[\]|&]+/g, '');
      content = content.replace(/<[A-Za-z<>[\]|&,\s]+>/g, '');

      // Escrever o arquivo .js
      fs.writeFileSync(destPath, content);
      console.log(`Copiado e convertido: ${srcPath} -> ${destPath}`);
    }
  }
}

console.log('✅ Cópia do servidor concluída com sucesso');
