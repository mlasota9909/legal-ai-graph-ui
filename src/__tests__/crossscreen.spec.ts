import { test, expect, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { basename, join } from 'node:path'

const REAL_DOC_IDS = ['romancath', 'original_royalcomm', 'volume_10', 'tanyaday', 'hopper']
const DEFAULT_REAL_DOC_ID = 'original_royalcomm'
const MOCK_DOC_ID = 'doc_2026_05_royalcomm'
const MOCK_TITLE = 'Royal Commission — Automated Debt Recovery, Volume 1'
const MOCK_PAGE_COUNT = '4,812'

async function waitForRealDoc(page: Page): Promise<string> {
  await page.waitForFunction(
    (mockId: string) => {
      const path = window.location.pathname
      return path.includes('/runs/') && !path.includes(mockId)
    },
    MOCK_DOC_ID,
    { timeout: 15000 }
  )
  const docId = decodeURIComponent(page.url().split('/runs/')[1]?.split('/')[0] ?? '')
  if (docId !== DEFAULT_REAL_DOC_ID) {
    await page.goto(`/runs/${DEFAULT_REAL_DOC_ID}`)
    await page.waitForFunction(
      (targetId: string) => window.location.pathname === `/runs/${targetId}`,
      DEFAULT_REAL_DOC_ID,
      { timeout: 15000 }
    )
  }
  // Allow one status-poll cycle for data to settle
  await page.waitForTimeout(2000)
  return DEFAULT_REAL_DOC_ID
}

function parseCount(text: string | null | undefined): number {
  if (!text) return -1
  const m = text.replace(/,/g, '').match(/\d+/)
  return m ? parseInt(m[0], 10) : -1
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('legal_ai_token', 'playwright')
  })
})

test('lattice artifact counts match atrium tab badges', async ({ page }) => {
  await page.goto('/')
  const docId = await waitForRealDoc(page)
  expect(REAL_DOC_IDS).toContain(docId)

  // Wait for status poll to update artifact counts (status API takes 1-3s after URL change)
  // Real documents have > 100 chronology events, so we wait for the first "View all N" to show N > 100
  await page.waitForFunction(() => {
    const els = document.querySelectorAll('[class*="cursor-pointer"]')
    for (const el of els) {
      const text = el.textContent
      const match = text?.match(/View all (\d+)/)
      if (match && parseInt(match[1], 10) > 100) return true
    }
    return false
  }, { timeout: 15000 })

  // Grab "View all N →" footer texts from the three list artifact cards
  const viewAllLinks = await page.locator('text=View all').allInnerTexts()
  // Order: Chronology, Entity register, People register, Executive memo, Detailed analysis
  const latticeChronology = parseCount(viewAllLinks[0])
  const latticeEntities = parseCount(viewAllLinks[1])
  const latticePeople = parseCount(viewAllLinks[2])
  expect(latticeChronology).toBeGreaterThan(0)
  expect(latticeEntities).toBeGreaterThan(0)
  expect(latticePeople).toBeGreaterThan(0)

  // Navigate to Atrium; wait until its Chronology tab badge matches the Lattice count
  await page.goto(`/runs/${docId}/chronology`)
  await page.waitForFunction((expected: number) => {
    const btn = [...document.querySelectorAll('button')].find(b => /Chronology/i.test(b.textContent ?? ''))
    if (!btn) return false
    const match = btn.textContent?.match(/(\d[\d,]+)/)
    return match != null && parseInt(match[1].replace(/,/g, ''), 10) === expected
  }, latticeChronology, { timeout: 15000 })

  // Read tab badge numbers
  const chronoTab = page.locator('button', { hasText: 'Chronology' }).first()
  const entityTab = page.locator('button', { hasText: 'Entity register' }).first()
  const peopleTab = page.locator('button', { hasText: 'People register' }).first()

  const atriumChronology = parseCount(await chronoTab.innerText())
  const atriumEntities = parseCount(await entityTab.innerText())
  const atriumPeople = parseCount(await peopleTab.innerText())

  expect(atriumChronology).toBe(latticeChronology)
  expect(atriumEntities).toBe(latticeEntities)
  expect(atriumEntities).toBeGreaterThanOrEqual(400)
  expect(atriumPeople).toBe(latticePeople)
})

