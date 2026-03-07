import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    inspectAttr(),
    react({
      // Fix for React 19 with Vite
      jsxRuntime: 'automatic',
    }),
    viteStaticCopy({
      targets: [
        {
          src: 'public/_redirects',
          dest: ''
        }
      ]
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, _options) => {
          proxy.on('proxyRes', (proxyRes, _req, _res) => {
            // Add CORS headers to all proxied responses
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS';
            proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization';
          });
        }
      }
    }
  },
  build: {
    // Raise the warning threshold to 600 kB (from default 500 kB)
    chunkSizeWarningLimit: 800,
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React core - MUST be first and separate
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/scheduler/')) {
            return 'vendor-react';
          }
          // React Router
          if (id.includes('node_modules/react-router') || id.includes('node_modules/@remix-run')) {
            return 'vendor-router';
          }
          // AWS Amplify (large library)
          if (id.includes('node_modules/aws-amplify') || id.includes('node_modules/@aws-amplify')) {
            return 'vendor-aws';
          }
          // TanStack Query - needs React
          if (id.includes('node_modules/@tanstack')) {
            return 'vendor-query';
          }
          // Radix UI primitives - needs React
          if (id.includes('node_modules/@radix-ui')) {
            return 'vendor-radix';
          }
          // Form libraries - needs React
          if (id.includes('node_modules/react-hook-form') || id.includes('node_modules/@hookform')) {
            return 'vendor-forms';
          }
          // UI libraries that need React
          if (
            id.includes('node_modules/sonner') ||
            id.includes('node_modules/next-themes') ||
            id.includes('node_modules/cmdk') ||
            id.includes('node_modules/vaul') ||
            id.includes('node_modules/embla-carousel-react') ||
            id.includes('node_modules/react-resizable-panels') ||
            id.includes('node_modules/react-day-picker')
          ) {
            return 'vendor-react-ui';
          }
          // Recharts + dependencies
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) {
            return 'vendor-charts';
          }
          // Date utilities (no React dependency)
          if (id.includes('node_modules/date-fns')) {
            return 'vendor-date';
          }
          // Icons
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          // Everything else in node_modules
          if (id.includes('node_modules')) {
            return 'vendor-lib';
          }
        },
      },
    },
  },
});
