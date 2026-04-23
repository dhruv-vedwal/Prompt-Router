import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    env: {
      JWT_SECRET: 'test_secret_only_for_vitest',
      DATABASE_URL: 'postgresql://mock:mock@localhost:5432/mock'
    }
  },
})
