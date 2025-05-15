/**
 * Script to set up the correct configuration files for Vercel deployment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('Setting up configuration files for Vercel deployment...');

// Verificar se estamos no ambiente Vercel
const isVercel = process.env.VERCEL === '1';
console.log(`Ambiente Vercel: ${isVercel ? 'Sim' : 'Não'}`);

// Garantir que todas as dependências estejam instaladas
try {
  console.log('Verificando dependências do Tailwind...');

  // Verificar se o tailwindcss está instalado
  try {
    require.resolve('tailwindcss');
    console.log('✅ tailwindcss já está instalado');
  } catch (e) {
    console.log('⚠️ tailwindcss não encontrado, instalando...');
    execSync('npm install --no-save tailwindcss autoprefixer postcss @tailwindcss/typography tailwindcss-animate', {
      stdio: 'inherit',
      cwd: rootDir
    });
  }
} catch (error) {
  console.error('❌ Erro ao verificar dependências:', error.message);
}

// Create postcss.config.cjs
const postcssConfigPath = path.join(rootDir, 'postcss.config.cjs');
const postcssConfig = `// CommonJS version of postcss config
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;

fs.writeFileSync(postcssConfigPath, postcssConfig);
console.log(`Created ${postcssConfigPath}`);

// Create tailwind.config.cjs
const tailwindConfigPath = path.join(rootDir, 'tailwind.config.cjs');
const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [
    // Use try-catch to handle missing dependencies
    function() {
      try {
        return require("tailwindcss-animate");
      } catch (e) {
        console.warn("tailwindcss-animate plugin not found, skipping");
        return {};
      }
    },
    function() {
      try {
        return require("@tailwindcss/typography");
      } catch (e) {
        console.warn("@tailwindcss/typography plugin not found, skipping");
        return {};
      }
    }
  ],
}`;

fs.writeFileSync(tailwindConfigPath, tailwindConfig);
console.log(`Created ${tailwindConfigPath}`);

// Create vite.config.cjs
const viteConfigPath = path.join(rootDir, 'vite.config.cjs');
const viteConfig = `const { defineConfig } = require("vite");
const react = require("@vitejs/plugin-react");
const path = require("path");

module.exports = defineConfig({
  plugins: [
    react.default(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    cssCodeSplit: false, // Disable CSS code splitting to ensure all CSS is in one file
    rollupOptions: {
      output: {
        // Simple asset file naming
        assetFileNames: 'assets/[name].[hash][extname]',
        // Ensure JS is in a predictable location
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        manualChunks: undefined
      }
    }
  },
})`;

fs.writeFileSync(viteConfigPath, viteConfig);
console.log(`Created ${viteConfigPath}`);

console.log('Configuration files set up successfully!');
