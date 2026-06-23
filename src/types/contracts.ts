export type ArtifactView =
  | 'monitor'
  | 'chronology'
  | 'entities'
  | 'people'
  | 'exec'
  | 'detailed'
  | 'evidence'

export type ArtifactType =
  | 'chronology'
  | 'entity'
  | 'person'
  | 'doc_type'
  | 'exec_memo'
  | 'detailed_analysis'

export type ReasoningMethod =
  | 'AUTHORITY_HIERARCHY'
  | 'AGREEMENT'
  | 'ARBITER_LLM'
  | 'ARBITER_PENDING'
  | 'STRUCTURAL'
  | 'TABLE'
  | 'EXT_ASIC'
  | 'EXT_AUSTLII'
  | 'EXT_EDGAR'
  | 'CROSS_ARTIFACT_SIGNAL'
  | 'PENDING_SWEEP'
  | 'HUMAN'
  | 'HUMAN_REVIEW'

export interface Reasoning {
  method: ReasoningMethod
  lanes: string
  verdict: string
  text: string
  dissent?: string
  links?: { label: string; href: string }[]
}

export interface RunDoc {
  id: string
  title: string
  pages: number
  docType: string
  jurisdiction: string
  ingestedAt: string
  timeBudgetHours: number
  elapsedHours: number
}

export interface PipelineState {
  id: 1 | 2 | 3 | 4
  name: string
  /** Compact label from mock data, e.g. `P1 · Entity`. */
  short?: string
  /** Throughput one-liner shown in some layouts. */
  throughput?: string
  status: 'queued' | 'running' | 'done' | 'failed'
  progress: number
  detail: string
  hardware: string
  cacheHit: number
  startedAt?: string | null
  etaSec?: number | null
  statusSource?: 'real' | 'mock' | 'simulated'
  progressSource?: 'real' | 'mock' | 'simulated'
}

export interface RunKpi {
  claimsTotal: number
  claimsAccepted: number
  claimsDisputed: number
  /** Open three-lane conflicts (Lattice KPI). */
  openConflicts: number
  humanQueue: number
  cacheHitRate: number
  workflowHealthy: boolean
}

export interface RunState {
  doc: RunDoc
  pipelines: PipelineState[]
  kpi: RunKpi
  pass: { current: number; max: number }
}

export interface AgreementItem {
  jaccard: number
  /** Agreement gate threshold (e.g. 0.85). */
  gate: number
  claims: number
  accepted: number
  disputed: number
  superseded: number
}

export interface AgreementSnapshot {
  perArtifact: Record<ArtifactType, AgreementItem>
}

export interface ChronologyClaim {
  id: string
  claim_id?: string
  date: string
  date_certainty?: string
  page: number
  title: string
  who: string[]
  lane: 'structural' | 'hybrid' | 'table'
  conf: number
  status: 'accepted' | 'disputed' | 'superseded' | 'human_review'
  supersededBy?: string
  supersedeReason?: string
  /** Present when this claim supersedes another (registry line in mock data). */
  supersedes?: string
  disputeNote?: string
  reviewNote?: string
  reasoning?: Reasoning
  dataSource?: 'real' | 'mock' | 'simulated'
}

export interface EntityRow {
  id: string
  canonical: string
  type: string
  mentions: number
  aliases: number
  conf: number
  asic: string | null
  lastSeen: string
  status?: 'accepted' | 'disputed' | 'superseded'
  candidate?: boolean
  recent?: boolean
  reasoning: Reasoning
  dataSource?: 'real' | 'mock' | 'simulated'
}

export interface PersonRow {
  id: string
  name: string
  role: string
  mentions: number
  conf: number
  source: string
  lastSeen: string
  status?: 'accepted' | 'disputed' | 'superseded'
  disputed?: boolean
  review?: boolean
  reasoning: Reasoning
  dataSource?: 'real' | 'mock' | 'simulated'
}

export interface RegisterProvenance {
  chunk_id?: string | null
  page?: number | null
  page_start?: number | null
  page_end?: number | null
  source_uri?: string | null
}
export type RegisterType = 'people' | 'legislation' | 'authority' | 'events' | 'organisation' | 'document'
export interface RegisterRow {
  id: string
  type: RegisterType
  entity: Record<string, unknown>
  provenance: RegisterProvenance[]
  salience_score?: number | null
}
export interface RegisterResponse {
  document_id: string
  namespace: string
  type: RegisterType
  total: number
  rows: RegisterRow[]
  graph_counts?: Record<string, unknown>
  data_source?: string
}

export type GraphEdgeKind = 'entity' | 'provenance' | 'all'

export interface GraphNode {
  id: string
  labels: string[]
  primary_type?: string | null
  name?: string | null
  display_name?: string | null
  salience_score?: number | null
  properties: Record<string, unknown>
}

