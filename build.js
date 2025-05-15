/**
 * Simple build script for Vercel deployment
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting Vercel build process...');

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Create dist/public directory if it doesn't exist
const publicDir = path.join(distDir, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

try {
  // Build the frontend
  console.log('Building frontend...');
  execSync('npx vite build', { stdio: 'inherit' });
  console.log('Frontend build completed successfully.');

  // Build the backend
  console.log('Building backend...');
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { stdio: 'inherit' });
  console.log('Backend build completed successfully.');

  // Create a simple index.html if it doesn't exist
  const indexHtmlPath = path.join(publicDir, 'index.html');
  if (!fs.existsSync(indexHtmlPath)) {
    console.log('Creating fallback index.html...');
    const indexHtml = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
    <title>SIZ Cosméticos - Beleza e Cuidados Pessoais</title>
    <meta name="description" content="Loja de cosméticos e produtos de beleza premium." />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/index.js"></script>
  </body>
</html>`;
    fs.writeFileSync(indexHtmlPath, indexHtml);
    console.log('Fallback index.html created successfully.');
  }

  console.log('Build process completed successfully!');
} catch (error) {
  console.error('Build process failed:', error);
  process.exit(1);
}
