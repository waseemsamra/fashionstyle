import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    inspectAttr(), 
    react(),
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
  },
});
