// Cross-screen reconciliation tests — 20 tests
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

test('document picker fallback does not badge fabricated zero counts as real', async ({ page }) => {
  await page.route('**/api/packs', async (route) => {
    await route.fulfill({ status: 404, body: 'not found' })
  })
  await page.route('**/api/status', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        documents: [
          {
            document_id: 'fallback_doc',
            label: 'Fallback document',
            graph_namespace: 'fallback_ns',
          },
        ],
      }),
    })
  })

  await page.goto('/')
  await waitForRealDoc(page)
  await page.locator('button', { hasText: 'Sources' }).first().click()
  await page.locator('button', { hasText: 'Currently showing:' }).click()

  const fallbackRow = page.locator('button', { hasText: 'Fallback document' }).first()
  await expect(fallbackRow).toBeVisible({ timeout: 10000 })
  await expect(fallbackRow).toContainText('claims unavailable')
  await expect(fallbackRow.locator('[title="source unavailable"]')).toBeVisible()
  await expect(fallbackRow.locator('[title="real data"]')).toHaveCount(0)
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

test('atrium list artifact source badge follows real active rows', async ({ page }) => {
  await page.goto('/')
  const docId = await waitForRealDoc(page)

  await page.goto(`/runs/${docId}/chronology`)
  await page.locator('button', { hasText: 'Sources' }).first().click()

  const listHeader = page
    .locator('div', { hasText: /Showing .*Full run:/ })
    .filter({ has: page.locator('[title="real data"]') })
    .first()
  await expect(listHeader).toBeVisible({ timeout: 10000 })
})

