// Cross-screen reconciliation tests — 41 tests
import { test, expect, type APIRequestContext, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { basename, join } from 'node:path'

const testPort = process.env.PLAYWRIGHT_PORT ?? '5173'
const testBaseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${testPort}`
const coreApiBaseURL = (
  process.env.LEGAL_AI_API_BASE_URL ?? process.env.CORE_API_BASE_URL ?? 'http://localhost:8090'
).replace(/\/$/, '')

const REAL_DOC_IDS = ['romancath', 'original_royalcomm', 'volume_10', 'tanyaday', 'hopper']
const DEFAULT_REAL_DOC_ID = 'original_royalcomm'
const MOCK_DOC_ID = 'doc_2026_05_royalcomm'
const MOCK_TITLE = 'Royal Commission — Automated Debt Recovery, Volume 1'
const MOCK_PAGE_COUNT = '4,812'
const QUERY_BACKEND_UNAVAILABLE_COPY =
  'Query backend unavailable. The AI query service is temporarily unavailable; evidence graph, registers, and summaries remain available.'
const LIVE_QUERY_REQUEST_TIMEOUT_MS = 30000
const LIVE_QUERY_RESPONSE_TIMEOUT_MS = 180000

type LiveSummaryProbe = {
  docId: string
  data: { data_source?: string }
}

type LiveEvidenceSeed = {
  docId: string
  namespace: string
  node: string
  registerType: 'authority' | 'events' | 'people'
  graphNodes: number
  graphEdges: number
}

type LiveEvidenceDiscovery =
  | { seed: LiveEvidenceSeed; skipReason?: never }
  | { seed: null; skipReason: string }

type LiveQueryDiscovery =
  | { docId: string; skipReason?: never }
  | { docId: null; skipReason: string }

const LIVE_EVIDENCE_REGISTER_TYPES = ['authority', 'events', 'people'] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

async function getJson(request: APIRequestContext, url: string): Promise<unknown | null> {
  try {
    const targetUrl = url.startsWith('/api/') ? `${coreApiBaseURL}${url}` : url
    const response = await request.get(targetUrl, { timeout: 10000 })
    if (!response.ok()) return null
    return await response.json()
  } catch {
    return null
  }
}

async function verifyLiveGraph(
  request: APIRequestContext,
  namespace: string,
  node: string
): Promise<{ nodes: number; edges: number } | null> {
  const url =
    `/api/graph?namespace=${encodeURIComponent(namespace)}` +
    `&node=${encodeURIComponent(node)}&edge_kinds=entity&depth=2`
  const payload = await getJson(request, url)
  if (!isRecord(payload)) return null
  const nodes = Array.isArray(payload.nodes) ? payload.nodes.length : 0
  const edges = Array.isArray(payload.edges) ? payload.edges.length : 0
  return nodes > 0 ? { nodes, edges } : null
}

function firstRegisterSeed(payload: unknown): string | null {
  if (!isRecord(payload) || !Array.isArray(payload.rows)) return null
  const firstRow = isRecord(payload.rows[0]) ? payload.rows[0] : null
  if (!firstRow || !Array.isArray(firstRow.provenance)) return null
  const firstProvenance = isRecord(firstRow.provenance[0]) ? firstRow.provenance[0] : null
  return firstProvenance ? asString(firstProvenance.chunk_id) : null
}

async function discoverLiveEvidenceSeed(
  request: APIRequestContext
): Promise<LiveEvidenceDiscovery> {
  const statusList = await getJson(request, '/api/status?limit=50')
  if (!isRecord(statusList) || !Array.isArray(statusList.documents)) {
    return {
      seed: null,
      skipReason: 'Core backend unavailable or /api/status returned no document list.',
    }
  }

  const docIds = statusList.documents
    .filter(isRecord)
    .map((doc) => asString(doc.document_id))
    .filter((docId): docId is string => docId !== null && docId !== MOCK_DOC_ID)

  for (const docId of docIds) {
    const status = await getJson(request, `/api/status/${encodeURIComponent(docId)}`)
    if (!isRecord(status)) continue

    const namespace = asString(status.graph_namespace)
    if (!namespace) continue

    for (const registerType of LIVE_EVIDENCE_REGISTER_TYPES) {
      const register = await getJson(
        request,
        `/api/registers/${encodeURIComponent(docId)}?type=${registerType}&limit=5`
      )
      const node = firstRegisterSeed(register)
      if (!node) continue

      const graph = await verifyLiveGraph(request, namespace, node)
      if (graph) {
        return {
          seed: {
            docId,
            namespace,
            node,
            registerType,
            graphNodes: graph.nodes,
            graphEdges: graph.edges,
          },
        }
      }

      break
    }
  }

  return {
    seed: null,
    skipReason:
      'Core backend is live, but no /api/status document had a usable namespace, register seed, and graph response.',
  }
}

async function requireLiveEvidenceSeed(request: APIRequestContext): Promise<LiveEvidenceSeed> {
  const discovery = await discoverLiveEvidenceSeed(request)
  test.skip(discovery.seed === null, discovery.skipReason)
  if (!discovery.seed) throw new Error(discovery.skipReason)
  return discovery.seed
}

async function discoverLiveQueryDocument(request: APIRequestContext): Promise<LiveQueryDiscovery> {
  const statusList = await getJson(request, '/api/status?limit=50')
  if (!isRecord(statusList) || !Array.isArray(statusList.documents)) {
    return {
      docId: null,
      skipReason: 'Core backend unavailable or /api/status returned no document list for AskPanel live query.',
    }
  }

  const docIds = statusList.documents
    .filter(isRecord)
    .map((doc) => ({
      docId: asString(doc.document_id),
      dataSource: asString(doc.data_source),
    }))
    .filter((doc): doc is { docId: string; dataSource: string | null } => {
      return doc.docId !== null && doc.docId !== MOCK_DOC_ID
    })
    .sort((a, b) => Number(b.dataSource === 'real') - Number(a.dataSource === 'real'))
    .map((doc) => doc.docId)

  for (const docId of docIds) {
    const status = await getJson(request, `/api/status/${encodeURIComponent(docId)}`)
    if (isRecord(status)) return { docId }
  }

  return {
    docId: null,
    skipReason: 'Core backend is live, but no status document could be verified for AskPanel live query.',
  }
}

async function requireLiveQueryDocument(request: APIRequestContext): Promise<string> {
  const discovery = await discoverLiveQueryDocument(request)
  test.skip(discovery.docId === null, discovery.skipReason)
  if (!discovery.docId) throw new Error(discovery.skipReason)
  return discovery.docId
}

async function findLiveSummary(request: APIRequestContext): Promise<LiveSummaryProbe | null> {
  for (const docId of REAL_DOC_IDS) {
    try {
      const resp = await request.get(`/api/docs/${encodeURIComponent(docId)}/summary`)
      if (resp.ok()) {
        const data = await resp.json()
        if (data?.data_source === 'real') {
          return { docId, data }
        }
      }
    } catch {
      continue
    }
  }
  return null
}

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

async function mockEvidencePanelDocument(
  page: Page,
  {
    docId = 'test_evidence_doc',
    namespace = 'test_evidence_ns',
    registerRows = [
      {
        id: 'seed-row',
        type: 'authority',
        entity: {},
        provenance: [{ chunk_id: 'test:chunk:1', page_start: 1 }],
      },
    ],
  }: {
    docId?: string
    namespace?: string | null
    registerRows?: unknown[]
  } = {}
): Promise<string> {
  const statusDoc = {
    document_id: docId,
    label: 'Evidence fallback test document',
    data_source: 'real',
    graph_namespace: namespace,
  }

  await page.route(/\/api\/status(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data_source: 'real',
        documents: [statusDoc],
      }),
    })
  })

  await page.route('**/api/packs', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data_source: 'real',
        packs: [
          {
            pack_id: docId,
            name: statusDoc.label,
            document_ids: [docId],
            namespaces: namespace ? [namespace] : [],
            counts: {
              documents: 1,
              claims_total: 0,
              entities_total: 0,
              persons_total: 0,
              events_total: 0,
            },
            data_source: 'real',
            counts_data_source: 'real',
          },
        ],
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

  await page.route(`**/api/registers/${docId}**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        document_id: docId,
        namespace,
        type: 'authority',
        total: registerRows.length,
        data_source: 'real',
        rows: registerRows,
      }),
    })
  })

  await page.route(`**/api/docs/${docId}/summary`, async (route) => {
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ detail: { code: 'summary_not_generated' } }),
    })
  })

  await page.route(`**/api/docs/${docId}/activity`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        document_id: docId,
        data_source: 'real',
        events: [],
      }),
    })
  })

  await page.route(`**/api/docs/${docId}/pipeline`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        document_id: docId,
        data_source: 'real',
        stages: [],
      }),
    })
  })

  await page.route('**/api/fleet', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data_source: 'real',
        hosts: [],
      }),
    })
  })

  return docId
}

