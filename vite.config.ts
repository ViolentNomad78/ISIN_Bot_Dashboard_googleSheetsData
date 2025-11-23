import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // We are keeping the file structure flat as per your project setup
  root: '.',
  build: {
    outDir: 'dist',
  }
})