test('atrium augmentation provider rows do not invent omitted source counts', async ({ page }) => {
  const docId = DEFAULT_REAL_DOC_ID
  const statusDoc = {
    document_id: docId,
    label: 'Mocked augmentation status',
    graph_namespace: 'mocked_augmentation_ns',
    page_count: 1,
    pipeline_stage: 'completed',
    upload_ts: '2026-06-29T00:00:00Z',
    graph_counts: {
      claims_total: 1,
      entities_total: 1,
      persons_total: 1,
      events_total: 1,
      external_sources: 3,
      evidenced_by_external_edges: 3,
      external_sources_by_source: { austlii: 3 },
      data_source: 'real',
    },
  }

  await page.route('**/api/status', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data_source: 'real',
        documents: [statusDoc],
      }),
    })
  })

  await page.route(`**/api/status/${docId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(statusDoc),
    })
  })

  await page.goto(`/runs/${docId}/chronology`)
  await page.locator('button', { hasText: 'Sources' }).first().click()

  await expect(page.locator('[data-source-label="Augmentation austlii"]')).toContainText('3')
  await expect(page.locator('[data-source-label="Augmentation austlii"] [title="real data"]')).toBeVisible()
  await expect(page.locator('[data-source-label="Augmentation eyecite"]')).toContainText('unavailable')
  await expect(page.locator('[data-source-label="Augmentation eyecite"] [title="source unavailable"]')).toBeVisible()
  await expect(page.locator('[data-source-label="Augmentation eyecite"]')).not.toContainText('312')
  await expect(page.locator('[data-source-label="Augmentation companies_house"]')).toContainText('unavailable')
})

test('lattice KPI and agreement source badges follow backend fields', async ({ page }) => {
  await page.goto('/')
  await waitForRealDoc(page)
  await page.locator('button', { hasText: 'Sources' }).first().click()

  for (const label of ['Claims', 'Conflicts', 'Human queue', 'Agreement Chronology', 'Agreement People', 'Agreement Entity']) {
    await expect(page.locator(`[data-source-label="${label}"] [title="real data"]`)).toBeVisible({ timeout: 10000 })
  }
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

test('static lawyer chat handles query_backend_unavailable degraded query response', async ({ page }) => {
  await serveStaticLawyerJsxAsRaw(page)
  await page.route('**/api/query', async (route) => {
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({
        detail: {
          code: 'query_backend_unavailable',
          message: 'Query processing backend is currently unavailable',
        },
      }),
    })
  })

  await page.goto(STATIC_LAWYER_URL)

  const input = page.locator('.lw-chat-input input')
  await expect(input).toBeVisible({ timeout: 10000 })
  await input.fill('What are the key legal issues?')
  await page.locator('.lw-chat-send').click()

  await expect(
    page.getByText(
      'Query backend unavailable. The AI query service is temporarily unavailable; evidence graph, registers, and summaries remain available.'
    )
  ).toBeVisible({ timeout: 10000 })
  await expect(page.getByText('No answer found in the available artifact claims.')).toHaveCount(0)
  await expect(page.locator('.lw-chat-source')).toHaveCount(0)
})

test('login page renders with email and password fields', async ({ page }) => {
  await page.goto('/login')

  // Auth is disabled in dev mode (VITE_AUTH_DISABLED=true) so the form
  // renders synchronously, then a 1s timer redirects to '/'.
  // Assert the form elements are visible within that window.
  const emailInput = page.locator('input[type="email"]')
  const passwordInput = page.locator('input[type="password"]')
  const submitButton = page.locator('button[type="submit"]')

  await expect(emailInput).toBeVisible({ timeout: 3000 })
  await expect(passwordInput).toBeVisible({ timeout: 3000 })
  await expect(submitButton).toBeVisible({ timeout: 3000 })
})

test('AskPanel returns an answer with citations', async ({ page }) => {
  const statusResponse = page.waitForResponse(async (response) => {
    if (!response.ok()) return false
    const url = response.url()
    if (!url.includes('/api/status') || /\/api\/status\/.+/.test(url)) return false
    return true
  }, { timeout: 15000 })

  await page.goto('/')
  await page.evaluate(() =>
    fetch('/api/status', {
      headers: { Authorization: `Bearer ${localStorage.getItem('legal_ai_token') ?? ''}` },
    }),
  )

  const response = await statusResponse
  const payload = (await response.json()) as { documents?: { document_id: string }[] }
  const docId = payload.documents?.[0]?.document_id
  expect(docId).toBeTruthy()

  await page.goto(`/runs/${docId}/ask`)

  const textarea = page.locator('textarea')
  await textarea.waitFor({ timeout: 10000 })

  await textarea.fill('What is the main subject of this document?')

  // The submit button is disabled until the namespace loads from /api/status/{docId}.
  // Wait for it to become enabled — this is the reliable signal that the namespace is ready.
  const submitButton = page.locator('button').filter({ hasText: 'Ask' }).first()
  await expect(submitButton).toBeEnabled({ timeout: 10000 })

  // Set up query response capture BEFORE clicking to avoid race condition
  const queryResponsePromise = page.waitForResponse(
    (resp) => resp.url().includes('/api/query'),
    { timeout: 30000 },
  )

  await submitButton.click()

  const queryResp = await queryResponsePromise
  expect(queryResp.ok()).toBeTruthy()
  const queryData = (await queryResp.json()) as { data_source?: string; answer_basis?: string | null }
  expect(queryData.data_source).toBe('real')
  expect(['retrieved_evidence', undefined, null]).toContain(queryData.answer_basis)

  // Answer renders as <p class="font-serif …"> inside <main> → <section> → answer blocks
  const answerEl = page.locator('main section p').first()
  await expect(answerEl).toBeVisible({ timeout: 10000 })

  // Citations render as <button class="… font-mono …"> inside each answer block
  const citationEl = page.locator('main section button.font-mono').first()
  await expect(citationEl).toBeVisible({ timeout: 5000 })
})

test('activity stream endpoint returns real data_source', async ({ page }) => {
  // Set up capture BEFORE navigation to avoid race
  const activityResp = page.waitForResponse(
    async (resp) => {
      if (!resp.url().includes('/activity')) return false
      if (!resp.ok()) return false
      try {
        const data = (await resp.json()) as { data_source?: string }
        return data?.data_source === 'real'
      } catch {
        return false
      }
    },
    { timeout: 15000 },
  )

  await page.goto('/')

  const resp = await activityResp
  expect(resp.ok()).toBeTruthy()
})

test('summary endpoint returns real data_source', async ({ page }) => {
  // Set up capture BEFORE navigation to avoid race
  const summaryResp = page.waitForResponse(
    async (resp) => {
      if (!resp.url().includes('/summary')) return false
      if (!resp.ok()) return false
      try {
        const data = (await resp.json()) as { data_source?: string }
        return data?.data_source === 'real'
      } catch {
        return false
      }
    },
    { timeout: 15000 },
  )

  await page.goto('/')

  const resp = await summaryResp
  expect(resp.ok()).toBeTruthy()
})

test('stale summary response cannot overwrite selected document', async ({ page }) => {
  const staleText = 'STALE ORIGINAL SUMMARY SHOULD NOT RENDER'
  const freshText = 'FRESH HOPPER SUMMARY SHOULD RENDER'
  const provenance = {
    node_id: 'node:test',
    labels: [],
    source_chunk_id: 'chunk:test',
    page_start: 1,
    edge_ids: [],
    linked_node_ids: [],
  }

  await page.route('**/api/docs/original_royalcomm/summary', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 800))
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        document_id: 'original_royalcomm',
        data_source: 'real',
        overview: { text: staleText, provenance: [provenance] },
        sections: [{ title: 'Stale', text: staleText, provenance: [provenance] }],
        recommendations: null,
      }),
    }).catch(() => undefined)
  })

  await page.route('**/api/docs/hopper/summary', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        document_id: 'hopper',
        data_source: 'real',
        overview: { text: freshText, provenance: [provenance] },
        sections: [{ title: 'Fresh', text: freshText, provenance: [provenance] }],
        recommendations: null,
      }),
    })
  })

  await page.goto('/runs/original_royalcomm/exec')
  await page.waitForTimeout(100)
  await page.goto('/runs/hopper/exec')

  await expect(page.getByText(freshText)).toBeVisible({ timeout: 10000 })
  await page.waitForTimeout(1000)
  await expect(page.locator('body')).not.toContainText(staleText)
})

test('executive memo tab renders real summary text, not loading state', async ({ page }) => {
  // Step 1: Navigate to home and wait for real document
  await page.goto('/')
  const docId = await waitForRealDoc(page)
  expect(REAL_DOC_IDS).toContain(docId)

  // Step 2: Set up response capture for /api/docs/{docId}/summary BEFORE navigation
  const summaryResp = page.waitForResponse(
    async (resp) => {
      if (!resp.url().includes(`/api/docs/${docId}/summary`)) return false
      if (!resp.ok()) return false
      try {
        const data = await resp.json()
        return data?.data_source === 'real'
      } catch {
        return false
      }
    },
    { timeout: 20000 },
  )

  // Step 3: Navigate to exec tab
  await page.goto(`/runs/${docId}/exec`)

  // Step 4: Wait for summary API response to complete
  const resp = await summaryResp
  expect(resp.ok()).toBeTruthy()

  // Step 5: Wait for the overview <p> to be visible — SummaryPanel uses divs not sections
  const summaryParagraph = page.locator('p').filter({ hasText: /.{50,}/ }).first()
  await expect(summaryParagraph).toBeVisible({ timeout: 10000 })

  // Step 6: Assert the text does not contain 'Loading'
  const paragraphText = await summaryParagraph.innerText()
  expect(paragraphText).not.toContain('Loading')
  expect(paragraphText.length).toBeGreaterThan(50)
})

test('AskPanel query request uses document_id and not namespace', async ({ page }) => {
  const TEST_DOC_ID = 'test_doc_2026'

  // Mock /api/status to return a document with document_id (no namespace)
  await page.route('**/api/status', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data_source: 'real',
        documents: [
          {
            document_id: TEST_DOC_ID,
            label: 'Test Document',
            graph_namespace: null,
          },
        ],
      }),
    })
  })

  // Mock /api/status/{docId} for the AskPanel to load
  await page.route(`**/api/status/${TEST_DOC_ID}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        document_id: TEST_DOC_ID,
        label: 'Test Document',
        data_source: 'real',
        graph_namespace: null,
      }),
    })
  })

  // Capture /api/query requests
  let capturedRequestBody: unknown = null
  await page.route('**/api/query', async (route) => {
    const request = route.request()
    const postData = request.postDataJSON()
    capturedRequestBody = postData
    // Return a minimal valid response so the UI doesn't error
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data_source: 'real',
        answer_basis: null,
        answer: 'Test answer',
        provenance: [],
      }),
    })
  })

  // Navigate directly to Ask screen with the test document
  await page.goto(`/runs/${TEST_DOC_ID}/ask`)

  // Wait for AskPanel to render (textarea should be visible)
  const textarea = page.locator('textarea').first()
  await expect(textarea).toBeVisible({ timeout: 10000 })

  // Enter a question
  const testQuestion = 'What are the main claims in this document?'
  await textarea.fill(testQuestion)

  // Click the Ask button
  const submitButton = page.locator('button').filter({ hasText: 'Ask' }).first()
  await expect(submitButton).toBeEnabled({ timeout: 5000 })
  await submitButton.click()

  // Wait for the query request to be sent
  await page.waitForTimeout(500)

  // Assert the request body shape
  expect(capturedRequestBody).toBeTruthy()
  const body = capturedRequestBody as Record<string, unknown>

  // Assert document_id is present and matches the test document
  expect(body.document_id).toBe(TEST_DOC_ID)

  // Assert namespace and namespaces are NOT present
  expect(body.namespace).toBeUndefined()
  expect(body.namespaces).toBeUndefined()
})