async function mockMissingReviewDocument(page: Page, rawId: string): Promise<void> {
  await page.route(`**/api/status/${rawId}`, async (route) => {
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ detail: { code: 'status_not_found' } }),
    })
  })
  await page.route(`**/api/registers/${rawId}**`, async (route) => {
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ detail: { code: 'register_not_found' } }),
    })
  })
  for (const suffix of ['activity', 'summary', 'pipeline']) {
    await page.route(`**/api/docs/${rawId}/${suffix}`, async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ detail: { code: `${suffix}_not_found` } }),
      })
    })
  }
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
    .locator('div', { hasText: /Showing .*real rows?/ })
    .filter({ has: page.locator('[title="real data"]') })
    .first()
  await expect(listHeader).toBeVisible({ timeout: 10000 })
})

test('review chronology sample wording is removed and full real rows reconcile with dashboard', async ({ page }) => {
  const docId = 'hopper'
  const rows = Array.from({ length: 80 }, (_, idx) => ({
    id: `event-${idx + 1}`,
    type: 'events',
    entity: {
      canonical_name: `Real chronology event ${idx + 1}`,
      event_date: `2026-01-${String((idx % 28) + 1).padStart(2, '0')}`,
    },
    provenance: [{ chunk_id: `chunk-${idx + 1}`, page_start: idx + 1 }],
    salience_score: 0.9,
  }))
  const statusDoc = {
    document_id: docId,
    label: 'Hopper full register test document',
    data_source: 'real',
    graph_namespace: 'hopper_ns',
    page_count: 71,
    pipeline_stage: 'completed',
    upload_ts: '2026-07-01T05:50:26.199927+00:00',
    chronology_event_count: 80,
    people_mentioned_count: 0,
    graph_counts: { entities_total: 0, claims_total: 80, data_source: 'real' },
  }

  await page.route(/\/api\/status(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data_source: 'real', documents: [statusDoc] }),
    })
  })
  await page.route(`**/api/status/${docId}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(statusDoc) })
  })
  await page.route(`**/api/registers/${docId}**`, async (route) => {
    const url = new URL(route.request().url())
    const type = url.searchParams.get('type')
    const registerRows = type === 'events' ? rows : []
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        document_id: docId,
        namespace: 'hopper_ns',
        type,
        total: registerRows.length,
        data_source: 'real',
        rows: registerRows,
      }),
    })
  })
  await page.route(`**/api/docs/${docId}/activity`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data_source: 'real', document_id: docId, events: [] }) })
  })
  await page.route(`**/api/docs/${docId}/summary`, async (route) => {
    await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ detail: 'not_found' }) })
  })
  await page.route(`**/api/docs/${docId}/pipeline`, async (route) => {
    await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ detail: 'not_found' }) })
  })
  await page.route('**/api/fleet', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data_source: 'real', hosts: [] }) })
  })
  await page.route('**/api/packs', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data_source: 'real', packs: [] }) })
  })

  await page.goto(`/runs/${docId}`)
  await expect(page.getByText('80 accepted').first()).toBeVisible({ timeout: 10000 })
  await expect(page.getByText('No real activity events yet').first()).toBeVisible()
  await expect(page.getByText('Upload document unavailable').first()).toBeVisible()
  await expect(page.getByText('Archive/Delete unavailable').first()).toBeVisible()

  await page.goto(`/runs/${docId}/chronology`)
  await expect(page.getByText('Showing 80 real rows').first()).toBeVisible({ timeout: 10000 })
  await expect(page.locator('button', { hasText: /All\s+80/ }).first()).toBeVisible()
  await expect(page.getByText('Real chronology event 80')).toBeVisible()
  await expect(page.locator('body')).not.toContainText('sample claims')
  await expect(page.locator('body')).not.toContainText('Full run')
  await expect(page.locator('body')).not.toContainText(/DUMMY DATA/i)
})

test('review chronology status-only totals do not render unavailable backend rows as real data', async ({ page }) => {
  const docId = 'hopper'
  const statusDoc = {
    document_id: docId,
    label: 'Hopper unavailable register test document',
    data_source: 'real',
    graph_namespace: 'hopper_ns',
    page_count: 71,
    pipeline_stage: 'completed',
    upload_ts: '2026-07-01T05:50:26.199927+00:00',
    chronology_event_count: 80,
    people_mentioned_count: 0,
    graph_counts: { entities_total: 0, claims_total: 80, data_source: 'real' },
  }

  await page.route(/\/api\/status(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data_source: 'real', documents: [statusDoc] }),
    })
  })
  await page.route(`**/api/status/${docId}`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(statusDoc) })
  })
  await page.route(`**/api/registers/${docId}**`, async (route) => {
    await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ detail: 'register_not_found' }) })
  })
  for (const suffix of ['activity', 'summary', 'pipeline']) {
    await page.route(`**/api/docs/${docId}/${suffix}`, async (route) => {
      await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ detail: `${suffix}_not_found` }) })
    })
  }
  await page.route('**/api/fleet', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data_source: 'real', hosts: [] }) })
  })
  await page.route('**/api/packs', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data_source: 'real', packs: [] }) })
  })

  await page.goto(`/runs/${docId}/chronology`)
  await expect(page.getByText('No real chronology rows available yet.').first()).toBeVisible({ timeout: 10000 })
  await expect(page.locator('button', { hasText: /All\s+0/ }).first()).toBeVisible()
  await expect(page.getByText('Upload document unavailable').first()).toBeVisible()
  await expect(page.getByText('Archive/Delete unavailable').first()).toBeVisible()
  await expect(page.locator('body')).not.toContainText('80 accepted')
  await expect(page.locator('body')).not.toContainText('sample claims')
  await expect(page.locator('body')).not.toContainText('Full run')
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

  await page.route(/\/api\/status(?:\?.*)?$/, async (route) => {
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

test('lattice KPI source badges show unavailable when metric source fields are omitted', async ({ page }) => {
  const docId = 'test_doc_metric_sources'
  const statusDoc = {
    document_id: docId,
    label: 'Metric source test document',
    graph_namespace: 'metric_source_ns',
    page_count: 4,
    pipeline_stage: 'completed',
    upload_ts: '2026-06-29T00:00:00Z',
    chronology_event_count: 12,
    people_mentioned_count: 5,
    graph_counts: {
      claims_total: 20,
      entities_total: 7,
      data_source: 'real',
    },
    kpi_metrics: {
      open_conflicts: 2,
      open_conflicts_data_source: null,
      human_queue: 3,
      human_queue_data_source: null,
      jaccard: 0.42,
      jaccard_data_source: null,
      claims_disputed: 1,
      claims_disputed_data_source: null,
    },
  }

  await page.route(`**/api/status/${docId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(statusDoc),
    })
  })

  await page.goto(`/runs/${docId}`)
  await page.locator('button', { hasText: 'Sources' }).first().click()

  for (const label of ['Conflicts', 'Human queue', 'Agreement Chronology', 'Agreement People', 'Agreement Entity']) {
    const sourceLabel = page.locator(`[data-source-label="${label}"]`)
    await expect(sourceLabel.locator('[title="source unavailable"]')).toBeVisible({ timeout: 10000 })
    await expect(sourceLabel.locator('[title="mock data"]')).toHaveCount(0)
  }
})

