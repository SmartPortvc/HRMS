import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { writeFileSync } from 'fs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-redirects',
      closeBundle() {
        // Create _redirects file in the dist directory
        writeFileSync(
          resolve(__dirname, 'dist', '_redirects'),
          '/* /index.html 200'
        );
      }
    }
  ],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          ui: ['lucide-react', 'react-hot-toast', 'framer-motion', 'recharts']
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react']
  },
  server: {
    port: 3000,
    host: true
  }
});