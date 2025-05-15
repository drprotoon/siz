const fs = require('fs');
const path = require('path');

// Caminho para o arquivo seed-database.ts
const filePath = path.join(__dirname, 'scripts', 'seed-database.ts');

// Ler o conteúdo do arquivo
let content = fs.readFileSync(filePath, 'utf8');

// Substituir todas as ocorrências de arrays de imagens
content = content.replace(/images: \[(.*?)\],/g, 'images: arrayToJsonString([$1]),');

// Escrever o conteúdo modificado de volta para o arquivo
fs.writeFileSync(filePath, content, 'utf8');

console.log('Arquivo atualizado com sucesso!');
