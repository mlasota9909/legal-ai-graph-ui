import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './src/__tests__',
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
  },
  timeout: 30000,
  expect: { timeout: 15000 },
})