test('live EvidencePanel graph panel loads with discovered real data', async ({ page, request }) => {
  const seed = await requireLiveEvidenceSeed(request)

  // Navigate directly to evidence view
  await page.goto(`/runs/${seed.docId}/evidence`)
  await expect(page.getByRole('heading', { name: 'Evidence graph', exact: true })).toBeVisible({
    timeout: 30000,
  })

  // The panel should show a heading or content — not the old stub text
  const bodyText = await page.locator('body').innerText()
  expect(bodyText).not.toContain('Evidence inspector (stub)')
  expect(bodyText).not.toContain('Evidence graph unavailable')
  await expect(page.locator('[title="mock data"]')).toHaveCount(0)

  // Should show back navigation
  const backBtn = page.locator('button', { hasText: /Back/ }).first()
  await expect(backBtn).toBeVisible()

  // Clicking back should return to monitor
  await backBtn.click()
  await expect(page).toHaveURL(new RegExp(`/runs/${seed.docId}$`))
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

test('live EvidencePanel relationship graph card navigates to discovered evidence view', async ({ page, request }) => {
  const seed = await requireLiveEvidenceSeed(request)

  await page.goto(`/runs/${seed.docId}`)
  const graphCard = page.locator('button', { hasText: /Relationship graph|View graph/ }).first()
  await expect(graphCard).toBeVisible({ timeout: 10000 })
  await graphCard.click()

  await expect(page).toHaveURL(new RegExp(`/runs/${seed.docId}/evidence`), { timeout: 10000 })
  await expect(page.getByRole('heading', { name: 'Evidence graph', exact: true })).toBeVisible({
    timeout: 30000,
  })
  const bodyText = await page.locator('body').innerText()
  expect(bodyText).not.toContain('Evidence inspector (stub)')
})

test('live EvidencePanel atrium graph button navigates to discovered evidence view', async ({ page, request }) => {
  const seed = await requireLiveEvidenceSeed(request)

  await page.goto(`/runs/${seed.docId}/chronology`)
  await page.waitForTimeout(1000)

  const graphBtn = page.locator('button', { hasText: /^Graph/ }).first()
  await expect(graphBtn).toBeVisible({ timeout: 10000 })
  await graphBtn.click()

  await expect(page).toHaveURL(new RegExp(`/runs/${seed.docId}/evidence`), { timeout: 10000 })
  await expect(page.getByRole('heading', { name: 'Evidence graph', exact: true })).toBeVisible({
    timeout: 30000,
  })
  const backBtn = page.locator('button', { hasText: /Back/ }).first()
  await expect(backBtn).toBeVisible()
})

test('live EvidencePanel shows depth selector buttons for discovered graph seed', async ({ page, request }) => {
  const seed = await requireLiveEvidenceSeed(request)

  await page.goto(`/runs/${seed.docId}/evidence`)
  await expect(page.getByRole('heading', { name: 'Evidence graph', exact: true })).toBeVisible({
    timeout: 30000,
  })

  const hopBtn = page.locator('button', { hasText: /hop/i }).first()
  await expect(hopBtn).toBeVisible()
})

test('live EvidencePanel back button returns to discovered document monitor', async ({ page, request }) => {
  const seed = await requireLiveEvidenceSeed(request)

  await page.goto(`/runs/${seed.docId}/evidence`)
  await expect(page.getByRole('heading', { name: 'Evidence graph', exact: true })).toBeVisible({
    timeout: 30000,
  })
  await expect(page.locator('button', { hasText: /Back/i })).toBeVisible({ timeout: 30000 })

  await page.locator('button', { hasText: /Back/i }).click()
  await expect(page).toHaveURL(new RegExp(`/runs/${seed.docId}$`))
})

test('live EvidencePanel requests api/graph endpoint for discovered graph seed', async ({ page, request }) => {
  const seed = await requireLiveEvidenceSeed(request)

  let capturedUrl: string | null = null
  await page.route('**/api/graph**', (route) => {
    capturedUrl = route.request().url()
    route.continue()
  })

  await page.goto(`/runs/${seed.docId}/evidence`)
  await expect(page.getByRole('heading', { name: 'Evidence graph', exact: true })).toBeVisible({
    timeout: 30000,
  })

  if (capturedUrl === null) throw new Error('EvidencePanel did not request /api/graph')
  const graphUrl = new URL(capturedUrl)
  expect(graphUrl.searchParams.get('namespace')).toBe(seed.namespace)
  expect(graphUrl.searchParams.get('node')).toBe(seed.node)
})

test('register row opens graph workbench with provenance seed', async ({ page }) => {
  const docId = await mockEvidencePanelDocument(page, {
    docId: 'test_register_graph_link',
    registerRows: [
      {
        id: 'row-node-1',
        type: 'authority',
        entity: { canonical_name: 'Graph linked authority', name: 'Graph linked authority' },
        provenance: [{ chunk_id: 'graph:seed:42', page_start: 9 }],
        salience_score: 0.91,
      },
    ],
  })

  await page.route('**/api/graph**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        namespace: 'test_evidence_ns',
        document_id: docId,
        root_node_id: 'graph:seed:42',
        depth: 2,
        edge_kinds: new URL(route.request().url()).searchParams.get('edge_kinds') ?? 'entity',
        data_source: 'real',
        nodes: [
          {
            id: 'graph:seed:42',
            labels: ['AUTHORITY'],
            primary_type: 'AUTHORITY',
            display_name: 'Graph linked authority',
            properties: {},
          },
          {
            id: 'graph:related:1',
            labels: ['CLAIM'],
            primary_type: 'CLAIM',
            display_name: 'Related claim',
            properties: {},
          },
        ],
        edges: [
          {
            id: 'edge:seed-related',
            source: 'graph:seed:42',
            target: 'graph:related:1',
            type: 'ABOUT',
            key_props: { method: 'relationship_enrichment' },
            provenance: { chunk_id: 'graph:seed:42', page_start: 9 },
            properties: {},
          },
        ],
      }),
    })
  })

  await page.goto(`/runs/${docId}/entities`)
  await expect(page.getByText('Graph linked authority').first()).toBeVisible({ timeout: 10000 })

  const graphRequest = page.waitForRequest((request) => request.url().includes('/api/graph'))
  await page.getByRole('button', { name: 'View graph' }).first().click()
  const initialRequest = await graphRequest

  await expect(page).toHaveURL(new RegExp(`/runs/${docId}/evidence`), { timeout: 10000 })
  await expect(page.getByRole('heading', { name: 'Evidence graph', exact: true })).toBeVisible({
    timeout: 10000,
  })

  const initialGraphUrl = new URL(initialRequest.url())
  expect(initialGraphUrl.searchParams.get('node')).toBe('graph:seed:42')
  expect(initialGraphUrl.searchParams.get('edge_kinds')).toBe('entity')
  await expect(page.locator('[title="mock data"]')).toHaveCount(0)

  const provenanceRequest = page.waitForRequest((request) => {
    if (!request.url().includes('/api/graph')) return false
    return new URL(request.url()).searchParams.get('edge_kinds') === 'provenance'
  })
  await page.getByRole('button', { name: 'provenance' }).click()
  await provenanceRequest
})