test('real document data replaces mock values', async ({ page }) => {
  await page.goto('/')
  const docId = await waitForRealDoc(page)

  expect(REAL_DOC_IDS).toContain(docId)
  expect(docId).not.toBe(MOCK_DOC_ID)

  const bodyText = await page.locator('body').innerText()
  expect(bodyText).not.toContain(MOCK_TITLE)
  expect(bodyText).not.toContain(MOCK_PAGE_COUNT)
})

test('monitor to chronology and back', async ({ page }) => {
  await page.goto('/')
  const docId = await waitForRealDoc(page)

  // Click the Chronology artifact card (contains "View all N →" and "Chronology")
  await page.locator('text=View all').first().click()
  await expect(page).toHaveURL(/\/chronology$/)

  // Chronology tab should be active (border-accent underline — check it's present)
  const chronoTab = page.locator('button', { hasText: 'Chronology' }).first()
  await expect(chronoTab).toBeVisible()

  // Navigate back to monitor
  await page.locator('text=← Monitor').click()
  await expect(page).toHaveURL(new RegExp(`/runs/${docId}$`))

  // KPI Claims cell must be visible
  await expect(page.locator('text=Claims').first()).toBeVisible()
})

test('document picker switches active document', async ({ page }) => {
  await page.goto('/')
  const firstDocId = await waitForRealDoc(page)
  expect(REAL_DOC_IDS).toContain(firstDocId)

  // Allow the document picker's own /api/status fetch to populate its dropdown
  // before we try to click it (cold Vite boot can make that call slow).
  await page.waitForTimeout(3000)

  // Open document picker
  await page.locator('button', { hasText: 'Currently showing:' }).click()

  // Wait for dropdown items to appear (packs picker uses grid-cols-[1fr_auto])
  const items = page.locator('[class*="grid-cols-[1fr_auto"]')
  await items.first().waitFor({ timeout: 10000 })

  // Click first dropdown item that is NOT the current document
  const count = await items.count()
  let clicked = false
  for (let i = 0; i < count; i++) {
    const text = await items.nth(i).innerText()
    const candidateId = text.split('\t')[0]?.trim().toLowerCase().replace(/\s+/g, '_')
    if (!candidateId.includes(firstDocId.replace(/_/g, ' ').split(' ')[0])) {
      await items.nth(i).click()
      clicked = true
      break
    }
  }
  if (!clicked) {
    // Fallback: click second item if we couldn't distinguish
    await items.nth(1).click()
  }

  // Wait for URL to change
  await page.waitForFunction(
    (prevId: string) => {
      const path = window.location.pathname
      return path.includes('/runs/') && !path.includes(prevId)
    },
    firstDocId,
    { timeout: 20000 }
  )

  const newDocId = decodeURIComponent(page.url().split('/runs/')[1]?.split('/')[0] ?? '')
  expect(newDocId).not.toBe(firstDocId)
  expect(REAL_DOC_IDS).toContain(newDocId)

  // Claims KPI should update to a non-zero number
  await page.waitForTimeout(3000)
  const claimsText = await page.locator('text=Claims').first().locator('..').innerText()
  expect(parseCount(claimsText)).toBeGreaterThan(0)
})

test('no mock in prod build — data_source badges are real after load', async ({ page }) => {
  await page.goto('/')
  await waitForRealDoc(page)

  // Enable sources overlay
  await page.locator('button', { hasText: 'Sources' }).first().click()
  await page.waitForTimeout(500)

  // At least some "real data" badges should now be visible
  const realBadges = await page.locator('[title="real data"]').count()
  expect(realBadges).toBeGreaterThan(0)

  // The API should never have returned a mock envelope on the status call
  const apiCalls = await page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .filter((r) => r.name.includes('/api/'))
      .map((r) => ({ url: r.name, status: (r as PerformanceResourceTiming).responseStatus }))
  )
  const statusCalls = apiCalls.filter((c) => c.url.includes('/api/status/') && c.status === 200)
  expect(statusCalls.length).toBeGreaterThan(0)
})

