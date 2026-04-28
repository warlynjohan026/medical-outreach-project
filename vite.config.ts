import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  build: {
    outDir: 'dist-react',
  },
  server: {
    port: 2626,
    proxy: {
      '/medical-outreach-project': {
        changeOrigin: true,
        target: 'http://localhost:3000',
      },
    },
    strictPort: true,
  },
})
