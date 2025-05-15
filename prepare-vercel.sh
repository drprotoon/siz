#!/bin/bash

# Script para preparar o deploy no Vercel
echo "Preparando ambiente para deploy no Vercel..."

# Copia os arquivos de configuração simplificados
cp vercel.package.json package.json
cp vite.vercel.config.js vite.config.js
cp postcss.config.mjs postcss.config.js
cp tailwind.config.mjs tailwind.config.js

# Remove arquivos problemáticos
rm -f postcss.config.cjs tailwind.config.cjs vite.config.cjs

echo "Ambiente preparado com sucesso!"
echo "Agora você pode fazer o deploy no Vercel com as seguintes configurações:"
echo "- Framework: Other"
echo "- Build Command: npm run build"
echo "- Output Directory: dist/public"
echo "- Install Command: npm install"
