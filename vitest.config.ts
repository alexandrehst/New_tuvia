import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      exclude: [
        'node_modules/**',
        '.next/**',
        'src/tests/**',
        'tests/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/migrations/**',
        'src/app/**',
        'src/lib/**',
        'src/components/**',
        'prisma/**',
      ],
    },
    exclude: ['node_modules', 'tests/e2e/**'],
  },
})
