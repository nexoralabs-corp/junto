/// <reference types="vitest" />
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/junto/',
  build: {
    outDir: 'dist',
  },
  test: {
    environment: 'jsdom',
  },
})
