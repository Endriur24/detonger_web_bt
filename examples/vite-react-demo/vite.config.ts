import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      'detonger-web-bt/react': path.resolve(__dirname, '../../dist/react/index.js'),
      'detonger-web-bt': path.resolve(__dirname, '../../dist/detonger-web-bt.js'),
    },
  },
  server: {
    https: process.env.HTTPS === 'true' ? {
      key: fs.readFileSync(path.resolve(__dirname, 'localhost-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'localhost.pem')),
    } : undefined,
    host: true,
    port: 5173,
  },
})