test('operator monitor exposes dedicated GraphRAG workbench entry point', async ({ page }) => {
  const docId = await mockEvidencePanelDocument(page, {
    docId: 'test_operator_graphrag_entry',
    namespace: 'operator_graph_ns',
  })

  await page.route('**/api/graph**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        namespace: 'operator_graph_ns',
        document_id: docId,
        root_node_id: 'test:chunk:1',
        depth: 2,
        edge_kinds: 'entity',
        data_source: 'real',
        nodes: [
          {
            id: 'test:chunk:1',
            labels: ['EVIDENCE'],
            primary_type: 'EVIDENCE',
            display_name: 'Operator graph seed',
            properties: {},
          },
        ],
        edges: [],
      }),
    })
  })

  await page.goto(`/runs/${docId}`)
  await expect(page.getByRole('button', { name: /GraphRAG/i })).toBeVisible({ timeout: 10000 })

  const graphRequest = page.waitForRequest((request) => request.url().includes('/api/graph'))
  await page.getByRole('button', { name: /GraphRAG/i }).click()
  await graphRequest

  await expect(page).toHaveURL(new RegExp(`/runs/${docId}/evidence`), { timeout: 10000 })
  await expect(page.getByText('GraphRAG workbench · matter graph')).toBeVisible({ timeout: 10000 })
  await expect(page.getByRole('heading', { name: 'Evidence graph', exact: true })).toBeVisible()
})

test('EvidencePanel graph fallback shows unavailable when namespace is missing', async ({ page }) => {
  const docId = await mockEvidencePanelDocument(page, {
    docId: 'test_evidence_no_namespace',
    namespace: null,
  })
  let graphCalled = false

  await page.route('**/api/graph**', async (route) => {
    graphCalled = true
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ detail: { code: 'unexpected_graph_call' } }),
    })
  })

  await page.goto(`/runs/${docId}/evidence`)

  await expect(page.getByText('Evidence graph unavailable')).toBeVisible({ timeout: 10000 })
  await expect(page.getByText('No graph namespace is available for this document.')).toBeVisible()
  await expect(page.locator('[title="source unavailable"]')).toBeVisible()
  await expect(page.locator('canvas')).toHaveCount(0)
  expect(graphCalled).toBe(false)
})

test('EvidencePanel graph fallback shows unavailable when no seed can be resolved', async ({ page }) => {
  const docId = await mockEvidencePanelDocument(page, {
    docId: 'test_evidence_no_seed',
    registerRows: [],
  })
  let graphCalled = false

  await page.route('**/api/graph**', async (route) => {
    graphCalled = true
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ detail: { code: 'unexpected_graph_call' } }),
    })
  })

  await page.goto(`/runs/${docId}/evidence`)

  await expect(page.getByText('Evidence graph unavailable')).toBeVisible({ timeout: 10000 })
  await expect(page.getByText('No graph seed could be resolved for this item.')).toBeVisible()
  await expect(page.locator('[title="source unavailable"]')).toBeVisible()
  await expect(page.locator('canvas')).toHaveCount(0)
  expect(graphCalled).toBe(false)
})

test('EvidencePanel graph fallback handles graph endpoint 404', async ({ page }) => {
  const docId = await mockEvidencePanelDocument(page, { docId: 'test_evidence_graph_404' })

  await page.route('**/api/graph**', async (route) => {
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ detail: { code: 'graph_not_found' } }),
    })
  })

  await page.goto(`/runs/${docId}/evidence`)

  await expect(page.getByText('Evidence graph unavailable')).toBeVisible({ timeout: 10000 })
  await expect(
    page.getByText('The evidence graph endpoint did not return usable graph data.')
  ).toBeVisible()
  await expect(page.locator('[title="source unavailable"]')).toBeVisible()
  await expect(page.locator('canvas')).toHaveCount(0)
})

test('EvidencePanel graph fallback handles empty graph responses', async ({ page }) => {
  const docId = await mockEvidencePanelDocument(page, { docId: 'test_evidence_empty_graph' })

  await page.route('**/api/graph**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data_source: 'real',
        nodes: [],
        edges: [],
      }),
    })
  })

  await page.goto(`/runs/${docId}/evidence`)

  await expect(page.getByText('Evidence graph unavailable')).toBeVisible({ timeout: 10000 })
  await expect(
    page.getByText('The evidence graph endpoint returned no graph nodes for this item.')
  ).toBeVisible()
  await expect(page.locator('[title="source unavailable"]')).toBeVisible()
  await expect(page.locator('canvas')).toHaveCount(0)
})

test('EvidencePanel renders unknown graph source state without mock badge', async ({ page }) => {
  const docId = await mockEvidencePanelDocument(page, { docId: 'test_evidence_unknown_source' })

  await page.route('**/api/graph**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data_source: 'future_graph_source',
        nodes: [
          {
            id: 'node:a',
            display_name: 'Node A',
            primary_type: 'PERSON',
            salience_score: 0.8,
          },
          {
            id: 'node:b',
            display_name: 'Node B',
            primary_type: 'EVENT',
            salience_score: 0.6,
          },
        ],
        edges: [
          {
            id: 'edge:a-b',
            source: 'node:a',
            target: 'node:b',
            type: 'SUPPORTED_BY',
            key_props: {},
            provenance: {},
          },
        ],
      }),
    })
  })

  await page.goto(`/runs/${docId}/evidence`)

  await expect(page.getByRole('heading', { name: 'Evidence graph' })).toBeVisible({
    timeout: 10000,
  })
  await expect(page.getByText('unknown source state')).toBeVisible()
  await expect(page.locator('header [title="unknown source state"]')).toBeVisible()
  await expect(page.locator('[title="mock data"]')).toHaveCount(0)
})

const STATIC_LAWYER_URL = `${testBaseURL}/static/lawyer.html`
const STATIC_OPERATOR_URL = `${testBaseURL}/static/operator.html`
const STATIC_DIR = join(process.cwd(), 'static')

async function serveStaticJsxAsRaw(page: Page): Promise<void> {
  await page.route('**/static/*.jsx', async (route) => {
    const fileName = basename(new URL(route.request().url()).pathname)
    await route.fulfill({
      status: 200,
      contentType: 'text/babel',
      body: readFileSync(join(STATIC_DIR, fileName), 'utf8'),
    })
  })
}

async function serveStaticLawyerJsxAsRaw(page: Page): Promise<void> {
  await serveStaticJsxAsRaw(page)
}

async function mockStaticOperatorApi(page: Page, overrides: Record<string, unknown> = {}) {
  const docId = (overrides.docId as string) || 'static_operator_doc'
  const status = {
    document_id: docId,
    label: 'Static Operator Matter',
    data_source: 'real',
    graph_namespace: 'static_operator_ns',
    pipeline_stage: 'running',
    chronology_status: 'completed',
    people_mentioned_status: 'running',
    individuals_status: 'queued',
    page_count: 12,
    upload_ts: '2026-06-29T22:00:00Z',
    total_chunks: 10,
    chunks_completed: 7,
    chunks_in_progress: 2,
    chronology_event_count: 3,
    people_mentioned_count: 2,
    graph_counts: {
      chunks_total: 4,
      claims_total: 8,
      entities_total: 5,
      persons_total: 2,
      events_total: 3,
      data_source: 'real',
    },
    activity: [
      {
        ts: '2026-06-30T00:30:00Z',
        type: 'SYSTEM',
        source: 'system',
        msg: 'Operator parsed chunks indexed',
      },
    ],
    ...(overrides.status as Record<string, unknown> | undefined),
  }

  await page.route('**/api/status**', async (route) => {
    const url = new URL(route.request().url())
    if (url.pathname === '/api/status') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data_source: 'real', documents: [status] }),
      })
      return
    }
    if (url.pathname.startsWith('/api/status/')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(status),
      })
      return
    }
    await route.fallback()
  })

  await page.route('**/api/fleet', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data_source: 'real',
        hosts: [
          {
            name: 'alienware',
            display_name: 'Alienware',
            base_url: 'http://alienware:8010',
            model: 'qwen36-35b-a3b-gptq',
            configured_model: 'qwen36-35b-a3b-gptq',
            actual_model: null,
            up: false,
            role: 'query model',
            running: null,
            waiting: null,
            gpu_cache_pct: null,
            generation_tokens_total: null,
            unavailable_reason: 'metrics_unreachable',
          },
          {
            name: 'gb10a',
            display_name: 'GB10A',
            base_url: 'http://gb10a:8000',
            model: 'qwen',
            configured_model: 'qwen',
            actual_model: 'qwen',
            up: true,
            running: 1,
            waiting: 0,
            gpu_cache_pct: 12,
            generation_tokens_total: 120000,
          },
        ],
      }),
    })
  })

  await page.route('**/api/registers/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data_source: 'real', rows: [] }),
    })
  })
  await page.route('**/api/docs/*/feedback', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ adjudications: [] }),
    })
  })

  return docId
}

