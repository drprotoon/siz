import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    cssCodeSplit: false, // Disable CSS code splitting to ensure all CSS is in one file
    rollupOptions: {
      output: {
        // Ensure CSS is extracted to a separate file
        assetFileNames: (assetInfo) => {
          const fileName = assetInfo.name || '';
          if (/\.(css)$/i.test(fileName)) {
            return `assets/styles.[hash][extname]`;
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
