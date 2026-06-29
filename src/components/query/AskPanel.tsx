import { useCallback, useState } from 'react'
import { useNav } from '../../context/NavContext'
import { SourceDot } from '../shared/SourceDot'
import type { QueryCitation, QueryResponse } from '../../types/contracts'
import { DATA_SOURCE_LABELS, parseDataSource as parseSourceData } from '../../utils/dataSource'
import type { DataSource } from '../../utils/dataSource'

interface AskPanelProps {
  docId: string
  namespace: string | null
  onBack: () => void
  onGoEvidence?: (nodeId: string) => void
}

type ValidationStatus = 'supported' | 'partial' | 'unsupported'

function parseDataSource(value: string | undefined | null, answerBasis?: string | null): DataSource {
  if (value === 'retrieved_evidence' || answerBasis === 'retrieved_evidence') return 'real'
  return parseSourceData(value)
}

function parseValidationStatus(value: string | undefined): ValidationStatus {
  if (value === 'partial' || value === 'unsupported') return value
  return 'supported'
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('legal_ai_token') ?? ''
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
}

function citationLabel(citation: QueryCitation): string {
  const page = citation.page != null ? ` · p.${citation.page}` : ''
  const source = citation.source.trim() || 'source'
  return `${source}${page}`
}

function matchCitationsToSentences(
  sentences: string[],
  citations: QueryCitation[]
): { sentence: string; citations: QueryCitation[] }[] {
  const used = new Set<number>()
  const blocks = sentences.map((sentence) => {
    const matched = citations.filter((citation, index) => {
      if (used.has(index)) return false
      const markers = [citation.evidence_id, citation.node_id, citation.chunk_id, citation.source].filter(
        (value): value is string => typeof value === 'string' && value.length > 0
      )
      return markers.some((marker) => sentence.includes(marker))
    })
    matched.forEach((citation) => {
      const index = citations.indexOf(citation)
      if (index >= 0) used.add(index)
    })
    return { sentence, citations: matched }
  })

  const unmatched = citations.filter((_, index) => !used.has(index))
  if (unmatched.length > 0 && blocks.length > 0) {
    blocks[blocks.length - 1] = {
      ...blocks[blocks.length - 1],
      citations: [...blocks[blocks.length - 1].citations, ...unmatched],
    }
  } else if (unmatched.length > 0) {
    blocks.push({ sentence: '', citations: unmatched })
  }

  return blocks
}

const VALIDATION_STYLES: Record<
  ValidationStatus,
  { dot: string; label: string; text: string }
> = {
  supported: {
    dot: 'bg-emerald-500',
    label: 'Supported',
    text: 'text-emerald-700',
  },
  partial: {
    dot: 'bg-amber-500',
    label: 'Partial',
    text: 'text-amber-700',
  },
  unsupported: {
    dot: 'bg-red-500',
    label: 'Unsupported',
    text: 'text-red-700',
  },
}

