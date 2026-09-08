import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
  // Honour a harness-assigned port so this never collides with another dev server.
  server: { port: process.env.PORT ? Number(process.env.PORT) : 5173 },
})