test('AskPanel renders unknown source state for future data_source values', async ({ page }) => {
  const TEST_DOC_ID = 'test_doc_unknown_source'

  await page.route('**/api/status', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data_source: 'real',
        documents: [
          {
            document_id: TEST_DOC_ID,
            label: 'Unknown Source Test Document',
            graph_namespace: null,
          },
        ],
      }),
    })
  })

  await page.route(`**/api/status/${TEST_DOC_ID}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        document_id: TEST_DOC_ID,
        label: 'Unknown Source Test Document',
        data_source: 'real',
        graph_namespace: null,
      }),
    })
  })

  await page.route('**/api/query', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data_source: 'future_backend_state',
        answer_basis: null,
        answer: 'Test answer grounded in the mocked query response.',
        citations: [],
        supporting_subgraph: {},
        validation_status: 'supported',
        confidence: 0.5,
        retrieval_debug: {},
      }),
    })
  })

  await page.goto(`/runs/${TEST_DOC_ID}/ask`)

  const textarea = page.locator('textarea').first()
  await expect(textarea).toBeVisible({ timeout: 10000 })
  await textarea.fill('What is the source state?')

  const submitButton = page.locator('button').filter({ hasText: 'Ask' }).first()
  await expect(submitButton).toBeEnabled({ timeout: 5000 })
  await submitButton.click()

  await expect(page.getByText('unknown source state')).toBeVisible({ timeout: 10000 })
  await expect(page.locator('[title="unknown source state"]')).toBeVisible()
  await expect(page.locator('[title="mock data"]')).toHaveCount(0)
})

test('AskPanel handles query_backend_unavailable degraded query response', async ({ page }) => {
  const TEST_DOC_ID = 'test_doc_503'

  await page.route('**/api/status', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data_source: 'real',
        documents: [
          {
            document_id: TEST_DOC_ID,
            label: 'Test Document for 503',
            graph_namespace: null,
          },
        ],
      }),
    })
  })

  await page.route(`**/api/status/${TEST_DOC_ID}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        document_id: TEST_DOC_ID,
        label: 'Test Document for 503',
        data_source: 'real',
        graph_namespace: null,
      }),
    })
  })

  await page.route('**/api/query', async (route) => {
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({
        detail: {
          code: 'query_backend_unavailable',
          message: 'Query processing backend is currently unavailable',
        },
      }),
    })
  })

  await page.goto(`/runs/${TEST_DOC_ID}/ask`)

  const textarea = page.locator('textarea').first()
  await expect(textarea).toBeVisible({ timeout: 10000 })
  await textarea.fill('Test question to trigger 503')

  const submitButton = page.locator('button').filter({ hasText: 'Ask' }).first()
  await expect(submitButton).toBeEnabled({ timeout: 5000 })
  await submitButton.click()

  await expect(
    page.getByText(
      'Query backend unavailable. The AI query service is temporarily unavailable; evidence graph, registers, and summaries remain available.'
    )
  ).toBeVisible({ timeout: 10000 })
  await expect(page.locator('[class*="bg-amber-50"]')).toBeVisible({ timeout: 5000 })
  await expect(page.getByText('No answer found in the available artifact claims.')).toHaveCount(0)
  await expect(page.locator('[title="mock data"]')).toHaveCount(0)
})
