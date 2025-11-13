import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // Ensure base path is root
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    // Optimize chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Separate ReactFlow into its own chunk (large library)
          if (id.includes('reactflow')) {
            return 'reactflow';
          }
          // Separate axios into its own chunk (smaller, changes less frequently)
          if (id.includes('axios')) {
            return 'axios';
          }
          // Vite already handles React/ReactDOM splitting automatically
          // No need to manually chunk them
        },
      },
    },
    // Enable minification and compression
    minify: 'esbuild', // Fast minification
    chunkSizeWarningLimit: 1000, // Warn if chunks exceed 1MB
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'reactflow', 'axios'],
  },
})