async function mockStaticLawyerMatter(page: Page, docId = 'static_export_doc') {
  await page.route('**/api/matters', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data_source: 'real',
        matters: [{ id: docId, title: 'Static Export Matter', namespace: 'static_export_ns' }],
      }),
    })
  })
  await page.route(`**/api/status/${docId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        document_id: docId,
        label: 'Static Export Matter',
        data_source: 'real',
        graph_namespace: 'static_export_ns',
        graph_counts: { claims_total: 1, entities_total: 1, data_source: 'real' },
      }),
    })
  })
  await page.route(`**/api/registers/${docId}**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data_source: 'real', rows: [] }),
    })
  })
  await page.route(`**/api/docs/${docId}/feedback`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ adjudications: [] }),
    })
  })
}

test('canonical review route normalizes uploaded Hopper run id and exposes review links', async ({ page }) => {
  const rawId = 'ui-original_hca_hopper_v_vic-20260701T054753Z-01'
  const docId = await mockEvidencePanelDocument(page, {
    docId: 'hopper',
    namespace: 'mdoc20260621_hopper',
  })
  await mockMissingReviewDocument(page, rawId)

  await page.goto(`/runs/${rawId}`)

  await expect(page).toHaveURL(new RegExp(`/runs/${docId}$`))
  await expect(page.getByRole('link', { name: 'Operator review' })).toHaveAttribute('href', `/runs/${docId}`)
  await expect(page.getByRole('link', { name: 'Lawyer review' })).toHaveAttribute(
    'href',
    `/runs/${docId}/chronology`
  )
  await expect(page.getByRole('link', { name: 'Evidence graph' })).toHaveAttribute(
    'href',
    `/runs/${docId}/evidence`
  )
  await expect(page.getByRole('link', { name: 'Ask' })).toHaveAttribute('href', `/runs/${docId}/ask`)

  const bodyText = await page.locator('body').innerText()
  expect(bodyText).not.toContain(MOCK_TITLE)
  expect(bodyText).not.toContain('Smith Holdings')
})

test('upload completion route resolves canonical document id from Core status list', async ({ page }) => {
  const rawId = 'ui-original_custom_case-20260701T000000Z-01'
  const docId = await mockEvidencePanelDocument(page, {
    docId: 'custom_case',
    namespace: 'mdoc20260621_custom_case',
  })
  await mockMissingReviewDocument(page, rawId)

  await page.goto(`/runs/${rawId}`)

  await expect(page).toHaveURL(new RegExp(`/runs/${docId}$`))
  await expect(page.getByRole('link', { name: 'Operator review' })).toHaveAttribute('href', `/runs/${docId}`)
  await expect(page.getByRole('link', { name: 'Lawyer review' })).toHaveAttribute(
    'href',
    `/runs/${docId}/chronology`
  )
  await expect(page.getByRole('link', { name: 'Evidence graph' })).toHaveAttribute(
    'href',
    `/runs/${docId}/evidence`
  )
  await expect(page.getByRole('link', { name: 'Ask' })).toHaveAttribute('href', `/runs/${docId}/ask`)
})

test('canonical Hopper route binds to live raw backend upload id without changing URL', async ({ page }) => {
  const rawId = 'ui-original_hca_hopper_v_vic-20260701T054753Z-01'
  await page.route('**/api/status/hopper', async (route) => {
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ detail: { code: 'status_not_found' } }),
    })
  })
  await page.route('**/api/registers/hopper**', async (route) => {
    await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ detail: 'not_found' }) })
  })
  for (const suffix of ['activity', 'summary', 'pipeline']) {
    await page.route(`**/api/docs/hopper/${suffix}`, async (route) => {
      await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ detail: 'not_found' }) })
    })
  }
  await page.route(/\/api\/status(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data_source: 'real',
        documents: [
          {
            document_id: rawId,
            label: 'original_hca_Hopper_v_Vic.pdf',
            page_count: 71,
            pipeline_stage: 'failed',
            upload_ts: '2026-07-01T05:50:26.199927+00:00',
            total_chunks: 0,
            chunks_completed: 0,
          },
        ],
      }),
    })
  })
  await page.route(`**/api/status/${rawId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        document_id: rawId,
        label: 'original_hca_Hopper_v_Vic.pdf',
        page_count: 71,
        pipeline_stage: 'failed',
        upload_ts: '2026-07-01T05:50:26.199927+00:00',
        total_chunks: 0,
        chunks_completed: 0,
      }),
    })
  })
  await page.route(`**/api/registers/${rawId}**`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data_source: 'real', rows: [] }) })
  })
  await page.route(`**/api/docs/${rawId}/activity`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data_source: 'real', document_id: rawId, events: [] }) })
  })
  await page.route(`**/api/docs/${rawId}/summary`, async (route) => {
    await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ detail: 'not_found' }) })
  })
  await page.route(`**/api/docs/${rawId}/pipeline`, async (route) => {
    await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ detail: 'not_found' }) })
  })
  await page.route('**/api/fleet', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data_source: 'real', hosts: [] }) })
  })

  await page.goto('/runs/hopper')

  await expect(page).toHaveURL(/\/runs\/hopper$/)
  await expect(page.getByRole('link', { name: 'Operator review' })).toHaveAttribute('href', '/runs/hopper')
  await expect(page.getByRole('link', { name: 'Lawyer review' })).toHaveAttribute('href', '/runs/hopper/chronology')
  await expect(page.getByRole('link', { name: 'Evidence graph' })).toHaveAttribute('href', '/runs/hopper/evidence')
  await expect(page.getByRole('link', { name: 'Ask' })).toHaveAttribute('href', '/runs/hopper/ask')
  await expect(page.getByText('No real activity events yet').first()).toBeVisible()

  const bodyText = await page.locator('body').innerText()
  expect(bodyText).toContain('original_hca_Hopper_v_Vic.pdf')
  expect(bodyText).not.toContain('Smith Holdings')
  expect(bodyText).not.toContain('SGLang cache')
  expect(bodyText).not.toContain('Workflow')
})

test('unknown upload id stays unresolved without seeded review data', async ({ page }) => {
  const rawId = 'ui-original_unknown_matter-20260701T000000Z-01'
  await mockMissingReviewDocument(page, rawId)
  await page.route(/\/api\/status(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data_source: 'real',
        documents: [{ document_id: 'hopper', label: 'Hopper', graph_namespace: 'mdoc20260621_hopper' }],
      }),
    })
  })
  await page.route('**/api/packs', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data_source: 'real', packs: [] }) })
  })
  await page.route('**/api/fleet', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data_source: 'real', hosts: [] }) })
  })

  await page.goto(`/runs/${rawId}`)

  await expect(page).toHaveURL(new RegExp(`/runs/${rawId}$`))
  await expect(page.getByRole('status')).toContainText('Unable to resolve upload id to a backend document')
  await expect(page.getByText('No real activity events yet').first()).toBeVisible()
  await page.waitForTimeout(5500)
  await expect(page.getByText('No real activity events yet').first()).toBeVisible()

  const bodyText = await page.locator('body').innerText()
  expect(bodyText).not.toContain(MOCK_TITLE)
  expect(bodyText).not.toContain('Smith Holdings')
  expect(bodyText).not.toContain('ZZ_DUMMY_ACTIVITY_')
})

test('canonical review activity stays empty when no real activity exists', async ({ page }) => {
  const docId = await mockEvidencePanelDocument(page, {
    docId: 'hopper',
    namespace: 'mdoc20260621_hopper',
  })

  await page.goto(`/runs/${docId}`)

  await expect(page.getByText('No real activity events yet').first()).toBeVisible()
  await page.waitForTimeout(5500)
  await expect(page.getByText('No real activity events yet').first()).toBeVisible()
  const activityPanel = page
    .getByRole('heading', { name: 'Activity log - real events' })
    .locator('xpath=ancestor::div[contains(@class, "rounded-lg")][1]')
  await expect(activityPanel.locator('[title="simulated data"]')).toHaveCount(0)
  await expect(page.getByText(/ZZ_DUMMY_ACTIVITY_/)).toHaveCount(0)
})

test('legacy static review pages are labelled and link back to canonical routes', async ({ page }) => {
  await serveStaticJsxAsRaw(page)
  await mockStaticOperatorApi(page, { docId: 'static_operator_doc' })

  await page.goto(`${STATIC_OPERATOR_URL}#doc=static_operator_doc`)
  await expect(page.getByText('LEGACY STATIC VIEW - use canonical review route for live review')).toBeVisible({
    timeout: 15000,
  })
  await expect(page.getByRole('link', { name: 'Open canonical operator review' })).toHaveAttribute(
    'href',
    '/runs/static_operator_doc'
  )
  await expect(page.getByRole('link', { name: 'Open canonical lawyer review' })).toHaveAttribute(
    'href',
    '/runs/static_operator_doc/chronology'
  )

  await mockStaticLawyerMatter(page, 'static_lawyer_doc')
  await page.goto(`${STATIC_LAWYER_URL}#doc=static_lawyer_doc`)
  await expect(page.getByText('LEGACY STATIC VIEW - use canonical review route for live review')).toBeVisible({
    timeout: 15000,
  })
  await expect(page.getByRole('link', { name: 'Open canonical lawyer review' })).toHaveAttribute(
    'href',
    '/runs/static_lawyer_doc/chronology'
  )
  await expect(page.getByRole('link', { name: 'Open canonical operator review' })).toHaveAttribute(
    'href',
    '/runs/static_lawyer_doc'
  )
})

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
  const docId = 'static_chronology_doc'

  await page.route('**/api/matters', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data_source: 'real',
        matters: [{ id: docId, title: 'Static Chronology Matter', namespace: 'static_chronology_ns' }],
      }),
    })
  })
  await page.route(`**/api/status/${docId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        document_id: docId,
        label: 'Static Chronology Matter',
        data_source: 'real',
        graph_namespace: 'static_chronology_ns',
        chronology_event_count: 1,
        graph_counts: { claims_total: 1, entities_total: 1, data_source: 'real' },
      }),
    })
  })
  await page.route(`**/api/registers/${docId}?type=events**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data_source: 'real',
        rows: [
          {
            id: 'event:test',
            salience_score: 0.91,
            entity: {
              event_date_iso: '2026-06-29',
              event_description: 'Mocked chronology event',
              validation_status: 'real',
            },
            provenance: [{ chunk_id: 'chunk:test', page_start: 1 }],
          },
        ],
      }),
    })
  })
  await page.route(`**/api/docs/${docId}/feedback`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ adjudications: [] }),
    })
  })

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