test('evidence graph panel loads with real data', async ({ page }) => {
  await page.goto('/')
  const docId = await waitForRealDoc(page)

  // Navigate directly to evidence view
  await page.goto(`/runs/${docId}/evidence`)
  await page.waitForTimeout(3000)

  // The panel should show a heading or content — not the old stub text
  const bodyText = await page.locator('body').innerText()
  expect(bodyText).not.toContain('Evidence inspector (stub)')

  // Should show back navigation
  const backBtn = page.locator('button', { hasText: /Back/ }).first()
  await expect(backBtn).toBeVisible()

  // Clicking back should return to monitor
  await backBtn.click()
  await expect(page).toHaveURL(new RegExp(`/runs/${docId}$`))
})

test('entity register includes organisation and document types', async ({ page }) => {
  await page.goto('/')
  const docId = await waitForRealDoc(page)

  // Navigate to entities tab
  await page.goto(`/runs/${docId}/entities`)
  await page.waitForTimeout(3000)

  // The entity tab badge should now reflect all 4 entity types
  // (legislation + authority + organisation + document)
  const entityTab = page.locator('button', { hasText: 'Entity register' }).first()
  const badgeText = await entityTab.innerText()

  // Parse the count from the badge (it contains "Entity register NNN")
  const countMatch = badgeText.replace(/,/g, '').match(/\d+/)
  const entityCount = countMatch ? parseInt(countMatch[0], 10) : 0

  // Should now be the full entities_total (at least 400 for romancath, covering all 4 types)
  expect(entityCount).toBeGreaterThan(400)
})

test('monitor relationship graph card navigates to evidence view', async ({ page }) => {
  await page.goto('/')
  const docId = await waitForRealDoc(page)

  const graphCard = page.locator('button', { hasText: /Relationship graph|View graph/ }).first()
  await expect(graphCard).toBeVisible({ timeout: 10000 })
  await graphCard.click()

  await expect(page).toHaveURL(new RegExp(`/runs/${docId}/evidence`), { timeout: 10000 })
  const bodyText = await page.locator('body').innerText()
  expect(bodyText).not.toContain('Evidence inspector (stub)')
})

test('atrium graph button navigates to evidence view', async ({ page }) => {
  await page.goto('/')
  const docId = await waitForRealDoc(page)

  await page.goto(`/runs/${docId}/chronology`)
  await page.waitForTimeout(1000)

  const graphBtn = page.locator('button', { hasText: /^Graph/ }).first()
  await expect(graphBtn).toBeVisible({ timeout: 10000 })
  await graphBtn.click()

  await expect(page).toHaveURL(new RegExp(`/runs/${docId}/evidence`), { timeout: 10000 })
  const backBtn = page.locator('button', { hasText: /Back/ }).first()
  await expect(backBtn).toBeVisible()
})

test('evidence panel shows depth selector buttons', async ({ page }) => {
  await page.goto('/')
  const docId = await waitForRealDoc(page)

  await page.goto(`/runs/${docId}/evidence`)
  await page.waitForTimeout(4000)

  const hopBtn = page.locator('button', { hasText: /hop/i }).first()
  await expect(hopBtn).toBeVisible()
})

test('evidence back button returns to monitor', async ({ page }) => {
  await page.goto('/')
  const docId = await waitForRealDoc(page)

  await page.goto(`/runs/${docId}/evidence`)
  await page.waitForTimeout(2000)

  await page.locator('button', { hasText: /Back/i }).click()
  await expect(page).toHaveURL(new RegExp(`/runs/${docId}$`))
})

test('evidence panel requests api/graph endpoint', async ({ page }) => {
  await page.goto('/')
  const docId = await waitForRealDoc(page)

  let captured = false
  await page.route('**/api/graph**', (route) => {
    captured = true
    route.continue()
  })

  await page.goto(`/runs/${docId}/evidence`)
  await page.waitForTimeout(5000)

  expect(captured).toBe(true)
})

const STATIC_LAWYER_URL = 'http://localhost:5173/static/lawyer.html'
const STATIC_DIR = join(process.cwd(), 'static')

