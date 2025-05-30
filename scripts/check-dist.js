// Script to check the structure of the dist directory
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuração para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Function to list files recursively
function listFilesRecursively(dir, basePath = '') {
  const files = fs.readdirSync(dir);
  let result = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    const relativePath = path.join(basePath, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      console.log(`Directory: ${relativePath}/`);
      result = result.concat(listFilesRecursively(filePath, relativePath));
    } else {
      console.log(`File: ${relativePath} (${stats.size} bytes)`);
      result.push(relativePath);
    }
  }

  return result;
}

// Check if dist directory exists
const distDir = path.join(rootDir, 'dist');
if (!fs.existsSync(distDir)) {
  console.error('Error: dist directory does not exist. Run the build first.');
  process.exit(1);
}

console.log('Checking dist directory structure...');
console.log('===================================');

// List all files in the dist directory
const files = listFilesRecursively(distDir);

console.log('===================================');
console.log(`Total files: ${files.length}`);

// Check for specific files
const publicDir = path.join(distDir, 'public');
const serverDir = path.join(distDir, 'server');
const indexHtml = path.join(publicDir, 'index.html');
const serverIndex = path.join(serverDir, 'index.js');

console.log('===================================');
console.log('Checking critical files:');
console.log(`public directory exists: ${fs.existsSync(publicDir)}`);
console.log(`server directory exists: ${fs.existsSync(serverDir)}`);
console.log(`index.html exists: ${fs.existsSync(indexHtml)}`);
console.log(`server/index.js exists: ${fs.existsSync(serverIndex)}`);

// Check index.html content
if (fs.existsSync(indexHtml)) {
  const content = fs.readFileSync(indexHtml, 'utf-8');
  console.log('===================================');
  console.log('index.html content:');
  console.log(content);
}

console.log('===================================');
console.log('Check complete!');
