import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './src/__tests__',
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
  },
  timeout: 60000,
  expect: { timeout: 15000 },
  webServer: {
    command: 'VITE_AUTH_DISABLED=true npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60000,
  },
})
