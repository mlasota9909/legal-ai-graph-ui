import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { SourceDot } from '../shared/SourceDot'
import type {
  GraphEdge,
  GraphNode,
  GraphSubgraphResponse,
  RegisterResponse,
  RegisterType,
} from '../../types/contracts'
import type { DataSource } from '../../utils/dataSource'

interface EvidencePanelProps {
  docId: string
  namespace: string | null
  claimId: string | null
  onBack: () => void
}

type LoadPhase = 'waiting-namespace' | 'loading' | 'error' | 'empty' | 'ready'

const NODE_COLORS: Record<string, string> = {
  PERSON: '#60a5fa',
  EVENT: '#34d399',
  AUTHORITY: '#f59e0b',
  LEGISLATION: '#a78bfa',
  ORGANISATION: '#fb923c',
  DOCUMENT: '#64748b',
  CLAIM: '#f87171',
  FINDING: '#e879f9',
}

const NODE_LEGEND = Object.entries(NODE_COLORS)
const GRAPH_DEPTHS = [1, 2, 3] as const
type GraphDepth = (typeof GRAPH_DEPTHS)[number]

const REGISTER_FALLBACK_TYPES: RegisterType[] = ['authority', 'events', 'people']

function nodeColor(node: GraphNode): string {
  const type = node.primary_type?.toUpperCase() ?? ''
  return NODE_COLORS[type] ?? '#94a3b8'
}

function nodeLabel(node: GraphNode): string {
  return node.display_name ?? node.name ?? node.id
}

function nodeVal(node: GraphNode): number {
  return node.salience_score ? node.salience_score * 8 : 4
}

function linkLabel(edge: GraphEdge): string {
  return edge.type
}