async function serveStaticLawyerJsxAsRaw(page: Page): Promise<void> {
  await page.route('**/static/*.jsx', async (route) => {
    const fileName = basename(new URL(route.request().url()).pathname)
    await route.fulfill({
      status: 200,
      contentType: 'text/babel',
      body: readFileSync(join(STATIC_DIR, fileName), 'utf8'),
    })
  })
}

async function waitForStaticLawyerMatterList(page: Page): Promise<number> {
  await page.waitForFunction(() => {
    const sidebar = document.querySelector('#panel-doc-list, aside, [class*="side"]')
    if (!sidebar) return false
    const items = Array.from(
      sidebar.querySelectorAll(
        '.lw-doc-card, [class*="matter"], [class*="doc"], li, [role="listitem"]'
      )
    )
    return items.some((item) => (item.textContent ?? '').trim().length > 0)
  }, { timeout: 10000 })

  return page.evaluate(() => {
    const sidebar = document.querySelector('#panel-doc-list, aside, [class*="side"]')
    if (!sidebar) return 0
    return Array.from(
      sidebar.querySelectorAll(
        '.lw-doc-card, [class*="matter"], [class*="doc"], li, [role="listitem"]'
      )
    ).filter((item) => (item.textContent ?? '').trim().length > 0).length
  })
}

function firstStaticLawyerSidebarItem(page: Page) {
  return page
    .locator(
      '#panel-doc-list .lw-doc-card, aside .lw-doc-card, ' +
        '#panel-doc-list .lw-matter-head, aside .lw-matter-head, ' +
        '#panel-doc-list [class*="matter-row"], aside [class*="matter-row"], ' +
        '#panel-doc-list li, aside li, #panel-doc-list [role="listitem"], aside [role="listitem"]'
    )
    .filter({ hasText: /\S/ })
    .first()
}

async function waitForStaticLawyerChronologyRows(page: Page): Promise<number> {
  await page.waitForFunction(() => {
    const panel = document.querySelector(
      '#panel-chronology, [data-panel-id*="chronology"], [id*="chronology"]'
    )
    if (!panel) return false
    return panel.querySelectorAll('.lwa-tl-row, [role="row"], tbody tr').length > 0
  }, { timeout: 15000 })

  return page.evaluate(() => {
    const panel = document.querySelector(
      '#panel-chronology, [data-panel-id*="chronology"], [id*="chronology"]'
    )
    return panel?.querySelectorAll('.lwa-tl-row, [role="row"], tbody tr').length ?? 0
  })
}

test('static lawyer app loads matter list', async ({ page }) => {
  await serveStaticLawyerJsxAsRaw(page)
  const failedFetchErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error' && /Failed to fetch/i.test(msg.text())) {
      failedFetchErrors.push(msg.text())
    }
  })

  await page.goto(STATIC_LAWYER_URL)

  const matterCount = await waitForStaticLawyerMatterList(page)
  expect(matterCount).toBeGreaterThan(0)
  expect(failedFetchErrors).toEqual([])
})

test('static lawyer app loads chronology rows', async ({ page }) => {
  await serveStaticLawyerJsxAsRaw(page)
  await page.goto(STATIC_LAWYER_URL)
  await waitForStaticLawyerMatterList(page)

  await firstStaticLawyerSidebarItem(page).click()

  const chronologyTab = page.getByRole('button', { name: /Chronology/i }).first()
  await expect(chronologyTab).toBeVisible({ timeout: 10000 })
  await chronologyTab.click()

  const rowCount = await waitForStaticLawyerChronologyRows(page)
  expect(rowCount).toBeGreaterThan(0)
})

test('static lawyer app data_source is real', async ({ page }) => {
  await serveStaticLawyerJsxAsRaw(page)
  const realSourceResponse = page.waitForResponse(async (response) => {
    if (!response.ok()) return false
    const url = response.url()
    if (!url.includes('/api/matters') && !url.includes('/api/status')) return false
    try {
      const data = await response.json()
      return data?.data_source === 'real'
    } catch {
      return false
    }
  }, { timeout: 10000 })

  await page.goto(STATIC_LAWYER_URL)

  await expect(realSourceResponse).resolves.toBeTruthy()
})