export interface GraphEdge {
  id: string
  type: string
  source: string
  target: string
  key_props: Record<string, unknown>
  provenance: Record<string, unknown>
  properties: Record<string, unknown>
}

export interface GraphSubgraphResponse {
  namespace: string
  document_id?: string | null
  root_node_id: string
  depth: number
  edge_kinds: GraphEdgeKind
  nodes: GraphNode[]
  edges: GraphEdge[]
  data_source: string
}

export interface ReportSection {
  num: number
  heading: string
  state: 'drafted' | 'drafting' | 'queued' | 'gated'
  body: ReportBlock[] | null
}

export type ReportBlock =
  | { kind: 'paragraph'; spans: ReportSpan[] }
  | { kind: 'placeholder'; text: string }

export type ReportSpan =
  | { kind: 'text'; text: string }
  | { kind: 'cite'; text: string; claimId: string; conf: number; reasoning?: Reasoning }

export interface Conflict3Lane {
  id: string
  artifact: ArtifactType
  subject: string
  jaccard: number
  status: 'iterating' | 'arbiter_pending' | 'resolved'
  claims: {
    lane: 'structural' | 'hybrid' | 'table'
    source: string
    value: string
    conf: number
    evidence: string
  }[]
  authority?: string
  decision?: Reasoning
}

export interface ActivityEvent {
  t: string
  src: string
  type:
    | 'CLAIM'
    | 'CONFLICT'
    | 'DECISION'
    | 'ENTITY'
    | 'SWEEP'
    | 'SYNTHESIS'
    | 'REVIEW'
    | 'EXT'
    | 'CACHE'
    | 'RETRIEVAL'
  level: 'info' | 'ok' | 'warn' | 'bad'
  msg: string
  detail: string
  claimId?: string
  conflictId?: string
  entityId?: string
  artifactType?: ArtifactType
  dataSource?: 'real' | 'mock' | 'simulated'
}

export interface CrossArtifactSignal {
  t: string
  type:
    | 'ENTITY_RESOLVED'
    | 'SECTION_INVALIDATED'
    | 'CONFLICT_OPENED'
    | 'CLAIM_ACCEPTED'
  payload: string
  impact: string
  target: { view: 'chronology' | 'entities' | 'people' | 'exec' | 'detailed'; id?: string }
}

export interface ArtifactSummary {
  id: 'chronology' | 'entities' | 'people' | 'exec' | 'detailed'
  kind: 'list' | 'report'
  name: string
  count?: number
  accepted?: number
  disputed?: number
  superseded?: number
  agreement?: number | null
  gate?: number
  lastUpdate: string
  status: 'iterating' | 'drafting' | 'gated'
  sections?: number
  drafted?: number
  critiqued?: number
  outline?: { h: string; state: 'drafted' | 'drafting' | 'queued' | 'gated' }[]
}

export interface AugmentationStatus {
  eyeciteCitations: number
  austlii: { verified: number; total: number }
  asic: { confirmed: number; total: number }
  companiesHouse: { confirmed: number; total: number }
  edgar: number | null
  courtListener: number | null
}

export interface HardwareSnapshot {
  hosts: {
    name: 'c220m3' | 'gb10' | 'alienware' | 'gympc' | 'cachy01'
    label: string
    role: string
    vramPct: number | null
    ramPct: number | null
  }[]
}

export interface WorkspaceData {
  isRealData: boolean
  doc: RunDoc
  pipelines: PipelineState[]
  kpi: RunKpi
  pass: { current: number; max: number }
  agreement: {
    chronology: AgreementItem
    entity: AgreementItem
    person: AgreementItem
  }
  artifacts: ArtifactSummary[]
  chronology: ChronologyClaim[]
  entities: EntityRow[]
  people: PersonRow[]
  conflicts: Conflict3Lane[]
  signals: CrossArtifactSignal[]
  activity: ActivityEvent[]
  reports: {
    exec: ReportSection[]
    detailed: ReportSection[]
  }
  augmentation: AugmentationStatus
  hardware: HardwareSnapshot
}

export interface MockData {
  doc: RunDoc
  pipelines: PipelineState[]
  chronology: ChronologyClaim[]
  conflicts: Conflict3Lane[]
  agreement: {
    chronology: AgreementItem
    person: AgreementItem
    entity: AgreementItem
  }
  entities: EntityRow[]
  people: PersonRow[]
  artifacts: ArtifactSummary[]
  activity: ActivityEvent[]
  signals: CrossArtifactSignal[]
  reports: {
    exec: ReportSection[]
    detailed: ReportSection[]
  }
  augmentation: AugmentationStatus
  hardware: HardwareSnapshot
}
