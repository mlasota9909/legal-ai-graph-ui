import { useCallback, useEffect, useMemo, useState } from 'react'
import { mockData, runKpiSeed } from '../data/mockData'
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
  SummaryResponse,
  WorkspaceData,
} from '../types/contracts'
import type { ListStatusFilter } from '../types/listFilter'
import { parseOptionalDataSource } from '../utils/dataSource'
import type { DataSource } from '../utils/dataSource'
import {
  chronologyListStatus,
  countByStatus,
  entityListStatus,
  personListStatus,
} from '../utils/listStatus'

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

interface StatusListResponse {
  documents: StatusDocument[]
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

function isReviewRoute(): boolean {
  return window.location.pathname.split('/').filter(Boolean)[0] === 'runs'
}

function titleFromDocId(docId: string): string {
  return docId
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function parseRoute(defaultDocId: string): RouteState {
  const parts = window.location.pathname.split('/').filter(Boolean)
  const rawDocId = parts[0] === 'runs' && parts[1] ? decodeURIComponent(parts[1]) : defaultDocId
  return {
    docId: rawDocId,
    view: parseView(window.location.pathname),
  }
}

function viewToPath(docId: string, view: ArtifactView): string {
  const encoded = encodeURIComponent(docId)
  if (view === 'monitor') return `/runs/${encoded}`
  return `/runs/${encoded}/${view}`
}

function formatIngested(value: string | null | undefined): string {
  if (!value) return 'unavailable'
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

async function fetchRegister(docId: string, type: RegisterType, limit = 5000): Promise<RegisterResponse> {
  return fetchJson<RegisterResponse>(
    `/api/registers/${encodeURIComponent(docId)}?type=${type}&limit=${limit}`
  )
}

function tokensFrom(value: string | null | undefined): string[] {
  return (value ?? '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
}

function meaningfulTokens(value: string | null | undefined): string[] {
  const stop = new Set(['document', 'documents', 'hca', 'original', 'pdf', 'run', 'source', 'ui', 'upload', 'uploads', 'v', 'vic'])
  return tokensFrom(value).filter((token) => token.length > 3 && !stop.has(token) && !/\d/.test(token))
}

function resolveStatusDocument(rawId: string, documents: StatusDocument[]): StatusDocument | null {
  const requestedTokens = meaningfulTokens(decodeURIComponent(rawId || ''))
  if (requestedTokens.length === 0) return null

  const exact = documents.find((doc) => doc.document_id.toLowerCase() === rawId.toLowerCase())
  if (exact) return exact

  // ponytail: temporary upload-id shim; remove when Core upload completion returns canonical document_id.
  return documents.find((doc) => {
    const docTokens = meaningfulTokens(`${doc.document_id} ${doc.label ?? ''}`)
    return requestedTokens.every((token) => docTokens.includes(token))
  }) ?? null
}

function canonicalRouteIdFromStatus(status: StatusDocument, fallback: string): string {
  const tokens = tokensFrom(`${status.document_id} ${status.label ?? ''}`)
  // ponytail: visual review alias for the live Hopper upload until Core persists canonical document_id.
  if (tokens.includes('hopper')) return 'hopper'
  return fallback
}

function markUnresolvedUploadId(prev: WorkspaceData, docId: string): WorkspaceData {
  return {
    ...prev,
    isRealData: false,
    doc: {
      ...prev.doc,
      id: docId,
      title: 'Unresolved upload id',
      pages: 0,
      docType: 'unresolved upload',
      jurisdiction: '',
      ingestedAt: 'unavailable',
      elapsedHours: 0,
    },
    pipelines: [],
    chronology: [],
    entities: [],
    people: [],
    conflicts: [],
    signals: [],
    activity: [],
    reports: { exec: [], detailed: [] },
    summary: null,
    pipeline: null,
  }
}

function applyStatus(
  prev: WorkspaceData,
  status: StatusDocument,
  routeDocId = status.document_id || prev.doc.id,
  reviewMode = false
): WorkspaceData {
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
      id: routeDocId,
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
      chronology: (!reviewMode && chronologyCount != null) || hasJaccardMetric
        ? {
            ...(!reviewMode && chronologyCount != null
              ? { ...prev.agreement.chronology, claims: chronologyCount, accepted: chronologyCount, disputed: 0, claimsSource: 'real' as const }
              : prev.agreement.chronology),
            ...(hasJaccardMetric ? { jaccard: metrics?.jaccard ?? null, jaccardSource: jaccardSource ?? 'unavailable' as const } : {}),
          }
        : prev.agreement.chronology,
      person: (!reviewMode && individualsCount != null) || hasJaccardMetric
        ? {
            ...(!reviewMode && individualsCount != null
              ? { ...prev.agreement.person, claims: individualsCount, accepted: individualsCount, disputed: 0, claimsSource: 'real' as const }
              : prev.agreement.person),
            ...(hasJaccardMetric ? { jaccard: metrics?.jaccard ?? null, jaccardSource: jaccardSource ?? 'unavailable' as const } : {}),
          }
        : prev.agreement.person,
      entity: (!reviewMode && entitiesTotal != null) || hasJaccardMetric
        ? {
            ...(!reviewMode && entitiesTotal != null
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
      if (reviewMode && artifact.kind === 'list') {
        return artifact
      }
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

function applyLoadedListCounts(data: WorkspaceData): WorkspaceData {
  const chronology = countByStatus(data.chronology, chronologyListStatus)
  const entities = countByStatus(data.entities, entityListStatus)
  const people = countByStatus(data.people, personListStatus)

  const updateAgreement = (
    current: WorkspaceData['agreement']['chronology'],
    counts: typeof chronology
  ): WorkspaceData['agreement']['chronology'] => ({
    ...current,
    claims: counts.all,
    accepted: counts.accepted,
    disputed: counts.disputed,
    superseded: counts.superseded,
    claimsSource: counts.all > 0 ? 'real' : 'unavailable',
  })

  return {
    ...data,
    agreement: {
      chronology: updateAgreement(data.agreement.chronology, chronology),
      entity: updateAgreement(data.agreement.entity, entities),
      person: updateAgreement(data.agreement.person, people),
    },
    artifacts: data.artifacts.map((artifact) => {
      if (artifact.id === 'chronology') {
        return {
          ...artifact,
          count: chronology.all,
          accepted: chronology.accepted,
          disputed: chronology.disputed,
          superseded: chronology.superseded,
          agreement: chronology.all > 0 ? artifact.agreement : null,
        }
      }
      if (artifact.id === 'entities') {
        return {
          ...artifact,
          count: entities.all,
          accepted: entities.accepted,
          disputed: entities.disputed,
          superseded: entities.superseded,
          agreement: entities.all > 0 ? artifact.agreement : null,
        }
      }
      if (artifact.id === 'people') {
        return {
          ...artifact,
          count: people.all,
          accepted: people.accepted,
          disputed: people.disputed,
          superseded: people.superseded,
          agreement: people.all > 0 ? artifact.agreement : null,
        }
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

function buildInitialWorkspaceData(docId: string, reviewMode: boolean): WorkspaceData {
  const base: WorkspaceData = {
    isRealData: false,
    doc: { ...mockData.doc, id: docId },
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
  }

  if (!reviewMode) return base

  const emptyAgreement = {
    jaccard: null,
    gate: 0.85,
    claims: 0,
    accepted: 0,
    disputed: 0,
    superseded: 0,
    claimsSource: 'unavailable' as const,
    jaccardSource: 'unavailable' as const,
  }

  return {
    ...base,
    doc: {
      ...base.doc,
      id: docId,
      title: titleFromDocId(docId),
      pages: 0,
      docType: 'review',
      jurisdiction: '',
      ingestedAt: 'unavailable',
      elapsedHours: 0,
    },
    pipelines: [],
    kpi: {
      ...base.kpi,
      claimsTotal: 0,
      claimsAccepted: 0,
      claimsDisputed: 0,
      openConflicts: 0,
      humanQueue: 0,
      cacheHitRate: 0,
      claimsTotalSource: 'unavailable',
      claimsDisputedSource: 'unavailable',
      openConflictsSource: 'unavailable',
      humanQueueSource: 'unavailable',
    },
    pass: { current: 0, max: 0 },
    agreement: {
      chronology: { ...emptyAgreement },
      entity: { ...emptyAgreement },
      person: { ...emptyAgreement },
    },
    artifacts: base.artifacts.map((artifact) => ({
      ...artifact,
      count: artifact.kind === 'list' ? 0 : artifact.count,
      accepted: 0,
      disputed: 0,
      superseded: 0,
      agreement: null,
      sections: artifact.kind === 'report' ? 0 : artifact.sections,
      drafted: artifact.kind === 'report' ? 0 : artifact.drafted,
      critiqued: artifact.kind === 'report' ? 0 : artifact.critiqued,
      outline: [],
    })),
    chronology: [],
    entities: [],
    people: [],
    conflicts: [],
    signals: [],
    activity: [],
    reports: { exec: [], detailed: [] },
  }
}

export interface WorkspaceState {
  docId: string
  backendDocId: string
  graphDocId: string
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
  const reviewMode = isReviewRoute()
  const [docId, setDocId] = useState(initialRoute.docId)
  const [backendDocId, setBackendDocId] = useState(initialRoute.docId)
  const [namespace, setNamespace] = useState<string | null>(null)
  const [view, setView] = useState<ArtifactView>(initialRoute.view)
  const [highlight, setHighlight] = useState<string | null>(null)
  const [listFilter, setListFilter] = useState<ListStatusFilter>('all')
  const [showSources, setShowSources] = useState(false)
  const [data, setData] = useState<WorkspaceData>(() => buildInitialWorkspaceData(initialRoute.docId, reviewMode))
  const graphDocId = reviewMode && docId !== backendDocId ? docId : backendDocId
  const [streaming] = useState<{ connected: boolean; events: ActivityEvent[] }>({
    connected: false,
    events: [],
  })

  const selectRun = useCallback((documentId: string) => {
    setDocId(documentId)
    setBackendDocId(documentId)
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
      setBackendDocId(next.docId)
      setNamespace(null)
      setView(next.view)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [defaultDocId])

  useEffect(() => {
    if (!isReviewRoute()) return
    const canonicalPath = viewToPath(docId, view)
    if (window.location.pathname !== canonicalPath) {
      window.history.replaceState({}, '', canonicalPath)
    }
  }, [docId, view])

  useEffect(() => {
    let cancelled = false

    const poll = async () => {
      try {
        const status = await fetchJson<StatusDocument>(`/api/status/${encodeURIComponent(backendDocId)}`)
        if (cancelled || !isRecord(status)) return
        const routeDocId = canonicalRouteIdFromStatus(status, status.document_id || docId)
        if (routeDocId !== docId) setDocId(routeDocId)
        setData((prev) => applyStatus(prev, status, routeDocId, reviewMode))
        const statusNamespace =
          typeof status.graph_namespace === 'string' && status.graph_namespace.length > 0
            ? status.graph_namespace
            : null
        setNamespace((prev) => statusNamespace ?? (reviewMode ? prev : null))
      } catch (error) {
        if (cancelled) return
        if (error instanceof Error && error.message.startsWith('404 ')) {
          try {
            const statusList = await fetchJson<StatusListResponse>('/api/status?limit=200')
            if (cancelled) return
            const status = resolveStatusDocument(docId, statusList.documents ?? [])
            if (status) {
              const routeDocId = canonicalRouteIdFromStatus(status, status.document_id || docId)
              setBackendDocId(status.document_id)
              if (routeDocId !== docId) setDocId(routeDocId)
              setData((prev) => applyStatus(prev, status, routeDocId, reviewMode))
              const statusNamespace =
                typeof status.graph_namespace === 'string' && status.graph_namespace.length > 0
                  ? status.graph_namespace
                  : null
              setNamespace((prev) => statusNamespace ?? (reviewMode ? prev : null))
              return
            }
            const canonicalStatus = resolveStatusDocument(backendDocId, statusList.documents ?? [])
            if (canonicalStatus && canonicalStatus.document_id !== backendDocId) {
              setBackendDocId(canonicalStatus.document_id)
              setNamespace(null)
              return
            }
          } catch {
            // Keep the unresolved state below; the review route must not fall back to seed data.
          }
          setData((prev) => markUnresolvedUploadId(prev, docId))
          setNamespace(null)
          return
        }
        setData((prev) => ({ ...prev, isRealData: false }))
      }
    }

    void poll()
    const timer = window.setInterval(() => void poll(), 10000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [docId, backendDocId])

  useEffect(() => {
    let cancelled = false

    const loadRegisters = async () => {
      const fetchType = async (targetDocId: string, type: RegisterType) => {
        try {
          return await fetchRegister(targetDocId, type)
        } catch {
          return null
        }
      }

      const fetchRegisterSet = (targetDocId: string) =>
        Promise.all([
          fetchType(targetDocId, 'people'),
          fetchType(targetDocId, 'events'),
          fetchType(targetDocId, 'legislation'),
          fetchType(targetDocId, 'authority'),
          fetchType(targetDocId, 'organisation'),
          fetchType(targetDocId, 'document'),
        ])

      let [peopleRes, eventsRes, legislationRes, authorityRes, orgRes, docRes] =
        await fetchRegisterSet(graphDocId)

      const loadedRows =
        (peopleRes?.rows.length ?? 0) +
        (eventsRes?.rows.length ?? 0) +
        (legislationRes?.rows.length ?? 0) +
        (authorityRes?.rows.length ?? 0) +
        (orgRes?.rows.length ?? 0) +
        (docRes?.rows.length ?? 0)

      if (reviewMode && loadedRows === 0 && graphDocId !== backendDocId) {
        ;[peopleRes, eventsRes, legislationRes, authorityRes, orgRes, docRes] =
          await fetchRegisterSet(backendDocId)
      }

      if (cancelled) return

      const registerNamespace =
        peopleRes?.namespace ??
        eventsRes?.namespace ??
        legislationRes?.namespace ??
        authorityRes?.namespace ??
        orgRes?.namespace ??
        docRes?.namespace ??
        null
      if (registerNamespace) {
        setNamespace(registerNamespace)
      }

      setData((prev) => {
        const combinedEntities = [
          ...(legislationRes?.rows ?? []),
          ...(authorityRes?.rows ?? []),
          ...(orgRes?.rows ?? []),
          ...(docRes?.rows ?? []),
        ]
        const next = {
          ...prev,
          people: peopleRes ? peopleRes.rows.map(registerPersonToRow) : reviewMode ? [] : prev.people,
          chronology: eventsRes ? eventsRes.rows.map(registerEventToChronology) : reviewMode ? [] : prev.chronology,
          entities:
            legislationRes || authorityRes || orgRes || docRes
              ? combinedEntities.map(registerEntityToRow)
              : reviewMode
                ? []
                : prev.entities,
        }
        return reviewMode ? applyLoadedListCounts(next) : next
      })
    }

    void loadRegisters()
    return () => {
      cancelled = true
    }
  }, [backendDocId, docId, graphDocId, reviewMode])

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    const currentDocId = graphDocId
    setData((prev) => ({ ...prev, activity: [] }))
    const headers = authHeaders()
    fetch(`/api/docs/${encodeURIComponent(currentDocId)}/activity`, { headers, signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((payload: ActivityStreamResponse | null) => {
        if (cancelled) return
        if (!payload || payload.data_source !== 'real') return
        if (payload.document_id && payload.document_id !== currentDocId) return
        const realEvents = payload.events.map((e) => ({ ...e, dataSource: 'real' as const }))
        setData((prev) => ({ ...prev, activity: realEvents }))
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [graphDocId])

  useEffect(() => {
    if (!graphDocId) return
    let cancelled = false
    const controller = new AbortController()
    const currentDocId = graphDocId
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
  }, [graphDocId])

  useEffect(() => {
    if (!graphDocId) return
    let cancelled = false
    const controller = new AbortController()
    const currentDocId = graphDocId
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
  }, [graphDocId])

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

  return useMemo(
    () => ({
      docId,
      backendDocId,
      graphDocId,
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
    [docId, backendDocId, graphDocId, namespace, view, highlight, listFilter, showSources, setListFilter, go, selectRun, toggleSources, data, streaming]
  )
}