test('static lawyer legacy trace and upload seams are unavailable', async ({ page }) => {
  await serveStaticLawyerJsxAsRaw(page)
  const docId = 'static_unavailable_doc'
  let uploadCalled = false
  let traceCalled = false

  await page.route('**/api/matters', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data_source: 'real',
        matters: [{ id: docId, title: 'Static Unavailable Matter', namespace: 'static_unavailable_ns' }],
      }),
    })
  })
  await page.route(`**/api/status/${docId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        document_id: docId,
        label: 'Static Unavailable Matter',
        data_source: 'real',
        graph_namespace: 'static_unavailable_ns',
      }),
    })
  })
  await page.route(`**/api/registers/${docId}**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data_source: 'real', rows: [] }),
    })
  })
  await page.route(`**/api/docs/${docId}/feedback`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ adjudications: [] }),
    })
  })
  await page.route('**/api/upload', async (route) => {
    uploadCalled = true
    await route.fulfill({ status: 500, body: '{}' })
  })
  await page.route('**/api/docs/*/trace', async (route) => {
    traceCalled = true
    await route.fulfill({ status: 500, body: '{}' })
  })

  await page.goto(STATIC_LAWYER_URL)
  await waitForStaticLawyerMatterList(page)

  await page.getByRole('button', { name: /Upload a document/i }).click()
  await expect(page.getByText('Document upload unavailable')).toBeVisible({ timeout: 10000 })
  await expect(page.getByText(/Upload is unavailable in this static lawyer build/i)).toBeVisible()
  await expect(page.locator('input[type="file"]')).toHaveCount(0)
  await page.getByRole('button', { name: 'Close' }).click()

  await firstStaticLawyerSidebarItem(page).click()
  const tracePanel = page.locator('details[data-panel-id*="trace-debug"]').first()
  await expect(tracePanel).toBeVisible({ timeout: 10000 })
  await tracePanel.locator('summary').click()
  await expect(page.getByText('Trace debugging is unavailable in static mode.')).toBeVisible()

  expect(uploadCalled).toBe(false)
  expect(traceCalled).toBe(false)
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
      QUERY_BACKEND_UNAVAILABLE_COPY
    )
  ).toBeVisible({ timeout: 10000 })
  await expect(page.getByText('No answer found in the available artifact claims.')).toHaveCount(0)
  await expect(page.locator('.lw-chat-source')).toHaveCount(0)
})

test('static operator shows honest pipeline counters and fleet unavailable state', async ({ page }) => {
  await serveStaticJsxAsRaw(page)
  await mockStaticOperatorApi(page)

  await page.goto(STATIC_OPERATOR_URL)

  await expect(page.getByRole('heading', { name: /Pipeline stages/i })).toBeVisible({ timeout: 15000 })
  await expect(page.locator('.l-kpi').filter({ hasText: 'Parse/OCR' })).toContainText('7/10')
  await expect(page.locator('.l-kpi').filter({ hasText: 'Chunk/Index' })).toContainText('4/10')
  await expect(page.locator('tr', { hasText: 'Parse/OCR' })).toContainText('7/10')
  await expect(page.locator('tr', { hasText: 'Chunk/Index' })).toContainText('4/10')
  await expect(page.locator('tr', { hasText: 'Chronology' }).getByRole('button', { name: 'Open' })).toBeVisible()
  await expect(page.locator('tr', { hasText: 'Parse/OCR' })).toContainText('No detail')
  await expect(page.getByText(/Alienware.*unreachable/)).toBeVisible()
  await expect(page.getByText(/tokens unavailable/).first()).toBeVisible()
  await expect(page.locator('.l-hw-cell').filter({ hasText: 'GB10A' })).toContainText(/tokens total/)
  await expect(page.locator('.l-hw-cell').filter({ hasText: 'Alienware' })).toContainText(/tokens unavailable/)
  await expect(page.locator('.l-kpi').filter({ hasText: 'Gen Tokens' })).toContainText('120k')
  await expect(page.locator('.l-kpi').filter({ hasText: 'Gen Tokens' })).toContainText('1 host')
})

test('static operator exposes GraphRAG workbench entry point', async ({ page }) => {
  await serveStaticJsxAsRaw(page)
  const docId = await mockStaticOperatorApi(page)

  await page.goto(STATIC_OPERATOR_URL)

  const graphEntry = page.getByRole('button', { name: /GraphRAG/i })
  await expect(graphEntry).toBeVisible({ timeout: 15000 })
  await expect(graphEntry).toContainText('real graph namespace')

  await graphEntry.click()
  await expect(page).toHaveURL(new RegExp(`/static/operator\\.html#view=evidence&doc=${docId}`))
  await expect(page.getByText('GraphRAG workbench')).toBeVisible({ timeout: 10000 })
  await expect(page.getByRole('heading', { name: 'Matter graph' })).toBeVisible()
  await expect(page.getByText('graph namespace: static_operator_ns')).toBeVisible()
  await expect(page.getByRole('link', { name: /Open full graph workbench/i })).toHaveAttribute(
    'href',
    `/runs/${docId}/evidence`
  )
})

