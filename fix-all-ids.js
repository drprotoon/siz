#!/usr/bin/env node

// Script para corrigir todas as comparações de ID no arquivo routes.ts
const fs = require('fs');
const path = require('path');

// Caminho para o arquivo routes.ts
const routesFilePath = path.join(__dirname, 'server', 'routes.ts');

// Ler o conteúdo do arquivo
let content = fs.readFileSync(routesFilePath, 'utf8');

// Adicionar logging para todas as comparações de ID
content = content.replace(
  /if\s*\(\s*req\.user\.id\s*!==\s*userId\s*\)\s*\{[\s\S]*?return\s+res\.status\(403\)\.json\(\{\s*message:\s*"Acesso negado"\s*\}\);[\s\S]*?\}/g,
  `if (req.user.id !== parseInt(userId)) {
        console.log(\`Acesso negado: user.id=\${req.user.id}, userId=\${userId}, tipos: \${typeof req.user.id} e \${typeof userId}\`);
        return res.status(403).json({ message: "Acesso negado" });
      }`
);

// Escrever o arquivo de volta
fs.writeFileSync(routesFilePath, content, 'utf8');

console.log('Todas as comparações de ID foram corrigidas em routes.ts');
