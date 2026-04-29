import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from "node:path"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'core/schemas/users': path.resolve(__dirname, '../core/src/schemas/users.ts'),
      'core/schemas/tickets': path.resolve(__dirname, '../core/src/schemas/tickets.ts'),
      'core/enums': path.resolve(__dirname, '../core/src/enums.ts'),
      'core/types/user': path.resolve(__dirname, '../core/src/types/user.ts'),
      'core/types/ticket': path.resolve(__dirname, '../core/src/types/ticket.ts'),
    },
    dedupe: ['zod'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    pool: 'threads',
  },
})
