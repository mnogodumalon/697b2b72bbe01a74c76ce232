import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({ 
  base: '/697b2b72bbe01a74c76ce232/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api/rest': {
        target: 'https://my.living-apps.de',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/rest/, '/rest'),
      },
    },
  },
})
