const { defineConfig } = require("vite");
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
});
