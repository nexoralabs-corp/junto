import { defineConfig } from 'vitest/config'
import preact from '@preact/preset-vite'

export default defineConfig({
  base: '/junto/',
  plugins: [preact()],
  build: {
    outDir: 'dist',
  },
  test: {
    environment: 'jsdom',
  },
})
