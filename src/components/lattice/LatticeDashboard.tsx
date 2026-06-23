import { useEffect, useRef, useState } from 'react'
import type { ActivityEvent, AgreementItem, ArtifactSummary, WorkspaceData } from '../../types/contracts'
import { useNav } from '../../context/NavContext'
import { isListArtifactId, loadedListCount } from '../../utils/listArtifactRows'
import { SourceDot } from '../shared/SourceDot'
import type { DataSource } from '../../utils/dataSource'

interface LatticeDashboardProps {
  data: WorkspaceData
}

const ACTIVITY_FILTERS = ['all', 'conflicts', 'decisions', 'claims', 'entity', 'synthesis', 'ext'] as const

type ActivityFilter = (typeof ACTIVITY_FILTERS)[number]

interface StatusRun {
  document_id: string
  label?: string | null
  pipeline_stage?: string | null
  upload_ts?: string | null
  chronology_status?: string | null
}

interface StatusListResponse {
  documents?: StatusRun[]
}

function formatRunTime(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString([], {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function DocumentPicker({ activeId, title }: { activeId: string; title: string }) {
  const nav = useNav()
  const selectRun = nav?.selectRun
  const [open, setOpen] = useState(false)
  const [runs, setRuns] = useState<StatusRun[]>([])
  const autoSelected = useRef(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const response = await fetch('/api/status')
        if (!response.ok) return
        const payload = (await response.json()) as StatusListResponse | StatusRun[]
        const documents = Array.isArray(payload) ? payload : payload.documents ?? []
        const recent = documents
          .filter((run) => run.document_id)
          .sort((a, b) => Date.parse(b.upload_ts ?? '') - Date.parse(a.upload_ts ?? ''))
          .slice(0, 10)
        if (!cancelled) setRuns(recent)
        const initialRun = recent.find((run) => run.chronology_status === 'completed') ?? recent[0]
        if (!cancelled && !autoSelected.current && activeId.startsWith('doc_') && initialRun) {
          autoSelected.current = true
          selectRun?.(initialRun.document_id)
        }
      } catch {
        if (!cancelled) setRuns([])
      }
    }
    void load()
    const timer = window.setInterval(() => void load(), 30000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [activeId, selectRun])

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((next) => !next)}
        className="max-w-full truncate text-left text-[13px] font-semibold text-[var(--ink)] hover:text-[var(--accent)]"
      >
        Currently showing: {title} ▼
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-2 w-[520px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-[var(--rule)] bg-[var(--panel)] shadow-lg">
          {runs.map((run) => (
            <button
              type="button"
              key={run.document_id}
              onClick={() => {
                selectRun?.(run.document_id)
                setOpen(false)
              }}
              className={`grid w-full grid-cols-[1fr_132px_112px] gap-3 border-b border-[var(--rule-soft)] px-3 py-2 text-left text-[11.5px] last:border-b-0 hover:bg-[var(--panel-dim)] ${
                run.document_id === activeId ? 'bg-[var(--accent-soft)]' : ''
              }`}
            >
              <span className="truncate font-medium text-[var(--ink)]">{run.label ?? run.document_id}</span>
              <span className="truncate font-mono text-[var(--ink-2)]">{run.pipeline_stage ?? '—'}</span>
              <span className="font-mono text-[var(--ink-3)]">{formatRunTime(run.upload_ts)}</span>
            </button>
          ))}
          {runs.length === 0 && <div className="px-3 py-2 text-[11.5px] text-[var(--ink-3)]">No live runs found.</div>}
        </div>
      )}
    </div>
  )
}

function activityTarget(event: ActivityEvent): {
  view: 'chronology' | 'entities' | 'people' | 'exec' | 'detailed'
} | null {
  if (event.type === 'ENTITY' || event.type === 'SWEEP') return { view: 'entities' }
  if (event.type === 'SYNTHESIS' || event.type === 'REVIEW') {
    const m = event.msg.toLowerCase()
    return { view: m.includes('detailed') ? 'detailed' : 'exec' }
  }
  if (event.type === 'EXT') return { view: 'entities' }
  if (event.type === 'CACHE' || event.type === 'RETRIEVAL') return null
  if (event.type === 'CLAIM' || event.type === 'CONFLICT' || event.type === 'DECISION') {
    const msg = event.msg
    if (/^PERSON|Acting Secretary|Witness/i.test(msg)) return { view: 'people' }
    if (/^CHRONOLOGY|OMCS|Settlement|Class action|date/i.test(msg)) return { view: 'chronology' }
    if (/^ENTITY|Department|canonical/i.test(msg)) return { view: 'entities' }
    if (/^AUTHORITY/i.test(msg)) return { view: 'chronology' }
    if (/exec memo|critic/i.test(msg.toLowerCase())) return { view: 'exec' }
    if (/settlement quantum|cf01/i.test(msg.toLowerCase())) return { view: 'chronology' }
    return { view: 'chronology' }
  }
  return null
}

