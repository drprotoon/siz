// Script para compilar o servidor para produção
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuração para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Diretórios
const serverDir = path.join(rootDir, 'server');
const distDir = path.join(rootDir, 'dist');
const distServerDir = path.join(distDir, 'server');

// Garantir que o diretório dist/server existe
if (!fs.existsSync(distServerDir)) {
  fs.mkdirSync(distServerDir, { recursive: true });
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

// Função para corrigir imports em arquivos JS
function fixImports(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Corrigir imports relativos sem extensão
  content = content.replace(/from\s+["'](\.[^"']*?)["']/g, (match, importPath) => {
    // Se já tem extensão, não alterar
    if (importPath.endsWith('.js') || importPath.endsWith('.json')) {
      return match;
    }

    // Adicionar .js para imports relativos
    return match.replace(importPath, importPath + '.js');
  });

  // Corrigir imports dinâmicos
  content = content.replace(/import\s*\(\s*["'](\.[^"']*?)["']\s*\)/g, (match, importPath) => {
    if (importPath.endsWith('.js') || importPath.endsWith('.json')) {
      return match;
    }
    return match.replace(importPath, importPath + '.js');
  });

  // Corrigir imports do @shared para usar caminho relativo
  content = content.replace(/from\s+["']@shared\/([^"']*?)["']/g, (match, moduleName) => {
    // Determinar o caminho relativo baseado na localização do arquivo
    const relativePath = path.relative(path.dirname(filePath), path.join(distServerDir, 'shared'));
    const normalizedPath = relativePath.replace(/\\/g, '/');
    const finalPath = normalizedPath.startsWith('.') ? normalizedPath : './' + normalizedPath;
    return `from "${finalPath}/${moduleName}.js"`;
  });

  fs.writeFileSync(filePath, content, 'utf8');
}

// Função para corrigir todos os arquivos JS em um diretório
function fixAllImports(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(dir, file.name);

    if (file.isDirectory()) {
      fixAllImports(fullPath);
    } else if (file.name.endsWith('.js')) {
      console.log(`Corrigindo imports em: ${fullPath}`);
      fixImports(fullPath);
    }
  }
}

// Compilar o servidor com esbuild
console.log('Compilando o servidor para produção...');

// Corrigir imports nos arquivos compilados
console.log('Corrigindo imports nos arquivos compilados...');
fixAllImports(distServerDir);

console.log('✅ Compilação do servidor concluída com sucesso');
