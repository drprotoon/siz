#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fixImportsInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  // Fix all relative imports that don't have .js extension
  let fixedContent = content.replace(
    /from\s+["'](\.[^"']*?)["']/g,
    (match, importPath) => {
      // Skip if already has extension or is not a relative import
      if (importPath.includes('.') && !importPath.endsWith('/')) {
        return match;
      }

      // Add .js extension
      return match.replace(importPath, importPath + '.js');
    }
  );

  // Fix import statements with relative paths
  fixedContent = fixedContent.replace(
    /import\s+[^"']*from\s+["'](\.[^"']*?)["']/g,
    (match, importPath) => {
      // Skip if already has extension or is not a relative import
      if (importPath.includes('.') && !importPath.endsWith('/')) {
        return match;
      }

      // Add .js extension
      return match.replace(importPath, importPath + '.js');
    }
  );

  // Fix local module imports (without ./ prefix but local files)
  fixedContent = fixedContent.replace(
    /from\s+["']([^"'./][^"']*?)["']/g,
    (match, importPath) => {
      // Skip node_modules packages (they usually have @ or are common package names)
      if (importPath.startsWith('@') ||
          importPath.includes('node_modules') ||
          ['express', 'fs', 'path', 'http', 'https', 'crypto', 'util', 'events', 'stream', 'vite', 'nanoid', 'bcrypt', 'cors', 'passport', 'passport-local', 'drizzle-orm', 'zod', 'axios', 'multer', 'uuid', 'memorystore', 'fast-xml-parser'].includes(importPath)) {
        return match;
      }

      // Skip if already has extension
      if (importPath.includes('.')) {
        return match;
      }

      // Check if this file exists in the same directory
      const currentDir = path.dirname(filePath);
      const possibleFile = path.join(currentDir, importPath + '.js');

      if (fs.existsSync(possibleFile)) {
        return match.replace(importPath, './' + importPath + '.js');
      }

      return match;
    }
  );

  // Fix import statements for local modules
  fixedContent = fixedContent.replace(
    /import\s+[^"']*from\s+["']([^"'./][^"']*?)["']/g,
    (match, importPath) => {
      // Skip node_modules packages
      if (importPath.startsWith('@') ||
          importPath.includes('node_modules') ||
          ['express', 'fs', 'path', 'http', 'https', 'crypto', 'util', 'events', 'stream', 'vite', 'nanoid', 'bcrypt', 'cors', 'passport', 'passport-local', 'drizzle-orm', 'zod', 'axios', 'multer', 'uuid', 'memorystore', 'fast-xml-parser'].includes(importPath)) {
        return match;
      }

      // Skip if already has extension
      if (importPath.includes('.')) {
        return match;
      }

      // Check if this file exists in the same directory
      const currentDir = path.dirname(filePath);
      const possibleFile = path.join(currentDir, importPath + '.js');

      if (fs.existsSync(possibleFile)) {
        return match.replace(importPath, './' + importPath + '.js');
      }

      return match;
    }
  );

  if (content !== fixedContent) {
    fs.writeFileSync(filePath, fixedContent, 'utf8');
    console.log(`Fixed imports in: ${filePath}`);
  }
}

function fixImportsInDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      fixImportsInDirectory(filePath);
    } else if (file.endsWith('.js')) {
      fixImportsInFile(filePath);
    }
  }
}

// Fix imports in the dist/server directory
const serverDir = path.join(__dirname, '..', 'dist', 'server');
if (fs.existsSync(serverDir)) {
  console.log('Fixing ES module imports...');
  fixImportsInDirectory(serverDir);
  console.log('Import fixing completed!');
} else {
  console.log('Server dist directory not found');
}