function KpiCell({ label, value, delta, tone, source = 'mock' }: { label: string; value: string; delta?: string; tone?: 'ok' | 'warn'; source?: DataSource }) {
  const nav = useNav()
  const toneClass = tone === 'ok' ? 'text-[var(--good)]' : tone === 'warn' ? 'text-[var(--warn)]' : 'text-[var(--ink)]'
  return (
    <div className="flex min-w-[122px] flex-col justify-center border-r border-[var(--rule)] px-4 py-3 last:border-r-0">
      <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-3)]">
        {label}<SourceDot source={source} show={nav?.showSources ?? false} />
      </div>
      <div className={`font-mono text-[18px] font-semibold ${toneClass}`}>{value}</div>
      {delta && <div className="font-mono text-[10.5px] text-[var(--ink-3)]">{delta}</div>}
    </div>
  )
}

function AgreementColumn({ label, item }: { label: string; item: AgreementItem }) {
  const nav = useNav()
  const ok = item.jaccard >= item.gate
  return (
    <div className="border-r border-[var(--rule-soft)] px-4 py-3 last:border-r-0">
      <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-3)]">
        {label}<SourceDot source="mock" show={nav?.showSources ?? false} />
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="font-mono text-[20px] font-semibold text-[var(--ink)]">{item.jaccard.toFixed(2)}</span>
        <span
          className={`rounded px-1.5 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.04em] ${
            ok ? 'bg-[var(--good-soft)] text-[var(--good)]' : 'bg-[var(--warn-soft)] text-[var(--warn)]'
          }`}
        >
          {ok ? '>= gate' : 'iter'}
        </span>
      </div>
      <div className="relative mt-2 h-1 rounded-full bg-[var(--rule-soft)]">
        <div
          className={`absolute inset-y-0 left-0 rounded-full ${ok ? 'bg-[var(--good)]' : 'bg-[var(--warn)]'}`}
          style={{ width: `${item.jaccard * 100}%` }}
        />
        <div className="absolute -top-0.5 h-2 w-px bg-[var(--ink-2)]" style={{ left: `${item.gate * 100}%` }} />
      </div>
      <div className="mt-2 flex justify-between font-mono text-[10px] text-[var(--ink-3)]">
        <span>
          {item.accepted}/{item.claims} accepted
        </span>
        <span>
          {item.disputed} disp - {item.superseded} sup
        </span>
      </div>
    </div>
  )
}

