import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { activitySeed, mockData, runKpiSeed } from '../data/mockData'
import type {
  ActivityEvent,
  ActivityStreamResponse,
  ArtifactView,
  ChronologyClaim,
  EntityRow,
  FleetResponse,
  PersonRow,
  PipelineResponse,
  PipelineState,
  RegisterResponse,
  RegisterRow,
  RegisterType,
  RunKpi,
  SummaryResponse,
  WorkspaceData,
} from '../types/contracts'
import type { ListStatusFilter } from '../types/listFilter'
import { parseOptionalDataSource } from '../utils/dataSource'
import type { DataSource } from '../utils/dataSource'

const VIEW_SEGMENTS: Record<string, ArtifactView> = {
  monitor: 'monitor',
  chronology: 'chronology',
  entities: 'entities',
  people: 'people',
  exec: 'exec',
  detailed: 'detailed',
  evidence: 'evidence',
  ask: 'ask',
}

interface RouteState {
  docId: string
  view: ArtifactView
}

interface GraphCounts {
  nodes_total?: number | null
  chunks_total?: number | null
  page_count?: number | null
  events_total?: number | null
  persons_total?: number | null
  entities_total?: number | null
  claims_total?: number | null
  findings_total?: number | null
  supported_by_edges?: number | null
  evidenced_by_external_edges?: number | null
  external_sources?: number | null
  external_sources_by_source?: Record<string, number> | null
  upload_ts?: string | null
  data_source?: string | null
}

