import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
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
        // Ensure CSS is extracted to a separate file
        assetFileNames: (assetInfo) => {
          // Use a simple approach to avoid deprecated properties
          if (assetInfo.type === 'asset' && assetInfo.source && assetInfo.source.toString().includes('stylesheet')) {
            return `assets/styles.[hash].css`;
          }
          return `assets/[name].[hash][extname]`;
        },
        // Ensure JS is in a predictable location
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        manualChunks: undefined
      }
    }
  },
});
