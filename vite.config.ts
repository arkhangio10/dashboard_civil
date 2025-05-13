import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@styles': path.resolve(__dirname, 'src/assets/styles'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Aquí no es necesario usar additionalData si haces imports manuales
      },
    },
  },
})
