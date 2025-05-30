/**
 * Comprehensive test script for the application
 * Tests build, start, and basic functionality
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🧪 Starting comprehensive application test...\n');

// Test configuration
const tests = {
  typeCheck: true,
  build: true,
  server: true,
  api: true
};

let testResults = {
  passed: 0,
  failed: 0,
  details: []
};

function logTest(name, success, details = '') {
  const status = success ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${name}`);
  if (details) console.log(`   ${details}`);
  
  testResults.details.push({ name, success, details });
  if (success) testResults.passed++;
  else testResults.failed++;
}

function runCommand(command, description, timeout = 30000) {
  try {
    console.log(`\n🔄 ${description}...`);
    execSync(command, { 
      stdio: 'inherit', 
      cwd: rootDir,
      timeout 
    });
    return true;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return false;
  }
}

async function testServer() {
  return new Promise((resolve) => {
    console.log('\n🔄 Testing server startup...');
    
    const server = spawn('npm', ['run', 'start'], {
      cwd: rootDir,
      stdio: 'pipe'
    });

    let serverReady = false;
    const timeout = setTimeout(() => {
      if (!serverReady) {
        server.kill();
        resolve(false);
      }
    }, 10000);

    server.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('serving on port 5000')) {
        serverReady = true;
        clearTimeout(timeout);
        server.kill();
        resolve(true);
      }
    });

    server.stderr.on('data', (data) => {
      console.error(`Server error: ${data}`);
    });

    server.on('close', (code) => {
      clearTimeout(timeout);
      if (!serverReady) {
        resolve(false);
      }
    });
  });
}

async function testAPI() {
  return new Promise((resolve) => {
    console.log('\n🔄 Testing API endpoints...');
    
    const server = spawn('npm', ['run', 'start'], {
      cwd: rootDir,
      stdio: 'pipe'
    });

    let serverReady = false;
    const timeout = setTimeout(() => {
      if (!serverReady) {
        server.kill();
        resolve(false);
      }
    }, 15000);

    server.stdout.on('data', async (data) => {
      const output = data.toString();
      if (output.includes('serving on port 5000') && !serverReady) {
        serverReady = true;
        
        try {
          // Test health endpoint
          const { default: fetch } = await import('node-fetch');
          const response = await fetch('http://localhost:5000/api/health');
          const success = response.ok;
          
          clearTimeout(timeout);
          server.kill();
          resolve(success);
        } catch (error) {
          console.error(`API test error: ${error.message}`);
          clearTimeout(timeout);
          server.kill();
          resolve(false);
        }
      }
    });

    server.on('close', () => {
      clearTimeout(timeout);
      if (!serverReady) {
        resolve(false);
      }
    });
  });
}

function checkBuildOutput() {
  const distDir = path.join(rootDir, 'dist');
  const publicDir = path.join(distDir, 'public');
  const serverDir = path.join(distDir, 'server');
  
  const checks = [
    { path: publicDir, name: 'Public directory' },
    { path: path.join(publicDir, 'index.html'), name: 'Index.html' },
    { path: path.join(publicDir, 'assets'), name: 'Assets directory' },
    { path: path.join(serverDir, 'index.js'), name: 'Server bundle' }
  ];

  let allGood = true;
  for (const check of checks) {
    const exists = fs.existsSync(check.path);
    if (!exists) {
      console.log(`❌ Missing: ${check.name} at ${check.path}`);
      allGood = false;
    } else {
      console.log(`✅ Found: ${check.name}`);
    }
  }

  return allGood;
}

async function runTests() {
  console.log('Starting tests...\n');

  // Clean previous build
  if (fs.existsSync(path.join(rootDir, 'dist'))) {
    console.log('🧹 Cleaning previous build...');
    fs.rmSync(path.join(rootDir, 'dist'), { recursive: true, force: true });
  }

  // Type checking
  if (tests.typeCheck) {
    const success = runCommand('npm run type-check', 'Type checking');
    logTest('Type Check', success);
  }

  // Build test
  if (tests.build) {
    const success = runCommand('npm run build', 'Building application', 60000);
    if (success) {
      const buildOutputOk = checkBuildOutput();
      logTest('Build', buildOutputOk, buildOutputOk ? 'All build artifacts present' : 'Missing build artifacts');
    } else {
      logTest('Build', false, 'Build command failed');
    }
  }

  // Server test
  if (tests.server && testResults.details.find(t => t.name === 'Build')?.success) {
    const success = await testServer();
    logTest('Server Startup', success, success ? 'Server started successfully' : 'Server failed to start');
  }

  // API test
  if (tests.api && testResults.details.find(t => t.name === 'Server Startup')?.success) {
    const success = await testAPI();
    logTest('API Health Check', success, success ? 'API responding correctly' : 'API not responding');
  }

  // Summary
  console.log('\n📊 Test Summary:');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);

  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.details
      .filter(t => !t.success)
      .forEach(t => console.log(`   - ${t.name}: ${t.details}`));
    
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
