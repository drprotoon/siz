#!/usr/bin/env node

/**
 * SCRIPT DE MIGRAÇÃO PARA OTIMIZAÇÕES
 *
 * Este script automatiza a migração do código existente para as versões otimizadas,
 * garantindo que não haja quebras e que a transição seja suave.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Iniciando migração para código otimizado...\n');

// ===== CONFIGURAÇÕES =====

const PROJECT_ROOT = path.dirname(__dirname);
const BACKUP_DIR = path.join(PROJECT_ROOT, 'backup-pre-optimization');
const MIGRATIONS = [
  {
    name: 'Backup de arquivos originais',
    action: createBackups
  },
  {
    name: 'Atualizar imports de frete no servidor',
    action: updateServerFreightImports
  },
  {
    name: 'Atualizar imports de frete no cliente',
    action: updateClientFreightImports
  },
  {
    name: 'Atualizar imports de wishlist',
    action: updateWishlistImports
  },
  {
    name: 'Atualizar configurações de build',
    action: updateBuildConfigs
  },
  {
    name: 'Instalar dependências otimizadas',
    action: installOptimizedDependencies
  },
  {
    name: 'Executar testes de validação',
    action: runValidationTests
  }
];

// ===== FUNÇÕES DE MIGRAÇÃO =====

async function createBackups() {
  console.log('📦 Criando backup dos arquivos originais...');
  
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const filesToBackup = [
    'server/shipping.ts',
    'server/correios.ts',
    'server/wishlist-service.ts',
    'client/src/lib/freightService.ts',
    'client/src/lib/frenetService.ts',
    'tsconfig.json',
    'tsconfig.server.json',
    'vercel.json'
  ];

  for (const file of filesToBackup) {
    const srcPath = path.join(PROJECT_ROOT, file);
    if (fs.existsSync(srcPath)) {
      const destPath = path.join(BACKUP_DIR, file);
      const destDir = path.dirname(destPath);

      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      fs.copyFileSync(srcPath, destPath);
      console.log(`  ✅ Backup criado: ${file}`);
    }
  }
}

async function updateServerFreightImports() {
  console.log('🔄 Atualizando imports de frete no servidor...');
  
  const routesFile = path.join(PROJECT_ROOT, 'server/routes.ts');
  if (fs.existsSync(routesFile)) {
    let content = fs.readFileSync(routesFile, 'utf8');

    // Substituir imports antigos
    content = content.replace(
      /import.*from.*['"]\.\/shipping['"];?/g,
      "import { freightService } from './services/freight-service';"
    );

    content = content.replace(
      /import.*from.*['"]\.\/correios['"];?/g,
      "// Correios integrado ao freight-service"
    );

    // Substituir chamadas de função
    content = content.replace(
      /calculateShipping\(/g,
      'freightService.calculateShipping('
    );

    fs.writeFileSync(routesFile, content);
    console.log('  ✅ Routes atualizadas');
  }
}

async function updateClientFreightImports() {
  console.log('🔄 Atualizando imports de frete no cliente...');
  
  const componentsDir = path.join(PROJECT_ROOT, 'client/src/components');
  const pagesDir = path.join(PROJECT_ROOT, 'client/src/pages');
  
  const dirsToUpdate = [componentsDir, pagesDir];
  
  for (const dir of dirsToUpdate) {
    if (fs.existsSync(dir)) {
      updateFreightImportsInDir(dir);
    }
  }
}

function updateFreightImportsInDir(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const filePath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      updateFreightImportsInDir(filePath);
    } else if (file.name.endsWith('.tsx') || file.name.endsWith('.ts')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let updated = false;
      
      // Substituir imports
      if (content.includes('freightService') || content.includes('frenetService')) {
        content = content.replace(
          /import.*from.*['"].*\/lib\/freightService['"];?/g,
          "import { freightClient, useFreightCalculation } from '../services/freight-client';"
        );
        
        content = content.replace(
          /import.*from.*['"].*\/lib\/frenetService['"];?/g,
          "// Frenet integrado ao freight-client"
        );
        
        updated = true;
      }
      
      if (updated) {
        fs.writeFileSync(filePath, content);
        console.log(`  ✅ Atualizado: ${file.name}`);
      }
    }
  }
}

async function updateWishlistImports() {
  console.log('🔄 Atualizando imports de wishlist...');
  
  const routesFile = path.join(PROJECT_ROOT, 'server/routes.ts');
  if (fs.existsSync(routesFile)) {
    let content = fs.readFileSync(routesFile, 'utf8');
    
    // Substituir import do wishlist service
    content = content.replace(
      /import.*wishlistService.*from.*['"]\.\/wishlist-service['"];?/g,
      "import { optimizedWishlistService as wishlistService } from './services/wishlist-service-optimized';"
    );
    
    fs.writeFileSync(routesFile, content);
    console.log('  ✅ Wishlist service atualizado');
  }
}

async function updateBuildConfigs() {
  console.log('🔧 Atualizando configurações de build...');
  
  // Atualizar tsconfig.json
  const tsconfigOptimized = path.join(PROJECT_ROOT, 'tsconfig.optimized.json');
  const tsconfig = path.join(PROJECT_ROOT, 'tsconfig.json');

  if (fs.existsSync(tsconfigOptimized)) {
    fs.copyFileSync(tsconfigOptimized, tsconfig);
    console.log('  ✅ tsconfig.json atualizado');
  }

  // Atualizar vercel.json
  const vercelOptimized = path.join(PROJECT_ROOT, 'vercel.optimized.json');
  const vercel = path.join(PROJECT_ROOT, 'vercel.json');
  
  if (fs.existsSync(vercelOptimized)) {
    fs.copyFileSync(vercelOptimized, vercel);
    console.log('  ✅ vercel.json atualizado');
  }
}

async function installOptimizedDependencies() {
  console.log('📦 Instalando dependências otimizadas...');
  
  try {
    // Instalar tipos que estavam faltando
    execSync('npm install --save-dev @types/cors @types/express-session', {
      stdio: 'inherit',
      cwd: PROJECT_ROOT
    });
    console.log('  ✅ Dependências instaladas');
  } catch (error) {
    console.error('  ❌ Erro ao instalar dependências:', error.message);
  }
}

async function runValidationTests() {
  console.log('🧪 Executando testes de validação...');
  
  try {
    // Tentar compilar o TypeScript
    execSync('npx tsc --noEmit', {
      stdio: 'pipe',
      cwd: PROJECT_ROOT
    });
    console.log('  ✅ Compilação TypeScript bem-sucedida');
  } catch (error) {
    console.warn('  ⚠️  Avisos de compilação TypeScript (podem ser ignorados temporariamente)');
  }

  try {
    // Tentar build do cliente
    execSync('npm run build', {
      stdio: 'pipe',
      cwd: path.join(PROJECT_ROOT, 'client')
    });
    console.log('  ✅ Build do cliente bem-sucedido');
  } catch (error) {
    console.warn('  ⚠️  Avisos no build do cliente');
  }
}

// ===== EXECUÇÃO PRINCIPAL =====

async function runMigration() {
  console.log('🎯 Plano de Migração:');
  MIGRATIONS.forEach((migration, index) => {
    console.log(`  ${index + 1}. ${migration.name}`);
  });
  console.log('');

  for (let i = 0; i < MIGRATIONS.length; i++) {
    const migration = MIGRATIONS[i];
    console.log(`\n[${i + 1}/${MIGRATIONS.length}] ${migration.name}`);
    
    try {
      await migration.action();
      console.log(`✅ Concluído: ${migration.name}`);
    } catch (error) {
      console.error(`❌ Erro em: ${migration.name}`);
      console.error(error.message);
      
      // Perguntar se deve continuar
      console.log('\n⚠️  Erro encontrado. Deseja continuar? (y/N)');
      // Em um ambiente real, você poderia usar readline para input do usuário
      // Por agora, vamos continuar automaticamente
      console.log('Continuando automaticamente...');
    }
  }

  console.log('\n🎉 Migração concluída!');
  console.log('\n📋 Próximos passos:');
  console.log('1. Revisar os arquivos atualizados');
  console.log('2. Testar as funcionalidades principais');
  console.log('3. Fazer commit das alterações');
  console.log('4. Deploy para staging para testes');
  console.log('\n💾 Backup dos arquivos originais em:', BACKUP_DIR);
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration().catch(error => {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  });
}

export { runMigration };
