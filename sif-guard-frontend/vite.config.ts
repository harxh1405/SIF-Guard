import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'motion/react': 'framer-motion',
      'motion': 'framer-motion',
    },
  },
  server: {
    host: true,
    port: 3000,
  },
})
