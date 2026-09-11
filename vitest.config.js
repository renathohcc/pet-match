import { defineConfig } from 'vitest/config'

// Só os testes de regras por enquanto (rodam contra o emulador do Firestore,
// não no browser) — ambiente Node, sem jsdom.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    testTimeout: 20000,
    hookTimeout: 20000,
  },
})
