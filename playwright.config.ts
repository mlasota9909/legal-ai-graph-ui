import { defineConfig } from '@playwright/test'

const port = process.env.PLAYWRIGHT_PORT ?? '5173'
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${port}`
const reuseExistingServer = process.env.PLAYWRIGHT_REUSE_EXISTING_SERVER !== 'false'

export default defineConfig({
  testDir: './src/__tests__',
  use: {
    baseURL,
    headless: true,
  },
  timeout: 60000,
  expect: { timeout: 15000 },
  webServer: {
    command: `VITE_AUTH_DISABLED=true npm run dev -- --host 0.0.0.0 --port ${port}`,
    url: baseURL,
    reuseExistingServer,
    timeout: 60000,
  },
})
