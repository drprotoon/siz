// Script to fix type comparison issues in routes.ts
const fs = require('fs');
const path = require('path');

// Path to routes.ts file
const routesFilePath = path.join(__dirname, 'server', 'routes.ts');

// Read the file
let content = fs.readFileSync(routesFilePath, 'utf8');

// Replace all instances of userId comparison
content = content.replace(
  /if \(req\.user\.id !== userId\)/g, 
  'if (req.user.id !== parseInt(userId))'
);

// Write the file back
fs.writeFileSync(routesFilePath, content, 'utf8');

console.log('Fixed type comparison issues in routes.ts');