export function AskPanel({ docId, namespace, onBack, onGoEvidence }: AskPanelProps) {
  const nav = useNav()
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [response, setResponse] = useState<QueryResponse | null>(null)
  const [inspectorOpen, setInspectorOpen] = useState(false)

  const handleSubmit = useCallback(async () => {
    const trimmed = question.trim()
    if (!trimmed || loading) return

    setLoading(true)
    setError(null)
    setResponse(null)

    // Build query body preferring document_id, with transitional namespace fallback
    const queryBody: { question: string; document_id?: string | null; namespace?: string | null } = {
      question: trimmed,
      document_id: docId,
    }
    // Transitional compatibility for Core v0.2.7: prefer document_id/pack_id when available.
    if (!docId && namespace) {
      queryBody.namespace = namespace
    }

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(queryBody),
      })

      if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText}`)
      }

      const data = (await res.json()) as QueryResponse
      setResponse(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query failed')
    } finally {
      setLoading(false)
    }
  }, [question, docId, namespace, loading])

  const handleCitationClick = useCallback(
    (citation: QueryCitation) => {
      onBack()
      const highlight = citation.node_id ?? citation.evidence_id ?? undefined
      nav?.go('evidence', highlight)
    },
    [nav, onBack]
  )

  const dataSource = parseDataSource(response?.data_source, response?.answer_basis)
  const validation = parseValidationStatus(response?.validation_status)
  const validationStyle = VALIDATION_STYLES[validation]
  const answerBlocks = response ? matchCitationsToSentences(splitSentences(response.answer), response.citations) : []
  const firstCitationNodeId = response?.citations.find((c) => c.node_id)?.node_id ?? null

  return (
    <div className="theme-atrium flex min-h-screen flex-col bg-[var(--bg)] text-[var(--ink)]">
      <header className="border-b border-[var(--rule)] px-10 py-5">
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="rounded-lg border border-[var(--rule)] bg-[var(--panel)] px-4 py-2 text-[13px] font-medium text-[var(--ink)] shadow-[0_1px_0_var(--rule-soft)] hover:bg-[var(--rule-soft)]"
            onClick={onBack}
          >
            ← Back
          </button>
          <h1 className="font-serif text-[22px] font-medium tracking-tight">Ask the evidence</h1>
          {response && (
            <span className="ml-auto flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--ink-3)]">
              {DATA_SOURCE_LABELS[dataSource]}
              <SourceDot source={dataSource} show />
            </span>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-10 py-8">
        <label className="block">
          <textarea
            rows={2}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                event.preventDefault()
                void handleSubmit()
              }
            }}
            placeholder="Ask a question about this document..."
            className="w-full resize-y rounded-lg border border-[var(--rule)] bg-[var(--panel)] px-4 py-3 font-mono text-[13px] text-[var(--ink)] placeholder:text-[var(--ink-3)] focus:border-[var(--accent)] focus:outline-none"
          />
        </label>

        <button
          type="button"
          disabled={loading || !question.trim() || (!docId && !namespace)}
          onClick={() => void handleSubmit()}
          className="mt-4 font-mono text-[13px] font-semibold text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Ask →
        </button>

        {loading && (
          <p className="mt-8 animate-pulse font-mono text-[13px] text-[var(--ink-2)]">Thinking…</p>
        )}

        {error && (
          <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
            {error}
          </p>
        )}

        {response && !loading && (
          <section className="mt-8 space-y-6">
            <div className="flex flex-wrap items-center gap-4">
              <span
                className={`inline-flex items-center gap-2 rounded-full border border-[var(--rule)] bg-[var(--panel)] px-3 py-1 text-[11px] font-medium ${validationStyle.text}`}
              >
                <span className={`h-2 w-2 rounded-full ${validationStyle.dot}`} />
                {validationStyle.label}
              </span>
              <span className="font-mono text-[11px] text-[var(--ink-3)]">
                confidence {response.confidence.toFixed(2)}
              </span>
            </div>

            {onGoEvidence && firstCitationNodeId && (
              <button
                type="button"
                onClick={() => onGoEvidence(firstCitationNodeId)}
                className="self-start font-mono text-[11px] text-[var(--accent)] underline-offset-2 hover:underline"
              >
                View in graph →
              </button>
            )}

            <div className="space-y-5">
              {answerBlocks.map((block, index) => (
                <div key={`${block.sentence}-${index}`}>
                  {block.sentence && (
                    <p className="font-serif text-[16px] leading-relaxed text-[var(--ink)]">{block.sentence}</p>
                  )}
                  {block.citations.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {block.citations.map((citation) => (
                        <button
                          key={`${citation.evidence_id}-${citation.result_id}-${citation.page ?? 'na'}`}
                          type="button"
                          onClick={() => handleCitationClick(citation)}
                          className="rounded border border-[var(--rule)] bg-[var(--panel-dim)] px-2 py-0.5 font-mono text-[10px] text-[var(--ink-2)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                        >
                          {citationLabel(citation)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {Object.keys(response.retrieval_debug).length > 0 && (
              <div className="border-t border-[var(--rule-soft)] pt-4">
                <button
                  type="button"
                  onClick={() => setInspectorOpen((open) => !open)}
                  className="font-mono text-[11px] text-[var(--ink-3)] hover:text-[var(--ink)]"
                >
                  Inspector {inspectorOpen ? '▴' : '▾'}
                </button>
                {inspectorOpen && (
                  <pre className="mt-3 overflow-x-auto rounded-lg border border-[var(--rule)] bg-[var(--panel)] p-4 font-mono text-[10px] leading-relaxed text-[var(--ink-2)]">
                    {JSON.stringify(response.retrieval_debug, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </section>
        )}

        {!docId && !namespace && !loading && (
          <p className="mt-4 font-mono text-[11px] text-[var(--ink-3)]">
            Waiting for document context — queries will use document scope when available.
          </p>
        )}
      </main>
    </div>
  )
}
