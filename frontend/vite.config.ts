import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: process.env.VITE_ALLOWED_HOSTS
      ? (process.env.VITE_ALLOWED_HOSTS === 'all' || process.env.VITE_ALLOWED_HOSTS === 'true'
          ? true
          : process.env.VITE_ALLOWED_HOSTS.split(','))
      : ['localhost'],
  },
})