interface StatusDocument {
  document_id: string
  graph_namespace?: string | null
  label?: string | null
  pipeline_stage?: string | null
  upload_ts?: string | null
  page_count?: number | null
  chunks_completed?: number | null
  total_chunks?: number | null
  chronology_status?: string | null
  chronology_event_count?: number | null
  individuals_count?: number | null
  people_mentioned_count?: number | null
  graph_counts?: GraphCounts | null
  kpi_metrics?: {
    human_queue: number
    human_queue_data_source: string
    human_queue_definition?: string | null
    open_conflicts: number
    open_conflicts_data_source: string
    open_conflicts_definition?: string | null
    jaccard: number | null
    jaccard_data_source: string
    jaccard_definition?: string | null
    claims_disputed?: number | null
    claims_disputed_data_source?: string | null
    claims_disputed_definition?: string | null
  } | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseDataSource(value: string | null | undefined): DataSource | undefined {
  return parseOptionalDataSource(value)
}

function parseView(pathname: string): ArtifactView {
  const parts = pathname.split('/').filter(Boolean)
  if (parts[0] !== 'runs') return 'monitor'
  const seg = parts[2]
  if (!seg) return 'monitor'
  return VIEW_SEGMENTS[seg] ?? 'monitor'
}

function parseRoute(defaultDocId: string): RouteState {
  const parts = window.location.pathname.split('/').filter(Boolean)
  return {
    docId: parts[0] === 'runs' && parts[1] ? decodeURIComponent(parts[1]) : defaultDocId,
    view: parseView(window.location.pathname),
  }
}

function viewToPath(docId: string, view: ArtifactView): string {
  const encoded = encodeURIComponent(docId)
  if (view === 'monitor') return `/runs/${encoded}`
  return `/runs/${encoded}/${view}`
}

function formatTime(date = new Date()): string {
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

function formatIngested(value: string | null | undefined): string {
  if (!value) return mockData.doc.ingestedAt
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString([], {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function mapStageToPipelineStatus(value: string | null | undefined): PipelineState['status'] {
  if (value === 'completed') return 'done'
  if (value === 'failed') return 'failed'
  if (value === 'not_started') return 'queued'
  return 'running'
}

function bumpKpi(kpi: RunKpi, event: ActivityEvent): RunKpi {
  let next = { ...kpi }
  if (event.type === 'CLAIM') {
    next = {
      ...next,
      claimsTotal: next.claimsTotal + 1,
      claimsAccepted: event.level === 'ok' ? next.claimsAccepted + 1 : next.claimsAccepted,
      claimsDisputed:
        event.level === 'warn' || event.level === 'bad'
          ? next.claimsDisputed + 1
          : next.claimsDisputed,
    }
  }
  next.cacheHitRate = Math.min(0.98, Math.max(0.4, next.cacheHitRate + 0.002))
  return next
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('legal_ai_token')
  const headers: HeadersInit = {}
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: authHeaders() })
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
  return (await response.json()) as T
}

async function fetchRegister(docId: string, type: RegisterType, limit = 500): Promise<RegisterResponse> {
  return fetchJson<RegisterResponse>(
    `/api/registers/${encodeURIComponent(docId)}?type=${type}&limit=${limit}`
  )
}

function applyStatus(prev: WorkspaceData, status: StatusDocument): WorkspaceData {
  const chunksDone = status.chunks_completed
  const chunksTotal = status.total_chunks
  const hasOcrProgress = chunksDone != null && chunksTotal != null && chunksTotal > 0
  const ocrProgress = hasOcrProgress ? Math.min(1, Math.max(0, chunksDone / chunksTotal)) : null

  const chronologyStatus = status.chronology_status
  const chronologyPipelineStatus = mapStageToPipelineStatus(chronologyStatus)

  const nextPipelines = prev.pipelines.map((pipe) => {
    if (pipe.id === 2 && ocrProgress != null) {
      const ocrStatus: PipelineState['status'] =
        ocrProgress >= 1 ? 'done' : ocrProgress > 0 ? 'running' : 'queued'
      return {
        ...pipe,
        progress: ocrProgress,
        status: ocrStatus,
        detail: `${chunksDone}/${chunksTotal} OCR chunks completed`,
        progressSource: 'real' as const,
        statusSource: 'real' as const,
      }
    }
    if (pipe.id === 3 && chronologyStatus) {
      return {
        ...pipe,
        status: chronologyPipelineStatus,
        progress: chronologyPipelineStatus === 'done' ? 1 : chronologyPipelineStatus === 'queued' ? 0 : Math.max(pipe.progress, 0.35),
        detail: `Chronology ${chronologyStatus}`,
        progressSource: 'real' as const,
        statusSource: 'real' as const,
      }
    }
    return pipe
  })

  const chronologyCount = status.chronology_event_count
  const individualsCount =
    status.people_mentioned_count ?? status.individuals_count
  const gc = status.graph_counts
  const entitiesTotal = gc?.entities_total ?? null
  const claimsTotal = gc?.claims_total ?? null
  const metrics = status.kpi_metrics
  const hasJaccardMetric = metrics != null && 'jaccard' in metrics
  const openConflictsSource = parseDataSource(metrics?.open_conflicts_data_source)
  const humanQueueSource = parseDataSource(metrics?.human_queue_data_source)
  const claimsDisputedSource = parseDataSource(metrics?.claims_disputed_data_source)
  const jaccardSource = parseDataSource(metrics?.jaccard_data_source)

  return {
    ...prev,
    isRealData: true,
    doc: {
      ...prev.doc,
      id: status.document_id || prev.doc.id,
      title: status.label || prev.doc.title,
      pages: status.page_count ?? prev.doc.pages,
      docType: status.pipeline_stage ?? prev.doc.docType,
      ingestedAt: formatIngested(status.upload_ts),
    },
    pipelines: nextPipelines,
    kpi: {
      ...prev.kpi,
      ...(claimsTotal != null ? { claimsTotal, claimsAccepted: claimsTotal, claimsDisputed: 0, claimsTotalSource: 'real' as const } : {}),
      ...(metrics?.open_conflicts != null ? { openConflicts: metrics.open_conflicts, openConflictsSource: openConflictsSource ?? 'unavailable' as const } : {}),
      ...(metrics?.human_queue != null ? { humanQueue: metrics.human_queue, humanQueueSource: humanQueueSource ?? 'unavailable' as const } : {}),
      ...(metrics?.claims_disputed != null ? { claimsDisputed: metrics.claims_disputed, claimsDisputedSource: claimsDisputedSource ?? 'unavailable' as const } : {}),
    },
    agreement: {
      ...prev.agreement,
      chronology: chronologyCount != null || hasJaccardMetric
        ? {
            ...(chronologyCount != null
              ? { ...prev.agreement.chronology, claims: chronologyCount, accepted: chronologyCount, disputed: 0, claimsSource: 'real' as const }
              : prev.agreement.chronology),
            ...(hasJaccardMetric ? { jaccard: metrics?.jaccard ?? null, jaccardSource: jaccardSource ?? 'unavailable' as const } : {}),
          }
        : prev.agreement.chronology,
      person: individualsCount != null || hasJaccardMetric
        ? {
            ...(individualsCount != null
              ? { ...prev.agreement.person, claims: individualsCount, accepted: individualsCount, disputed: 0, claimsSource: 'real' as const }
              : prev.agreement.person),
            ...(hasJaccardMetric ? { jaccard: metrics?.jaccard ?? null, jaccardSource: jaccardSource ?? 'unavailable' as const } : {}),
          }
        : prev.agreement.person,
      entity: entitiesTotal != null || hasJaccardMetric
        ? {
            ...(entitiesTotal != null
              ? { ...prev.agreement.entity, claims: entitiesTotal, accepted: entitiesTotal, disputed: 0, claimsSource: 'real' as const }
              : prev.agreement.entity),
            ...(hasJaccardMetric ? { jaccard: metrics?.jaccard ?? null, jaccardSource: jaccardSource ?? 'unavailable' as const } : {}),
          }
        : prev.agreement.entity,
    },
    augmentation: {
      ...prev.augmentation,
      ...(gc?.external_sources != null ? { externalSources: gc.external_sources } : {}),
      ...(gc?.evidenced_by_external_edges != null ? { evidencedByExternalEdges: gc.evidenced_by_external_edges } : {}),
      externalSourcesBySource: gc?.external_sources_by_source ?? {},
    },
    artifacts: prev.artifacts.map((artifact) => {
      if (artifact.id === 'chronology' && chronologyCount != null) {
        return { ...artifact, count: chronologyCount, accepted: chronologyCount, disputed: 0, superseded: 0 }
      }
      if (artifact.id === 'people' && individualsCount != null) {
        return { ...artifact, count: individualsCount, accepted: individualsCount, disputed: 0, superseded: 0 }
      }
      if (artifact.id === 'entities' && entitiesTotal != null) {
        return { ...artifact, count: entitiesTotal, accepted: entitiesTotal, disputed: 0, superseded: 0 }
      }
      return artifact
    }),
  }
}

function registerEventToChronology(row: RegisterRow, index: number): ChronologyClaim {
  const e = row.entity as Record<string, unknown>
  const prov = row.provenance[0]
  return {
    id: row.id || `reg-event-${index}`,
    graphSeed: prov?.chunk_id ?? row.id ?? null,
    date: (e.event_date as string | null | undefined) ?? 'undated',
    page: prov?.page ?? prov?.page_start ?? 0,
    title: ((e.canonical_name ?? e.name) as string | undefined) ?? 'Untitled',
    who: Array.isArray(e.participants) ? (e.participants as string[]) : [],
    lane: 'structural',
    conf: row.salience_score ?? 0.85,
    status: 'accepted',
    dataSource: 'real',
  }
}

function registerPersonToRow(row: RegisterRow, index: number): PersonRow {
  const e = row.entity as Record<string, unknown>
  const prov = row.provenance[0]
  const page = prov?.page ?? prov?.page_start
  return {
    id: row.id || `reg-person-${index}`,
    graphSeed: prov?.chunk_id ?? row.id ?? null,
    name: ((e.canonical_name ?? e.name) as string | undefined) ?? 'Unknown',
    role: ((e.role ?? e.title ?? e.party_side) as string | undefined) ?? 'Mentioned person',
    mentions: typeof e.views === 'number' ? e.views : row.provenance.length,
    conf: row.salience_score ?? 0.85,
    source: 'Graph register',
    lastSeen: page != null ? `p. ${page}` : '—',
    status: 'accepted',
    dataSource: 'real',
    reasoning: {
      method: 'STRUCTURAL',
      lanes: 'graph_v2',
      verdict: 'accepted',
      text: 'From the evidence-graph people register.',
    },
  }
}

function registerEntityToRow(row: RegisterRow, index: number): EntityRow {
  const e = row.entity as Record<string, unknown>
  const prov = row.provenance[0]
  const page = prov?.page ?? prov?.page_start
  const surfaceNames = Array.isArray(e.surface_names) ? (e.surface_names as string[]) : []
  return {
    id: row.id || `reg-entity-${index}`,
    graphSeed: prov?.chunk_id ?? row.id ?? null,
    canonical: ((e.canonical_name ?? e.name) as string | undefined) ?? 'Unknown',
    type: ((e.entity_type ?? row.type) as string).toUpperCase(),
    mentions: typeof e.views === 'number' ? e.views : row.provenance.length,
    aliases: Math.max(0, surfaceNames.length - 1),
    conf: row.salience_score ?? 0.85,
    asic: null,
    lastSeen: page != null ? `p. ${page}` : '—',
    status: 'accepted',
    dataSource: 'real',
    reasoning: {
      method: 'STRUCTURAL',
      lanes: 'graph_v2',
      verdict: 'accepted',
      text: `From the evidence-graph ${row.type} register.`,
    },
  }
}

const LIST_VIEWS: ArtifactView[] = ['chronology', 'entities', 'people']

export interface WorkspaceState {
  docId: string
  namespace: string | null
  view: ArtifactView
  highlight: string | null
  listFilter: ListStatusFilter
  showSources: boolean
  setListFilter: (filter: ListStatusFilter) => void
  go: (view: ArtifactView, highlightId?: string, listFilter?: ListStatusFilter) => void
  selectRun: (documentId: string) => void
  toggleSources: () => void
  data: WorkspaceData
  streaming: {
    connected: boolean
    events: ActivityEvent[]
  }
}

export function useWorkspace(defaultDocId = mockData.doc.id): WorkspaceState {
  const initialRoute = parseRoute(defaultDocId)
  const [docId, setDocId] = useState(initialRoute.docId)
  const [namespace, setNamespace] = useState<string | null>(null)
  const [view, setView] = useState<ArtifactView>(initialRoute.view)
  const [highlight, setHighlight] = useState<string | null>(null)
  const [listFilter, setListFilter] = useState<ListStatusFilter>('all')
  const [showSources, setShowSources] = useState(false)
  const [data, setData] = useState<WorkspaceData>(() => ({
    isRealData: false,
    doc: { ...mockData.doc },
    pipelines: mockData.pipelines.map((pipe) => ({ ...pipe, statusSource: 'mock', progressSource: 'mock' })),
    kpi: { ...runKpiSeed },
    pass: { current: 3, max: 5 },
    agreement: mockData.agreement,
    artifacts: mockData.artifacts,
    chronology: mockData.chronology.map((row) => ({ ...row, dataSource: 'mock' })),
    entities: mockData.entities.map((row) => ({ ...row, dataSource: 'mock' })),
    people: mockData.people.map((row) => ({ ...row, dataSource: 'mock' })),
    conflicts: mockData.conflicts,
    signals: mockData.signals,
    activity: mockData.activity.map((row) => ({ ...row, dataSource: 'mock' })),
    reports: mockData.reports,
    summary: null,
    augmentation: { ...mockData.augmentation, externalSourcesBySource: {} },
    pipeline: null,
    fleet: null,
    hardware: mockData.hardware,
  }))
  const [streaming, setStreaming] = useState<{ connected: boolean; events: ActivityEvent[] }>({
    connected: true,
    events: [],
  })
  const hasRealActivity = useRef(false)

  const selectRun = useCallback((documentId: string) => {
    setDocId(documentId)
    setNamespace(null)
    setView('monitor')
    setHighlight(null)
    setListFilter('all')
    const nextPath = viewToPath(documentId, 'monitor')
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath)
    }
  }, [])

  const go = useCallback(
    (next: ArtifactView, highlightId?: string, filter?: ListStatusFilter) => {
      const prevView = view
      setView(next)
      if (filter !== undefined) {
        setListFilter(filter)
      } else if (LIST_VIEWS.includes(next) && next !== prevView) {
        setListFilter('all')
      }
      if (highlightId) {
        setHighlight(highlightId)
        if (next !== 'evidence') {
          setTimeout(() => setHighlight(null), 2600)
        }
      } else {
        setHighlight(null)
      }
      const nextPath = viewToPath(docId, next)
      if (window.location.pathname !== nextPath) {
        window.history.pushState({}, '', nextPath)
      }
    },
    [docId, view]
  )

  const toggleSources = useCallback(() => setShowSources((prev) => !prev), [])

  useEffect(() => {
    const onPop = () => {
      const next = parseRoute(defaultDocId)
      setDocId(next.docId)
      setNamespace(null)
      setView(next.view)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [defaultDocId])

  useEffect(() => {
    let cancelled = false

    const poll = async () => {
      try {
        const status = await fetchJson<StatusDocument>(`/api/status/${encodeURIComponent(docId)}`)
        if (cancelled || !isRecord(status)) return
        setData((prev) => applyStatus(prev, status))
        setNamespace(
          typeof status.graph_namespace === 'string' && status.graph_namespace.length > 0
            ? status.graph_namespace
            : null
        )
      } catch {
        if (!cancelled) {
          setData((prev) => ({ ...prev, isRealData: false }))
        }
      }
    }

    void poll()
    const timer = window.setInterval(() => void poll(), 10000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [docId])

  useEffect(() => {
    let cancelled = false

    const loadRegisters = async () => {
      const fetchType = async (type: RegisterType) => {
        try {
          return await fetchRegister(docId, type)
        } catch {
          return null
        }
      }

      const [peopleRes, eventsRes, legislationRes, authorityRes, orgRes, docRes] = await Promise.all([
        fetchType('people'),
        fetchType('events'),
        fetchType('legislation'),
        fetchType('authority'),
        fetchType('organisation'),
        fetchType('document'),
      ])

      if (cancelled) return

      if (peopleRes) {
        setData((prev) => ({
          ...prev,
          people: peopleRes.rows.map(registerPersonToRow),
        }))
      }

      if (eventsRes) {
        setData((prev) => ({
          ...prev,
          chronology: eventsRes.rows.map(registerEventToChronology),
        }))
      }

      if (legislationRes || authorityRes || orgRes || docRes) {
        const combined = [
          ...(legislationRes?.rows ?? []),
          ...(authorityRes?.rows ?? []),
          ...(orgRes?.rows ?? []),
          ...(docRes?.rows ?? []),
        ]
        setData((prev) => ({
          ...prev,
          entities: combined.map(registerEntityToRow),
        }))
      }
    }

    void loadRegisters()
    return () => {
      cancelled = true
    }
  }, [docId])

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    const currentDocId = docId
    hasRealActivity.current = false
    setData((prev) => ({ ...prev, activity: [] }))
    const headers = authHeaders()
    fetch(`/api/docs/${encodeURIComponent(currentDocId)}/activity`, { headers, signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((payload: ActivityStreamResponse | null) => {
        if (cancelled) return
        if (!payload || payload.data_source !== 'real') return
        if (payload.document_id && payload.document_id !== currentDocId) return
        hasRealActivity.current = true
        const realEvents = payload.events.map((e) => ({ ...e, dataSource: 'real' as const }))
        setData((prev) => ({ ...prev, activity: realEvents }))
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [docId])

  useEffect(() => {
    if (!docId) return
    let cancelled = false
    const controller = new AbortController()
    const currentDocId = docId
    setData((prev) => ({ ...prev, summary: null }))
    const headers = authHeaders()
    fetch(`/api/docs/${encodeURIComponent(currentDocId)}/summary`, { headers, signal: controller.signal })
      .then((r) => (r.ok ? (r.json() as Promise<SummaryResponse>) : null))
      .then((payload: SummaryResponse | null) => {
        if (cancelled) return
        if (!payload) return
        if (payload.document_id && payload.document_id !== currentDocId) return
        setData((prev) => ({
          ...prev,
          summary: payload,
          artifacts: prev.artifacts.map((a) =>
            a.id === 'exec' || a.id === 'detailed'
              ? { ...a, sections: payload.sections.length }
              : a,
          ),
        }))
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [docId])

  useEffect(() => {
    if (!docId) return
    let cancelled = false
    const controller = new AbortController()
    const currentDocId = docId
    setData((prev) => ({ ...prev, pipeline: null }))
    const headers = authHeaders()
    fetch(`/api/docs/${encodeURIComponent(currentDocId)}/pipeline`, { headers, signal: controller.signal })
      .then((r) => (r.ok ? (r.json() as Promise<PipelineResponse>) : null))
      .then((payload: PipelineResponse | null) => {
        if (cancelled) return
        if (!payload) {
          setData((prev) => ({ ...prev, pipeline: null }))
          return
        }
        if (payload.document_id !== currentDocId) return
        setData((prev) => ({ ...prev, pipeline: payload }))
      })
      .catch(() => {
        if (cancelled) return
        setData((prev) => ({ ...prev, pipeline: null }))
      })
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [docId])

  useEffect(() => {
    const headers = authHeaders()
    fetch('/api/fleet', { headers })
      .then((r) => (r.ok ? (r.json() as Promise<FleetResponse>) : null))
      .then((payload: FleetResponse | null) => {
        if (!payload) {
          setData((prev) => ({ ...prev, fleet: null }))
          return
        }
        setData((prev) => ({ ...prev, fleet: payload }))
      })
      .catch(() => {
        setData((prev) => ({ ...prev, fleet: null }))
      })
  }, [])

  useEffect(() => {
    let index = 0
    const timer = window.setInterval(() => {
      if (hasRealActivity.current) return
      const base = activitySeed[index % activitySeed.length]
      index += 1
      const next: ActivityEvent = { ...base, t: formatTime(), dataSource: 'simulated' }
      setData((prev) => ({
        ...prev,
        doc: {
          ...prev.doc,
          elapsedHours: Math.min(prev.doc.timeBudgetHours, prev.doc.elapsedHours + 0.03),
        },
        kpi: bumpKpi(prev.kpi, next),
        activity: [next, ...prev.activity].slice(0, 120),
      }))
      setStreaming((prev) => ({
        connected: prev.connected,
        events: [next, ...prev.events].slice(0, 60),
      }))
    }, 5000)

    return () => window.clearInterval(timer)
  }, [])

  return useMemo(
    () => ({
      docId,
      namespace,
      view,
      highlight,
      listFilter,
      showSources,
      setListFilter,
      go,
      selectRun,
      toggleSources,
      data,
      streaming,
    }),
    [docId, namespace, view, highlight, listFilter, showSources, setListFilter, go, selectRun, toggleSources, data, streaming]
  )
}