test('static operator GraphRAG entry reports unavailable namespace honestly', async ({ page }) => {
  await serveStaticJsxAsRaw(page)
  const docId = await mockStaticOperatorApi(page, {
    status: { graph_namespace: null },
  })

  await page.goto(STATIC_OPERATOR_URL)

  const graphEntry = page.getByRole('button', { name: /GraphRAG/i })
  await expect(graphEntry).toBeVisible({ timeout: 15000 })
  await expect(graphEntry).toContainText('graph unavailable')

  await graphEntry.click()
  await expect(page).toHaveURL(new RegExp(`/static/operator\\.html#view=evidence&doc=${docId}`))
  await expect(page.getByText('Graph unavailable until Core reports a graph namespace for this document.')).toBeVisible({
    timeout: 10000,
  })
  await expect(page.getByRole('link', { name: /Open full graph workbench/i })).toHaveCount(0)
})

test('static operator browser back stays in operator context after pipeline drill-down', async ({ page }) => {
  await serveStaticJsxAsRaw(page)
  const docId = await mockStaticOperatorApi(page)

  await page.goto(STATIC_OPERATOR_URL)
  await expect(page.getByRole('heading', { name: /Pipeline stages/i })).toBeVisible({ timeout: 15000 })

  await page.locator('tr', { hasText: 'Chronology' }).getByRole('button', { name: 'Open' }).click()
  await expect(page).toHaveURL(new RegExp(`/static/operator\\.html#view=chronology&doc=${docId}`))
  await expect(page.getByRole('button', { name: /Monitor/i })).toBeVisible({ timeout: 10000 })

  await page.goBack()
  await page.waitForFunction(() => {
    return window.location.pathname.endsWith('/static/operator.html') && !window.location.hash.includes('view=')
  })
  expect(page.url()).toContain('/static/operator.html')
  expect(page.url()).not.toContain('lawyer.html')
  await expect(page.getByRole('heading', { name: /Pipeline stages/i })).toBeVisible({ timeout: 10000 })
})

test.describe('static operator local timezone', () => {
  test.use({ timezoneId: 'Australia/Melbourne' })

  test('static operator activity timestamps display browser local timezone', async ({ page }) => {
    await serveStaticJsxAsRaw(page)
    await mockStaticOperatorApi(page)

    await page.goto(STATIC_OPERATOR_URL)

    const row = page.locator('.l-act-row').filter({ hasText: 'Operator parsed chunks indexed' }).first()
    await expect(row).toBeVisible({ timeout: 15000 })
    await expect(row).toContainText(/10:30/)
    await expect(row).toContainText(/AEST|GMT\+10|UTC\+10/)
    await expect(row).not.toContainText('2026-06-30T00:30:00Z')
    await expect(row.locator('[title="2026-06-30T00:30:00.000Z"]')).toHaveCount(1)
  })
})

test('static lawyer export actions show explicit unavailable state', async ({ page }) => {
  await serveStaticLawyerJsxAsRaw(page)
  await mockStaticLawyerMatter(page)

  await page.goto(STATIC_LAWYER_URL)
  await waitForStaticLawyerMatterList(page)

  const cases = [
    { button: /Microsoft Word/i, label: 'Word' },
    { button: /PDF document/i, label: 'PDF' },
    { button: /Excel sheet/i, label: 'Excel' },
  ]

  for (const item of cases) {
    await page.getByRole('button', { name: /Export analysis/i }).click()
    await page.getByRole('button', { name: item.button }).click()
    const status = page.getByRole('status')
    await expect(status).toContainText(`${item.label} export unavailable`)
    await expect(status).toContainText(`This static lawyer build cannot generate ${item.label} files yet. No export was queued.`)
    await page.getByRole('button', { name: 'Close' }).click()
  }
})

test('login page renders with username and password fields', async ({ page }) => {
  await page.goto('/login')

  // Auth is disabled in dev mode (VITE_AUTH_DISABLED=true) so the form
  // renders synchronously, then a 1s timer redirects to '/'.
  // Assert the form elements are visible within that window.
  const usernameInput = page.locator('input[autocomplete="username"]')
  const passwordInput = page.locator('input[type="password"]')
  const submitButton = page.locator('button[type="submit"]')

  await expect(usernameInput).toBeVisible({ timeout: 3000 })
  await expect(passwordInput).toBeVisible({ timeout: 3000 })
  await expect(submitButton).toBeVisible({ timeout: 3000 })
})

