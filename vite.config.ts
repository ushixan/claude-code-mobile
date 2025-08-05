import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true,
        secure: false
      },
      // Direct GitHub proxy bypass
      '/gh': {
        target: 'https://github.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/gh/, ''),
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            // Strip frame-blocking headers
            delete proxyRes.headers['x-frame-options'];
            delete proxyRes.headers['content-security-policy'];
          });
        }
      },
      // Google proxy with comprehensive coverage
      '/google': {
        target: 'https://www.google.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/google/, ''),
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            delete proxyRes.headers['x-frame-options'];
            delete proxyRes.headers['content-security-policy'];
            
            // Also handle content rewriting for better navigation
            if (proxyRes.headers['content-type']?.includes('text/html')) {
              // This will be handled by the backend proxy for complex rewriting
            }
          });
        }
      },
      // Generic external site proxy
      '/site': {
        target: 'https://httpbin.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/site/, ''),
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            delete proxyRes.headers['x-frame-options'];
            delete proxyRes.headers['content-security-policy'];
          });
        }
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'editor-vendor': ['@uiw/react-codemirror', '@codemirror/lang-javascript', '@codemirror/lang-python'],
          'terminal-vendor': ['@xterm/xterm', '@xterm/addon-fit', '@xterm/addon-web-links'],
        }
      }
    }
  }
})