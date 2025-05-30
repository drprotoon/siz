// Script to test the server locally
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuração para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Check if dist directory exists
const distDir = path.join(rootDir, 'dist');
if (!fs.existsSync(distDir)) {
  console.error('Error: dist directory does not exist. Run the build first.');
  process.exit(1);
}

// Set environment variables
process.env.NODE_ENV = 'production';

// Start the server
console.log('Starting server in production mode...');
const serverProcess = exec('node dist/server/index.js', { cwd: rootDir });

serverProcess.stdout.on('data', (data) => {
  console.log(data);
});

serverProcess.stderr.on('data', (data) => {
  console.error(data);
});

// Keep the script running
console.log('Server started. Press Ctrl+C to stop.');