function ActivityLog({ data }: { data: WorkspaceData }) {
  const nav = useNav()
  const [filter, setFilter] = useState<ActivityFilter>('all')

  const counts = {
    all: data.activity.length,
    conflicts: data.activity.filter((a) => a.type === 'CONFLICT').length,
    decisions: data.activity.filter((a) => a.type === 'DECISION').length,
    claims: data.activity.filter((a) => a.type === 'CLAIM').length,
    entity: data.activity.filter((a) => a.type === 'ENTITY' || a.type === 'SWEEP').length,
    synthesis: data.activity.filter((a) => a.type === 'SYNTHESIS' || a.type === 'REVIEW').length,
    ext: data.activity.filter((a) => a.type === 'EXT').length,
  }

  const rows = data.activity.filter((a) => {
    if (filter === 'all') return true
    if (filter === 'conflicts') return a.type === 'CONFLICT'
    if (filter === 'decisions') return a.type === 'DECISION'
    if (filter === 'claims') return a.type === 'CLAIM'
    if (filter === 'entity') return a.type === 'ENTITY' || a.type === 'SWEEP'
    if (filter === 'synthesis') return a.type === 'SYNTHESIS' || a.type === 'REVIEW'
    if (filter === 'ext') return a.type === 'EXT'
    return true
  })

  return (
    <div className="rounded-lg border border-[var(--rule)] bg-[var(--panel)]">
      <div className="flex items-center justify-between border-b border-[var(--rule)] bg-[var(--panel-dim)] px-4 py-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-2)]">
          Activity log - live
        </h3>
        <div className="font-mono text-[10.5px] text-[var(--ink-3)]">streaming - last 1m: 47 events</div>
      </div>
      <div className="flex flex-wrap gap-1 border-b border-[var(--rule)] bg-[var(--panel-dim)] px-2 pt-2">
        {ACTIVITY_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`mb-2 flex items-center gap-2 rounded border-b-2 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.04em] ${
              filter === f
                ? 'border-[var(--accent)] text-[var(--ink)]'
                : 'border-transparent text-[var(--ink-3)] hover:text-[var(--ink-2)]'
            }`}
          >
            {f}
            <span
              className={`rounded px-1.5 py-0.5 text-[9.5px] ${
                filter === f ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'bg-[var(--rule-soft)] text-[var(--ink-3)]'
              }`}
            >
              {counts[f].toLocaleString()}
            </span>
          </button>
        ))}
      </div>
      <div className="max-h-[440px] overflow-y-auto font-mono text-[11.5px]">
        {rows.map((row, idx) => {
          const target = activityTarget(row)
          const clickable = Boolean(target && nav)
          return (
            <div
              key={`${row.t}-${idx}`}
              onClick={() => (clickable ? nav?.go(target!.view) : undefined)}
              className={`grid grid-cols-[78px_22px_120px_90px_1fr] gap-3 border-b border-[var(--rule-soft)] px-4 py-2 last:border-b-0 ${
                row.level === 'bad'
                  ? 'bg-[#fcf1ee]'
                  : row.level === 'warn'
                    ? 'bg-[#fef8ec]'
                    : ''
              } ${clickable ? 'cursor-pointer hover:bg-[var(--panel-dim)]' : ''}`}
            >
              <span className="text-[var(--ink-3)]">{row.t}</span>
              <span className="flex items-start justify-center">
                <span
                  className={`mt-1 h-2 w-2 rounded-full ${
                    row.level === 'ok'
                      ? 'bg-[#46a65e]'
                      : row.level === 'warn'
                        ? 'bg-[#dc9a3e]'
                        : row.level === 'bad'
                          ? 'bg-[#e36458]'
                          : 'bg-[var(--ink-4)]'
                  }`}
                />
              </span>
              <span className="truncate text-[var(--ink-2)]">{row.src}</span>
              <span
                className={`w-fit rounded px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.06em] ${
                  row.type === 'CLAIM'
                    ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                    : row.type === 'DECISION'
                      ? 'bg-[#efe5fb] text-[var(--lane-b)]'
                      : row.type === 'CONFLICT'
                        ? 'bg-[var(--warn-soft)] text-[var(--warn)]'
                        : row.type === 'ENTITY'
                          ? 'bg-[var(--good-soft)] text-[var(--good)]'
                          : row.type === 'SYNTHESIS'
                            ? 'bg-[#fff2e0] text-[var(--warn)]'
                            : row.type === 'EXT'
                              ? 'bg-[#e5f1fa] text-[var(--accent)]'
                              : row.type === 'REVIEW'
                                ? 'bg-[var(--bad-soft)] text-[var(--bad)]'
                                : 'bg-[var(--rule-soft)] text-[var(--ink-3)]'
                }`}
              >
                {row.type}
              </span>
              <span className="text-[var(--ink)]">
                {row.msg}
                <SourceDot source={row.dataSource ?? 'mock'} show={nav?.showSources ?? false} />
                <span className="mt-1 block text-[10.5px] text-[var(--ink-3)]">{row.detail}</span>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ArtifactCard({ artifact, data }: { artifact: ArtifactSummary; data: WorkspaceData }) {
  const nav = useNav()
  const isReport = artifact.kind === 'report'
  const loadedCount = isListArtifactId(artifact.id) ? loadedListCount(data, artifact.id) : 0
  const runTotal = artifact.count ?? artifact.sections ?? 0
  const meterTotal = isReport ? runTotal : loadedCount || runTotal
  const accepted = artifact.accepted ?? 0
  const disputed = artifact.disputed ?? 0
  const superseded = artifact.superseded ?? 0
  const artifactSource = artifact.id === 'people' && data.people.some((row) => row.dataSource === 'real') ? 'real' : 'mock'

  const listItems = () => {
    if (artifact.id === 'chronology') {
      return data.chronology.slice(0, 5).map((item) => ({
        id: item.id,
        title: item.title,
        meta: `${item.date} - p.${item.page}`,
        conf: item.conf,
        status: item.status,
      }))
    }
    if (artifact.id === 'entities') {
      return data.entities.slice(0, 5).map((item) => ({
        id: item.id,
        title: item.canonical,
        meta: `${item.type.replace(/_/g, ' ').toLowerCase()} · ${item.mentions}×`,
        conf: item.conf,
        status: item.candidate ? 'candidate' : undefined,
      }))
    }
    if (artifact.id === 'people') {
      return data.people.slice(0, 5).map((item) => ({
        id: item.id,
        title: item.name,
        meta: item.role,
        conf: item.conf,
        status: item.review ? 'review' : item.disputed ? 'disputed' : undefined,
      }))
    }
    return []
  }

  return (
    <div
      className={`flex min-h-[220px] flex-col overflow-hidden rounded-lg border border-[var(--rule)] bg-[var(--panel)] ${
        nav ? 'cursor-pointer transition hover:border-[var(--ink-4)] hover:shadow-md' : ''
      }`}
      onClick={() => (nav ? nav.go(artifact.id, undefined, 'all') : undefined)}
    >
      <div className="flex items-start justify-between gap-3 border-b border-[var(--rule-soft)] px-3 py-2">
        <div className="min-w-0">
          <div className={`font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--ink-3)] ${isReport ? 'text-[var(--warn)]' : ''}`}>
            {isReport ? 'report' : 'list'}
          </div>
          <div className="truncate text-[13px] font-semibold text-[var(--ink)]">
            {artifact.name}<SourceDot source={artifactSource} show={nav?.showSources ?? false} />
          </div>
        </div>
        <span
          className={`rounded px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.04em] ${
            artifact.status === 'drafting'
              ? 'bg-[var(--warn-soft)] text-[var(--warn)]'
              : artifact.status === 'gated'
                ? 'bg-[var(--rule-soft)] text-[var(--ink-3)]'
                : 'bg-[var(--accent-soft)] text-[var(--accent)]'
          }`}
        >
          {artifact.status}
        </span>
      </div>
      <div className="border-b border-[var(--rule-soft)] bg-[var(--panel-dim)] px-3 py-2">
        {isReport ? (
          <div className="flex items-baseline justify-between font-mono text-[10.5px] text-[var(--ink-3)]">
            <span>
              <b className="text-[15px] text-[var(--ink)]">{artifact.drafted}</b>/{artifact.sections} drafted
            </span>
            <span>{artifact.critiqued} critic</span>
          </div>
        ) : (
          <>
            <div className="flex items-baseline justify-between font-mono text-[10.5px] text-[var(--ink-3)]">
              <span>Agreement</span>
              <b className="text-[15px] text-[var(--ink)]">{(artifact.agreement ?? 0).toFixed(2)}</b>
            </div>
            <div className="mt-1 flex items-baseline justify-between font-mono text-[10.5px] text-[var(--ink-3)]">
              <span>
                <b className="text-[15px] text-[var(--ink)]">{accepted}</b> accepted<SourceDot source={artifactSource} show={nav?.showSources ?? false} />
              </span>
              <span>
                {disputed} disp · {superseded} sup
              </span>
            </div>
          </>
        )}
        {!isReport && (
          <div className="mt-2 flex h-1 overflow-hidden rounded-full bg-[var(--rule-soft)]">
            <div className="h-full bg-[var(--good)]" style={{ width: `${(accepted / meterTotal) * 100}%` }} />
            <div className="h-full bg-[var(--warn)]" style={{ width: `${(disputed / meterTotal) * 100}%` }} />
            <div className="h-full bg-[var(--ink-4)]" style={{ width: `${(superseded / meterTotal) * 100}%` }} />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 px-3 py-2 text-[11px]">
        {isReport && artifact.outline
          ? artifact.outline.slice(0, 5).map((row) => (
              <div key={row.h} className="flex items-center justify-between gap-2 border-b border-dashed border-[var(--rule-soft)] pb-2 last:border-b-0">
                <div className="min-w-0 truncate text-[var(--ink)]">{row.h}</div>
                <span
                  className={`rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.04em] ${
                    row.state === 'drafted'
                      ? 'bg-[var(--good-soft)] text-[var(--good)]'
                      : row.state === 'drafting'
                        ? 'bg-[var(--warn-soft)] text-[var(--warn)]'
                        : 'bg-[var(--rule-soft)] text-[var(--ink-3)]'
                  }`}
                >
                  {row.state}
                </span>
              </div>
            ))
          : listItems().map((row) => (
              <div key={row.id} className="flex items-start justify-between gap-3 border-b border-dashed border-[var(--rule-soft)] pb-2 last:border-b-0">
                <div className="min-w-0">
                  <div className={`truncate text-[11px] ${row.status === 'superseded' ? 'line-through text-[var(--ink-3)]' : 'text-[var(--ink)]'}`}>
                    {row.title}
                  </div>
                  <div className="mt-1 flex items-center gap-2 font-mono text-[9.5px] text-[var(--ink-3)]">
                    <span>{row.meta}</span>
                    {row.status && (
                      <span
                        className={`rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.04em] ${
                          row.status === 'disputed'
                            ? 'bg-[var(--warn-soft)] text-[var(--warn)]'
                            : row.status === 'human_review' || row.status === 'review'
                              ? 'bg-[var(--bad-soft)] text-[var(--bad)]'
                              : row.status === 'superseded'
                                ? 'bg-[var(--rule-soft)] text-[var(--ink-3)]'
                              : row.status === 'candidate'
                                ? 'bg-[#f1ecfa] text-[var(--lane-b)]'
                              : 'bg-[var(--good-soft)] text-[var(--good)]'
                        }`}
                      >
                        {row.status}
                      </span>
                    )}
                  </div>
                </div>
                <div
                  className={`font-mono text-[9.5px] ${
                    row.conf < 0.6 ? 'text-[var(--bad)]' : row.conf < 0.8 ? 'text-[var(--warn)]' : 'text-[var(--ink-2)]'
                  }`}
                >
                  {row.conf.toFixed(2)}
                </div>
              </div>
            ))}
      </div>
      <div
        className="flex items-center justify-between border-t border-[var(--rule-soft)] bg-[var(--panel-dim)] px-3 py-2 font-mono text-[10px] text-[var(--ink-3)]"
        onClick={(e) => {
          e.stopPropagation()
          if (nav) nav.go(artifact.id, undefined, 'all')
        }}
      >
        <span>updated {artifact.lastUpdate}</span>
        <span className="cursor-pointer font-semibold text-[var(--accent)] hover:underline">
          View all {runTotal.toLocaleString()} →
        </span>
      </div>
    </div>
  )
}

export function LatticeDashboard({ data }: LatticeDashboardProps) {
  const nav = useNav()
  const showSources = nav?.showSources ?? false
  return (
    <div className="theme-lattice min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <div className="flex flex-wrap border-b border-[var(--rule)] bg-[var(--panel)]">
        <div className="flex min-w-[208px] items-center gap-3 border-r border-[var(--rule)] px-4 py-3 font-semibold">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-[var(--accent)] to-[var(--lane-b)] text-[10px] font-bold uppercase text-white">
            LA
          </div>
          <div className="text-[13px]">legal-ai · operator</div>
          <button
            type="button"
            onClick={() => nav?.toggleSources()}
            className={`ml-1 rounded border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.04em] ${
              showSources
                ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'border-[var(--rule)] text-[var(--ink-3)]'
            }`}
          >
            Sources<SourceDot source="real" show />
          </button>
        </div>
        <div className="flex min-w-[220px] flex-1 flex-col justify-center border-r border-[var(--rule)] px-4 py-2">
          <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-3)]">Active run</div>
          <DocumentPicker activeId={data.doc.id} title={data.doc.title} />
          <div className="font-mono text-[11px] text-[var(--ink-3)]">
            {data.doc.id} · {data.doc.pages.toLocaleString()}pp · {data.doc.docType.toLowerCase().replace(/_/g, ' ')}
            <SourceDot source={data.isRealData ? 'real' : 'mock'} show={showSources} /> ·{' '}
            {data.doc.jurisdiction}
          </div>
        </div>
        <KpiCell
          label="Time"
          value={`${data.doc.elapsedHours.toFixed(1)}h`}
          delta={`of ${data.doc.timeBudgetHours}h · ${((data.doc.elapsedHours / data.doc.timeBudgetHours) * 100).toFixed(0)}%`}
        />
        <KpiCell label="Claims" value={data.kpi.claimsTotal.toLocaleString()} delta="+18 / min" source="simulated" />
        <KpiCell label="Conflicts" value={String(data.kpi.openConflicts)} tone="warn" delta="1 arbiter · 1 iterating" source="mock" />
        <KpiCell label="Human queue" value={String(data.kpi.humanQueue)} tone="warn" delta="2 person · 1 chrono" source="mock" />
        <KpiCell label="SGLang cache" value={`${Math.round(data.kpi.cacheHitRate * 100)}%`} tone="ok" delta="↑ vs 30% floor" source="simulated" />
        <KpiCell label="Workflow" value="OK" tone="ok" delta="0 retries · Temporal" />
      </div>

      <div className="space-y-5 px-6 py-5">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="overflow-hidden rounded-lg border border-[var(--rule)] bg-[var(--panel)]">
              <div className="border-b border-[var(--rule)] bg-[var(--panel-dim)] px-4 py-2">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-2)]">Pipelines</h3>
              </div>
              <table className="w-full text-[11.5px]">
                <thead className="bg-[var(--panel-dim)] text-[9.5px] uppercase tracking-[0.08em] text-[var(--ink-3)]">
                  <tr>
                    <th className="px-3 py-2 text-left">ID</th>
                    <th className="px-3 py-2 text-left">Pipeline</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Progress</th>
                    <th className="px-3 py-2 text-right">%</th>
                  </tr>
                </thead>
                <tbody>
                  {data.pipelines.map((pipe) => (
                    <tr key={pipe.id} className="border-b border-[var(--rule-soft)] last:border-b-0">
                      <td className="px-3 py-2 font-mono text-[var(--ink-3)]">P{pipe.id}</td>
                      <td className="px-3 py-2">
                        <div className="font-medium text-[var(--ink)]">
                          {pipe.name}<SourceDot source={pipe.statusSource ?? 'mock'} show={showSources} />
                        </div>
                        <div className="text-[10px] text-[var(--ink-3)]">{pipe.detail}</div>
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`rounded px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.06em] ${
                            pipe.status === 'running'
                              ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                              : pipe.status === 'done'
                                ? 'bg-[var(--good-soft)] text-[var(--good)]'
                                : 'bg-[var(--rule-soft)] text-[var(--ink-3)]'
                          }`}
                        >
                          {pipe.status}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[var(--rule-soft)]">
                          <div
                            className={`${pipe.status === 'done' ? 'bg-[var(--good)]' : pipe.status === 'queued' ? 'bg-[var(--ink-4)]' : 'bg-[var(--accent)]'} h-full`}
                            style={{ width: `${pipe.progress * 100}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[var(--ink)]">
                        {(pipe.progress * 100).toFixed(0)}%<SourceDot source={pipe.progressSource ?? 'mock'} show={showSources} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="space-y-4 lg:col-span-4">
            <div className="rounded-lg border border-[var(--rule)] bg-[var(--panel)]">
              <div className="border-b border-[var(--rule)] bg-[var(--panel-dim)] px-4 py-2">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-2)]">Agreement</h3>
              </div>
              <div className="grid grid-cols-1 gap-0 sm:grid-cols-3">
                <AgreementColumn label="Chronology" item={data.agreement.chronology} />
                <AgreementColumn label="People" item={data.agreement.person} />
                <AgreementColumn label="Entity" item={data.agreement.entity} />
              </div>
            </div>
            <div className="rounded-lg border border-[var(--rule)] bg-[var(--panel)]">
              <div className="border-b border-[var(--rule)] bg-[var(--panel-dim)] px-4 py-2">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-2)]">Time budget</h3>
              </div>
              <div className="flex items-center gap-4 px-4 py-3">
                <div className="font-mono text-[18px] font-semibold text-[var(--ink)]">
                  {data.doc.elapsedHours.toFixed(1)}
                  <span className="ml-1 text-[11px] font-normal text-[var(--ink-3)]">of {data.doc.timeBudgetHours}h</span>
                </div>
                <div className="flex-1">
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--rule-soft)]">
                    <div
                      className="h-full bg-[var(--accent)]"
                      style={{ width: `${(data.doc.elapsedHours / data.doc.timeBudgetHours) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="font-mono text-[11px] text-[var(--ink-3)]">eta 8.6h</div>
              </div>
            </div>
          </div>
        </div>

        <ActivityLog data={data} />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
          {data.artifacts.map((artifact) => (
            <ArtifactCard key={artifact.id} artifact={artifact} data={data} />
          ))}
          <button
            type="button"
            onClick={() => nav?.go('evidence')}
            className="flex flex-col justify-between overflow-hidden rounded-lg border border-[var(--rule)] bg-[var(--panel)] text-left hover:bg-[var(--bg)]"
          >
            <div className="flex-1 p-4">
              <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-3)]">Evidence</div>
              <div className="mt-2 font-serif text-[17px] font-medium text-[var(--ink)]">Relationship graph</div>
              <div className="mt-2 text-[11.5px] leading-relaxed text-[var(--ink-2)]">Entity relationships from the evidence graph</div>
            </div>
            <div className="flex items-center justify-end border-t border-[var(--rule-soft)] bg-[var(--panel-dim)] px-3 py-2 font-mono text-[10px] text-[var(--accent)] hover:underline">
              View graph →
            </div>
          </button>
        </div>

        <div className="rounded-lg border border-[var(--rule)] bg-[var(--panel)]">
          <div className="border-b border-[var(--rule)] bg-[#fff8ec] px-4 py-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--warn)]">Conflict viewer</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-2">
            {data.conflicts.map((conflict) => (
              <div key={conflict.id} className="overflow-hidden rounded-lg border border-[var(--rule)]">
                <div className="flex items-center gap-3 border-b border-[var(--rule-soft)] bg-[#fff8ec] px-4 py-2">
                  <span className="rounded bg-[var(--warn-soft)] px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--warn)]">
                    {conflict.id}
                  </span>
                  <span className="flex-1 truncate text-[12px] font-semibold text-[var(--ink)]">{conflict.subject}</span>
                  <span className="font-mono text-[10.5px] text-[var(--warn)]">J {conflict.jaccard.toFixed(2)}</span>
                </div>
                <div className="grid grid-cols-1 border-b border-[var(--rule-soft)] md:grid-cols-3">
                  {conflict.claims.map((claim) => (
                    <div key={claim.lane} className="border-r border-[var(--rule-soft)] p-3 last:border-r-0">
                      <div
                        className={`mb-2 inline-flex items-center gap-2 font-mono text-[9.5px] font-semibold uppercase tracking-[0.06em] ${
                          claim.lane === 'structural'
                            ? 'text-[var(--lane-a)]'
                            : claim.lane === 'hybrid'
                              ? 'text-[var(--lane-b)]'
                              : 'text-[var(--lane-c)]'
                        }`}
                      >
                        <span className={`h-2 w-2 rounded ${claim.lane === 'structural' ? 'bg-[var(--lane-a)]' : claim.lane === 'hybrid' ? 'bg-[var(--lane-b)]' : 'bg-[var(--lane-c)]'}`} />
                        {claim.lane}
                      </div>
                      <div className="font-mono text-[12.5px] font-semibold text-[var(--ink)]">{claim.value}</div>
                      <div className="mt-1 font-mono text-[10px] text-[var(--ink-3)]">{claim.source}</div>
                      <div className="mt-2 rounded border-l-2 border-current bg-[var(--panel-dim)] px-2 py-1 text-[10.5px] text-[var(--ink-2)]">
                        {claim.evidence}
                      </div>
                      <div className="mt-2 flex items-center gap-2 font-mono text-[10px] text-[var(--ink-2)]">
                        <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--rule-soft)]">
                          <div
                            className={`h-full ${claim.lane === 'structural' ? 'bg-[var(--lane-a)]' : claim.lane === 'hybrid' ? 'bg-[var(--lane-b)]' : 'bg-[var(--lane-c)]'}`}
                            style={{ width: `${claim.conf * 100}%` }}
                          />
                        </div>
                        <span>{claim.conf.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between gap-3 bg-[var(--panel-dim)] px-4 py-3">
                  <div className="flex-1 text-[10.5px] text-[var(--ink-2)]">
                    {conflict.authority ? (
                      <>
                        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--accent)]">Rule</span>{' '}
                        {conflict.authority}
                      </>
                    ) : (
                      'Awaiting arbiter'
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="rounded border border-[var(--rule)] bg-[var(--panel)] px-2 py-1 text-[10.5px] font-semibold text-[var(--ink-2)]"
                      onClick={() =>
                        nav?.go(
                          conflict.artifact === 'person'
                            ? 'people'
                            : conflict.artifact === 'entity'
                              ? 'entities'
                              : 'chronology'
                        )
                      }
                    >
                      Open in {conflict.artifact === 'person' ? 'people' : conflict.artifact === 'entity' ? 'entities' : 'chronology'}
                    </button>
                    <button className="rounded border border-[var(--rule)] bg-[var(--panel)] px-2 py-1 text-[10.5px] font-semibold text-[var(--ink-2)]">
                      Re-pass
                    </button>
                    <button className="rounded border border-[var(--bad-soft)] px-2 py-1 text-[10.5px] font-semibold text-[var(--bad)]">
                      Escalate
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-[var(--rule)] bg-[var(--panel)]">
            <div className="border-b border-[var(--rule)] bg-[var(--panel-dim)] px-4 py-2">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-2)]">Signals</h3>
            </div>
            {data.signals.map((signal) => (
              <div
                key={`${signal.type}-${signal.t}`}
                className="grid cursor-pointer grid-cols-[48px_1fr] gap-3 border-b border-[var(--rule-soft)] px-4 py-3 text-[11.5px] last:border-b-0 hover:bg-[var(--panel-dim)]"
                onClick={() => nav?.go(signal.target.view, signal.target.id)}
              >
                <div className="font-mono text-[10.5px] text-[var(--ink-3)]">{signal.t}</div>
                <div>
                  <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">
                    {signal.type.replace(/_/g, ' ')}
                  </div>
                  <div className="text-[var(--ink)]">{signal.payload}</div>
                  <div className="mt-1 font-mono text-[10px] text-[var(--ink-3)]">{signal.impact}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-[var(--rule)] bg-[var(--panel)]">
            <div className="border-b border-[var(--rule)] bg-[var(--panel-dim)] px-4 py-2">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-2)]">External</h3>
            </div>
            <div className="space-y-0">
              <div className="flex items-center justify-between border-b border-[var(--rule-soft)] px-4 py-3 text-[11.5px] text-[var(--ink-2)]">
                <span className="flex items-center gap-2">
                  <span className="rounded bg-[var(--rule-soft)] px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase text-[var(--ink-3)]">
                    eyecite
                  </span>
                  citations tagged
                </span>
                <span className="font-mono font-semibold text-[var(--ink)]">{data.augmentation.eyeciteCitations}</span>
              </div>
              <div className="flex items-center justify-between border-b border-[var(--rule-soft)] px-4 py-3 text-[11.5px] text-[var(--ink-2)]">
                <span className="flex items-center gap-2">
                  <span className="rounded bg-[var(--rule-soft)] px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase text-[var(--ink-3)]">
                    AustLII
                  </span>
                  statutes verified
                </span>
                <span className="font-mono font-semibold text-[var(--ink)]">
                  {data.augmentation.austlii.verified}
                  <small className="ml-1 font-normal text-[var(--ink-3)]">/{data.augmentation.austlii.total}</small>
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-[var(--rule-soft)] px-4 py-3 text-[11.5px] text-[var(--ink-2)]">
                <span className="flex items-center gap-2">
                  <span className="rounded bg-[var(--rule-soft)] px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase text-[var(--ink-3)]">
                    ASIC
                  </span>
                  entities confirmed
                </span>
                <span className="font-mono font-semibold text-[var(--ink)]">
                  {data.augmentation.asic.confirmed}
                  <small className="ml-1 font-normal text-[var(--ink-3)]">/{data.augmentation.asic.total}</small>
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-[var(--rule-soft)] px-4 py-3 text-[11.5px] text-[var(--ink-2)]">
                <span className="flex items-center gap-2">
                  <span className="rounded bg-[var(--rule-soft)] px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase text-[var(--ink-3)]">
                    Cos House
                  </span>
                  UK entities
                </span>
                <span className="font-mono font-semibold text-[var(--ink)]">
                  {data.augmentation.companiesHouse.confirmed}
                  <small className="ml-1 font-normal text-[var(--ink-3)]">/{data.augmentation.companiesHouse.total}</small>
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-[var(--rule-soft)] px-4 py-3 text-[11.5px] text-[var(--ink-2)]">
                <span className="flex items-center gap-2">
                  <span className="rounded bg-[var(--rule-soft)] px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase text-[var(--ink-3)]">
                    EDGAR
                  </span>
                  US filings
                </span>
                <span className="font-mono font-semibold text-[var(--ink)]">
                  {data.augmentation.edgar == null ? '—' : data.augmentation.edgar}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 text-[11.5px] text-[var(--ink-2)]">
                <span className="flex items-center gap-2">
                  <span className="rounded bg-[var(--rule-soft)] px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase text-[var(--ink-3)]">
                    CourtListener
                  </span>
                  US case law
                </span>
                <span className="font-mono font-semibold text-[var(--ink)]">
                  {data.augmentation.courtListener == null ? '—' : data.augmentation.courtListener}
                </span>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-[var(--rule)] bg-[var(--panel)]">
            <div className="border-b border-[var(--rule)] bg-[var(--panel-dim)] px-4 py-2">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-2)]">Hardware</h3>
            </div>
            <div className="grid grid-cols-2">
              {data.hardware.hosts.map((host) => {
                const util = host.vramPct ?? host.ramPct ?? 0
                const utilLabel = host.vramPct != null ? 'VRAM' : 'RAM'
                return (
                  <div key={host.name} className="border-b border-r border-[var(--rule-soft)] p-3 last:border-r-0">
                    <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--ink-3)]">
                      {host.label}<SourceDot source="mock" show={showSources} />
                    </div>
                    <div className="mt-1 flex items-baseline gap-2 font-mono text-[12px] text-[var(--ink)]">
                      <span className="font-semibold">{util}%</span>
                      <span className="text-[10px] text-[var(--ink-3)]">{utilLabel}</span>
                    </div>
                    <div className="mt-1 text-[10px] text-[var(--ink-3)]">{host.role}</div>
                    <div className="mt-2 h-1 rounded-full bg-[var(--rule-soft)]">
                      <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${util}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