test('live AskPanel query returns real answer or typed degraded state', async ({ page, request }) => {
  test.setTimeout(LIVE_QUERY_RESPONSE_TIMEOUT_MS + 60000)

  const docId = await requireLiveQueryDocument(request)
  await page.goto(`/runs/${docId}/ask`)

  const textarea = page.locator('textarea')
  await textarea.waitFor({ timeout: 10000 })
  const question = 'What is the main subject of this document?'
  await textarea.fill(question)

  const submitButton = page.locator('main button').filter({ hasText: 'Ask' }).first()
  await expect(submitButton).toBeEnabled({ timeout: 10000 })

  const queryRequestPromise = page.waitForRequest(
    (req) => req.url().includes('/api/query'),
    { timeout: LIVE_QUERY_REQUEST_TIMEOUT_MS }
  )
  const queryResponsePromise = page.waitForResponse(
    (resp) => resp.url().includes('/api/query'),
    { timeout: LIVE_QUERY_RESPONSE_TIMEOUT_MS }
  )

  const queryStartedAt = Date.now()
  await submitButton.click()

  let queryRequest
  try {
    queryRequest = await queryRequestPromise
  } catch {
    throw new Error(
      `AskPanel did not dispatch /api/query within ${LIVE_QUERY_REQUEST_TIMEOUT_MS}ms for document ${docId}.`
    )
  }

  const queryBody = queryRequest.postDataJSON() as Record<string, unknown>
  expect(queryBody.question).toBe(question)
  expect(queryBody.document_id).toBe(docId)
  expect(queryBody.namespace).toBeUndefined()
  test.info().annotations.push({ type: 'live-query-document', description: docId })

  let queryResp
  try {
    queryResp = await queryResponsePromise
  } catch {
    const elapsedMs = Date.now() - queryStartedAt
    throw new Error(
      `Live /api/query request was dispatched for document ${docId}, but no response arrived within ` +
        `${LIVE_QUERY_RESPONSE_TIMEOUT_MS}ms (${elapsedMs}ms elapsed). ` +
        'Classify as backend query latency/hang, not UI dispatch failure.'
    )
  }

  const latencyMs = Date.now() - queryStartedAt
  test.info().annotations.push({ type: 'live-query-latency-ms', description: String(latencyMs) })
  const payload = await queryResp.json().catch(() => null)

  if (queryResp.status() === 503) {
    expect(isRecord(payload) && isRecord(payload.detail) ? payload.detail.code : null).toBe(
      'query_backend_unavailable'
    )
    await expect(
      page.getByText(QUERY_BACKEND_UNAVAILABLE_COPY)
    ).toBeVisible({ timeout: 10000 })
    await expect(page.locator('[title="mock data"]')).toHaveCount(0)
    await expect(page.locator('main section')).toHaveCount(0)
    return
  }

  if (!queryResp.ok()) {
    throw new Error(`Live /api/query returned unexpected HTTP ${queryResp.status()} for document ${docId}.`)
  }
  if (!isRecord(payload)) {
    throw new Error(`Live /api/query returned a non-object payload for document ${docId}.`)
  }

  expect(payload.data_source).toBe('real')
  expect(['retrieved_evidence', undefined, null]).toContain(payload.answer_basis)
  const citationCount = Array.isArray(payload.citations) ? payload.citations.length : 0

  if (payload.validation_status === 'empty' && payload.answer === '' && citationCount === 0) {
    await expect(page.getByText('No answer', { exact: true })).toBeVisible({ timeout: 10000 })
    await expect(
      page.getByText('No answer could be produced from the retrieved evidence for this question.')
    ).toBeVisible({ timeout: 10000 })
    await expect(page.locator('[title="mock data"]')).toHaveCount(0)
    return
  }

  expect(typeof payload.answer === 'string' && payload.answer.trim().length > 0).toBe(true)
  expect(citationCount).toBeGreaterThan(0)

  const answerEl = page.locator('main section p').first()
  await expect(answerEl).toBeVisible({ timeout: 10000 })

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

test('summary endpoint returns real data_source', async ({ request }) => {
  const summary = await findLiveSummary(request)
  if (!summary) {
    test.skip(true, 'live backend has no generated summary documents')
    return
  }

  expect(summary.data.data_source).toBe('real')
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

test('executive memo tab renders real summary text, not loading state', async ({ page, request }) => {
  const summary = await findLiveSummary(request)
  if (!summary) {
    test.skip(true, 'live backend has no generated summary documents')
    return
  }
  const { docId } = summary
  expect(REAL_DOC_IDS).toContain(docId)

  // Set up capture for /api/docs/{docId}/summary BEFORE navigation.
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

  await page.goto(`/runs/${docId}/exec`)

  const resp = await summaryResp
  expect(resp.ok()).toBeTruthy()

  // SummaryPanel uses divs rather than sections.
  const summaryParagraph = page.locator('p').filter({ hasText: /.{50,}/ }).first()
  await expect(summaryParagraph).toBeVisible({ timeout: 10000 })

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
  const submitButton = page.locator('main button').filter({ hasText: 'Ask' }).first()
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

  const submitButton = page.locator('main button').filter({ hasText: 'Ask' }).first()
  await expect(submitButton).toBeEnabled({ timeout: 5000 })
  await submitButton.click()

  await expect(page.locator('header').getByText('unknown source state')).toBeVisible({ timeout: 10000 })
  await expect(page.locator('header [title="unknown source state"]')).toBeVisible()
  await expect(page.locator('[title="mock data"]')).toHaveCount(0)
})

test('AskPanel renders typed supporting subgraph without path field leakage', async ({ page }) => {
  const TEST_DOC_ID = await mockEvidencePanelDocument(page, {
    docId: 'test_doc_query_supporting_graph',
    namespace: 'query_graph_ns',
  })

  await page.route('**/api/query', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data_source: 'real',
        answer_basis: 'retrieved_evidence',
        answer: 'The answer is supported by Query claim.',
        citations: [
          {
            evidence_id: 'ev-query-1',
            result_id: 'result-query-1',
            source: 'Graph register',
            node_id: 'query:claim:1',
            chunk_id: 'query:chunk:1',
            page: 4,
            namespace: 'query_graph_ns',
          },
        ],
        supporting_subgraph: {
          status: 'available',
          data_source: 'real',
          nodes: [
            {
              id: 'query:claim:1',
              labels: ['CLAIM'],
              primary_type: 'CLAIM',
              display_name: 'Query claim',
              salience_score: 0.92,
              confidence: 0.84,
              provenance: { document_id: TEST_DOC_ID, chunk_id: 'query:chunk:1', page_start: 4 },
              data_source: 'real',
            },
            {
              id: 'query:evidence:1',
              labels: ['EVIDENCE'],
              primary_type: 'EVIDENCE',
              text_preview: 'Evidence preview',
              provenance: { document_id: TEST_DOC_ID, chunk_id: 'query:chunk:2', page_start: 5 },
              data_source: 'real',
            },
          ],
          edges: [
            {
              id: 'query:edge:1',
              type: 'SUPPORTED_BY',
              source: 'query:claim:1',
              target: 'query:evidence:1',
              provenance: { document_id: TEST_DOC_ID, chunk_id: 'query:chunk:1', page_start: 4 },
              data_source: 'real',
            },
          ],
        },
        validation_status: 'supported',
        confidence: 0.84,
        retrieval_debug: {},
      }),
    })
  })

  await page.route('**/api/graph**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        namespace: 'query_graph_ns',
        document_id: TEST_DOC_ID,
        root_node_id: 'query:claim:1',
        depth: 2,
        edge_kinds: 'entity',
        data_source: 'real',
        nodes: [
          {
            id: 'query:claim:1',
            labels: ['CLAIM'],
            primary_type: 'CLAIM',
            display_name: 'Query claim',
            properties: {},
          },
          {
            id: 'query:evidence:1',
            labels: ['EVIDENCE'],
            primary_type: 'EVIDENCE',
            display_name: 'Evidence preview',
            properties: {},
          },
        ],
        edges: [
          {
            id: 'query:edge:1',
            source: 'query:claim:1',
            target: 'query:evidence:1',
            type: 'SUPPORTED_BY',
            key_props: {},
            provenance: { chunk_id: 'query:chunk:1', page_start: 4 },
            properties: {},
          },
        ],
      }),
    })
  })

  await page.goto(`/runs/${TEST_DOC_ID}/ask`)

  const textarea = page.locator('textarea').first()
  await expect(textarea).toBeVisible({ timeout: 10000 })
  await textarea.fill('What supports the answer?')

  const submitButton = page.locator('main button').filter({ hasText: 'Ask' }).first()
  await expect(submitButton).toBeEnabled({ timeout: 5000 })
  await submitButton.click()

  await expect(page.getByText('Supporting subgraph')).toBeVisible({ timeout: 10000 })
  await expect(page.getByText('Query claim', { exact: true })).toBeVisible()
  await expect(page.getByText('SUPPORTED_BY')).toBeVisible()
  await expect(page.getByText(['source', 'uri'].join('_'))).toHaveCount(0)

  const graphRequest = page.waitForRequest((request) => {
    if (!request.url().includes('/api/graph')) return false
    return new URL(request.url()).searchParams.get('node') === 'query:claim:1'
  })
  await page.getByRole('button', { name: /Open supporting graph/i }).click()
  await graphRequest
  await expect(page).toHaveURL(new RegExp(`/runs/${TEST_DOC_ID}/evidence`), { timeout: 10000 })
})

test('AskPanel renders empty real query response without fabricating an answer', async ({ page }) => {
  const TEST_DOC_ID = 'test_doc_empty_query'

  await page.route('**/api/status', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data_source: 'real',
        documents: [
          {
            document_id: TEST_DOC_ID,
            label: 'Empty Query Test Document',
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
        label: 'Empty Query Test Document',
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
        answer: '',
        citations: [],
        supporting_subgraph: { nodes: [], edges: [] },
        validation_status: 'empty',
        confidence: 0,
        data_source: 'real',
        answer_basis: 'retrieved_evidence',
        retrieval_debug: { retrieved: 20, used: 0, sources: ['graph', 'page'] },
      }),
    })
  })

  await page.goto(`/runs/${TEST_DOC_ID}/ask`)

  const textarea = page.locator('textarea').first()
  await expect(textarea).toBeVisible({ timeout: 10000 })
  await textarea.fill('What does the retrieved evidence support?')

  const submitButton = page.locator('main button').filter({ hasText: 'Ask' }).first()
  await expect(submitButton).toBeEnabled({ timeout: 5000 })
  await submitButton.click()

  await expect(page.getByText('No answer', { exact: true })).toBeVisible({ timeout: 10000 })
  await expect(
    page.getByText('No answer could be produced from the retrieved evidence for this question.')
  ).toBeVisible({ timeout: 10000 })
  await expect(page.locator('header [title="real data"]')).toBeVisible()
  await expect(page.locator('[title="mock data"]')).toHaveCount(0)
  await expect(page.locator('main section p.font-serif')).toHaveCount(0)
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
      QUERY_BACKEND_UNAVAILABLE_COPY
    )
  ).toBeVisible({ timeout: 10000 })
  await expect(page.locator('[class*="bg-amber-50"]')).toBeVisible({ timeout: 5000 })
  await expect(page.getByText('No answer found in the available artifact claims.')).toHaveCount(0)
  await expect(page.locator('[title="mock data"]')).toHaveCount(0)
})