function parseDataSource(value: string | undefined): DataSource {
  if (value === 'real' || value === 'simulated') return value
  return 'mock'
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('legal_ai_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function extractPage(provenance: Record<string, unknown>): number | null {
  const page = provenance.page
  if (typeof page === 'number') return page
  const pageStart = provenance.page_start
  if (typeof pageStart === 'number') return pageStart
  return null
}

async function fetchRegister(docId: string, type: RegisterType): Promise<RegisterResponse | null> {
  const response = await fetch(
    `/api/registers/${encodeURIComponent(docId)}?type=${type}&limit=5`,
    { headers: authHeaders() }
  )
  if (!response.ok) return null
  return response.json() as Promise<RegisterResponse>
}

async function resolveRootNode(docId: string, claimId: string | null): Promise<string | null> {
  if (claimId?.includes(':')) {
    return claimId
  }
  // Fall back through register types until a provenance chunk_id is found
  for (const type of REGISTER_FALLBACK_TYPES) {
    const register = await fetchRegister(docId, type)
    const chunkId = register?.rows[0]?.provenance?.[0]?.chunk_id
    if (chunkId) return chunkId
  }
  return null
}

export function EvidencePanel({ docId, namespace, claimId, onBack }: EvidencePanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<LoadPhase>(namespace ? 'loading' : 'waiting-namespace')
  const [graph, setGraph] = useState<GraphSubgraphResponse | null>(null)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [depth, setDepth] = useState<GraphDepth>(2)
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 })

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const updateDimensions = () => {
      setDimensions({
        width: element.offsetWidth,
        height: Math.max(500, window.innerHeight - 200),
      })
    }

    updateDimensions()
    const observer = new ResizeObserver(updateDimensions)
    observer.observe(element)
    window.addEventListener('resize', updateDimensions)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateDimensions)
    }
  }, [])

  useEffect(() => {
    if (!namespace) {
      setPhase('waiting-namespace')
      setGraph(null)
      setSelectedNode(null)
      return
    }

    let cancelled = false

    const loadGraph = async () => {
      setPhase('loading')
      setGraph(null)
      setSelectedNode(null)

      try {
        const rootNode = await resolveRootNode(docId, claimId)
        if (cancelled) return
        if (!rootNode) {
          setPhase('empty')
          return
        }

        const url =
          `/api/graph?namespace=${encodeURIComponent(namespace)}` +
          `&node=${encodeURIComponent(rootNode)}&edge_kinds=entity&depth=${depth}`
        const response = await fetch(url, { headers: authHeaders() })
        if (cancelled) return
        if (!response.ok) {
          setPhase('error')
          return
        }

        const data = (await response.json()) as GraphSubgraphResponse
        if (cancelled) return
        if (!data.nodes?.length) {
          setPhase('empty')
          return
        }

        setGraph(data)
        setPhase('ready')
      } catch {
        if (!cancelled) setPhase('error')
      }
    }

    void loadGraph()
    return () => {
      cancelled = true
    }
  }, [namespace, docId, claimId, depth])

  const graphData = useMemo(() => {
    if (!graph) return { nodes: [], links: [] }
    return { nodes: graph.nodes, links: graph.edges }
  }, [graph])

  const connectedEdges = useMemo(() => {
    if (!selectedNode || !graph) return []
    return graph.edges.filter(
      (edge) => edge.source === selectedNode.id || edge.target === selectedNode.id
    )
  }, [selectedNode, graph])

  const edgeTypes = useMemo(() => {
    const types = new Set(connectedEdges.map((edge) => edge.type))
    return [...types]
  }, [connectedEdges])

  const provenancePages = useMemo(() => {
    const pages = new Set<number>()
    for (const edge of connectedEdges) {
      const page = extractPage(edge.provenance)
      if (page !== null) pages.add(page)
    }
    return [...pages].sort((a, b) => a - b)
  }, [connectedEdges])

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node)
  }, [])

  const dataSource = parseDataSource(graph?.data_source)

  if (phase === 'waiting-namespace') {
    return (
      <div className="theme-atrium flex min-h-screen items-center justify-center bg-[var(--bg)] text-[var(--ink)]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--rule)] border-t-[var(--accent)]" />
          <p className="text-[14px] text-[var(--ink-2)]">Loading...</p>
        </div>
      </div>
    )
  }

  if (phase === 'loading') {
    return (
      <div className="theme-atrium min-h-screen bg-[var(--bg)] px-10 py-12 text-[var(--ink)]">
        <button
          type="button"
          className="rounded-lg border border-[var(--rule)] bg-[var(--panel)] px-4 py-2 text-[13px] font-medium text-[var(--ink)] shadow-[0_1px_0_var(--rule-soft)] hover:bg-[var(--rule-soft)]"
          onClick={onBack}
        >
          ← Back to monitor
        </button>
        <p className="mt-8 text-[14px] text-[var(--ink-2)]">Loading graph...</p>
      </div>
    )
  }

  if (phase === 'error' || phase === 'empty') {
    return (
      <div className="theme-atrium min-h-screen bg-[var(--bg)] px-10 py-12 text-[var(--ink)]">
        <button
          type="button"
          className="rounded-lg border border-[var(--rule)] bg-[var(--panel)] px-4 py-2 text-[13px] font-medium text-[var(--ink)] shadow-[0_1px_0_var(--rule-soft)] hover:bg-[var(--rule-soft)]"
          onClick={onBack}
        >
          ← Back to monitor
        </button>
        <p className="mt-8 text-[14px] text-[var(--ink-2)]">
          No relationship data available for this document
        </p>
      </div>
    )
  }

  return (
    <div className="theme-atrium flex min-h-screen flex-col bg-[var(--bg)] text-[var(--ink)]">
      <header className="border-b border-[var(--rule)] px-10 py-5">
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="rounded-lg border border-[var(--rule)] bg-[var(--panel)] px-4 py-2 text-[13px] font-medium text-[var(--ink)] shadow-[0_1px_0_var(--rule-soft)] hover:bg-[var(--rule-soft)]"
            onClick={onBack}
          >
            ← Back to monitor
          </button>
          <h1 className="font-serif text-[22px] font-medium tracking-tight">Evidence graph</h1>
          <span className="font-mono text-[11px] text-[var(--ink-3)]">
            {graph?.nodes.length ?? 0} nodes · {graph?.edges.length ?? 0} edges
          </span>
          <div className="flex items-center gap-1 font-mono text-[11px] text-[var(--ink-3)]">
            {GRAPH_DEPTHS.map((value, index) => (
              <span key={value} className="flex items-center gap-1">
                <button
                  type="button"
                  className={`rounded border px-2 py-1 ${
                    depth === value
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                      : 'border-[var(--rule)] text-[var(--ink-3)]'
                  }`}
                  onClick={() => setDepth(value)}
                >
                  {value} {value === 1 ? 'hop' : 'hops'}
                </button>
                {index < GRAPH_DEPTHS.length - 1 && <span>·</span>}
              </span>
            ))}
          </div>
          <span className="ml-auto flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--ink-3)]">
            {dataSource} data
            <SourceDot source={dataSource} show />
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
          {NODE_LEGEND.map(([type, color]) => (
            <span key={type} className="flex items-center gap-1.5">
              <span style={{ background: color }} className="h-2 w-2 rounded-full" />
              <span className="font-mono text-[10px] text-[var(--ink-3)]">
                {type.toLowerCase()}
              </span>
            </span>
          ))}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div ref={containerRef} className="min-w-0 flex-1">
          <ForceGraph2D
            graphData={graphData}
            width={dimensions.width}
            height={dimensions.height}
            backgroundColor="#111827"
            nodeId="id"
            nodeLabel={nodeLabel}
            nodeColor={nodeColor}
            nodeRelSize={5}
            nodeVal={nodeVal}
            linkLabel={linkLabel}
            linkColor={() => 'rgba(148, 163, 184, 0.4)'}
            onNodeClick={handleNodeClick}
          />
        </div>

        {selectedNode && (
          <aside className="w-80 shrink-0 overflow-y-auto border-l border-[var(--rule)] bg-[var(--panel)] p-6">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-serif text-[20px] font-medium leading-snug">
                {selectedNode.display_name ?? selectedNode.name ?? selectedNode.id}
              </h2>
              <button
                type="button"
                className="shrink-0 text-[18px] leading-none text-[var(--ink-3)] hover:text-[var(--ink)]"
                onClick={() => setSelectedNode(null)}
                aria-label="Deselect node"
              >
                ×
              </button>
            </div>

            {selectedNode.primary_type && (
              <span className="mt-2 inline-block rounded bg-[var(--rule-soft)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--ink-3)]">
                {selectedNode.primary_type}
              </span>
            )}

            {selectedNode.salience_score != null && (
              <p className="mt-4 font-mono text-[12px] text-[var(--ink-2)]">
                Salience: {selectedNode.salience_score.toFixed(2)}
              </p>
            )}

            {edgeTypes.length > 0 && (
              <div className="mt-5">
                <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--ink-3)]">
                  Connected edges
                </h3>
                <ul className="mt-2 space-y-1">
                  {edgeTypes.map((type) => (
                    <li key={type} className="font-mono text-[12px] text-[var(--ink-2)]">
                      {type}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {connectedEdges.some((edge) => Object.keys(edge.key_props).length > 0) && (
              <div className="mt-5">
                <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--ink-3)]">
                  Edge properties
                </h3>
                <ul className="mt-2 space-y-2">
                  {connectedEdges
                    .filter((edge) => Object.keys(edge.key_props).length > 0)
                    .map((edge) => (
                      <li key={edge.id} className="text-[12px] text-[var(--ink-2)]">
                        <span className="font-mono text-[var(--ink)]">{edge.type}</span>
                        <ul className="mt-1 space-y-0.5 pl-2">
                          {Object.entries(edge.key_props).map(([key, value]) => (
                            <li key={key} className="font-mono text-[11px]">
                              {key}: {String(value)}
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                </ul>
              </div>
            )}

            {provenancePages.length > 0 && (
              <div className="mt-5">
                <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--ink-3)]">
                  Provenance pages
                </h3>
                <p className="mt-2 font-mono text-[12px] text-[var(--ink-2)]">
                  {provenancePages.map((page) => `p. ${page}`).join(', ')}
                </p>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  )
}
