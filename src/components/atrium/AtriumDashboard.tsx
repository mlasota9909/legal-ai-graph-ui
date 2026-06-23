import { useMemo, useState } from 'react'
import type {
  ArtifactSummary,
  ArtifactView,
  ChronologyClaim,
  CrossArtifactSignal,
  EntityRow,
  PersonRow,
  Reasoning,
  ReportSection,
  ReportSpan,
  WorkspaceData,
} from '../../types/contracts'
import type { ListStatusFilter } from '../../types/listFilter'
import { useNav } from '../../context/NavContext'
import { ReasoningPopover } from '../ReasoningPopover'
import { ArtifactListHeader } from './ArtifactListHeader'
import { ExportMenu } from './ExportMenu'
import {
  exportChronologyCsv,
  exportChronologyWord,
  exportEntityCsv,
  exportEntityWord,
  exportPeopleCsv,
  exportPeopleWord,
  exportFullReport,
  exportPdf,
} from '../../utils/artifactExport'
import { isListArtifactId, loadedListCount } from '../../utils/listArtifactRows'
import {
  chronologyListStatus,
  entityListStatus,
  matchesListFilter,
  personListStatus,
} from '../../utils/listStatus'
import { SourceDot } from '../shared/SourceDot'

const TABS: { id: ArtifactView; label: string; countKey: 'count' | 'sections' }[] = [
  { id: 'chronology', label: 'Chronology', countKey: 'count' },
  { id: 'entities', label: 'Entity register', countKey: 'count' },
  { id: 'people', label: 'People register', countKey: 'count' },
  { id: 'exec', label: 'Executive memo', countKey: 'sections' },
  { id: 'detailed', label: 'Detailed analysis', countKey: 'sections' },
]

interface AtriumDashboardProps {
  data: WorkspaceData
  view?: ArtifactView
  initialTab?: ArtifactView
}

function findArtifact(artifacts: ArtifactSummary[], id: ArtifactView): ArtifactSummary | null {
  return artifacts.find((artifact) => artifact.id === id) ?? null
}

function formatViewLabel(view: ArtifactView): string {
  if (view === 'entities') return 'Entity register'
  if (view === 'people') return 'People register'
  if (view === 'exec') return 'Executive memo'
  if (view === 'detailed') return 'Detailed analysis'
  return 'Chronology'
}

function formatChronologyDisplayDate(row: ChronologyClaim): { text: string; placeholder: boolean } {
  if (row.date.trim()) return { text: row.date, placeholder: false }
  return { text: '—', placeholder: Boolean(row.date_certainty) }
}

function ChronologyTimeline({
  rows,
  highlight,
  showFieldIds,
}: {
  rows: ChronologyClaim[]
  highlight: string | null
  showFieldIds: boolean
}) {
  const nav = useNav()
  return (
    <div className="print-artifact-list relative px-6 py-5">
      <div className="absolute left-[104px] top-6 h-[calc(100%-48px)] w-px bg-[var(--rule)]" />
      {rows.map((row) => {
        const displayDate = formatChronologyDisplayDate(row)
        return (
          <div
            key={row.id}
            className={`relative grid grid-cols-[80px_1fr] gap-6 border-b border-[var(--rule-soft)] py-4 last:border-b-0 ${
              highlight === row.id ? 'flash' : ''
            }`}
          >
          <div className="font-mono text-[11.5px] text-[var(--ink-2)]">
            <span className={displayDate.placeholder ? 'italic text-[var(--ink-3)]' : undefined}>{displayDate.text}</span>
            <div className="mt-1 text-[10.5px] text-[var(--ink-3)]">p. {row.page}</div>
          </div>
          <div
            className={`absolute left-[100px] top-6 h-3 w-3 rounded-full border-2 border-[var(--accent)] bg-[var(--panel)] ${
              row.status === 'disputed' ? 'border-[var(--warn)]' : row.status === 'human_review' ? 'border-[var(--bad)] bg-[var(--bad)]' : row.status === 'superseded' ? 'border-[var(--ink-3)] bg-[var(--bg)]' : ''
            }`}
          />
          <div className="min-w-0 pl-5">
            <div
              className={`text-[13.5px] font-medium leading-[1.45] ${
                row.status === 'superseded' ? 'text-[var(--ink-3)] line-through' : 'text-[var(--ink)]'
              }`}
            >
              {row.title}
              <SourceDot source={row.dataSource ?? 'mock'} show={nav?.showSources ?? false} />
            </div>
            {showFieldIds && (
              <div className="mt-1 font-mono text-[10.5px] text-[var(--ink-3)]">
                {row.claim_id ?? row.id}
              </div>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11.5px] text-[var(--ink-2)]">
              {row.who.map((name) => (
                <span key={name} className="rounded-full border border-[var(--rule)] px-2 py-0.5 text-[10.5px]">
                  {name}
                </span>
              ))}
              <span className="rounded-full bg-[var(--rule-soft)] px-2 py-0.5 font-mono text-[10.5px]">{row.lane}</span>
              <span
                className={`rounded-full px-2 py-0.5 font-mono text-[10.5px] ${
                  row.conf < 0.6
                    ? 'bg-[var(--bad-soft)] text-[var(--bad)]'
                    : row.conf < 0.8
                      ? 'bg-[var(--warn-soft)] text-[var(--warn)]'
                      : 'bg-[var(--good-soft)] text-[var(--good)]'
                }`}
              >
                {row.conf.toFixed(2)} conf
              </span>
              {row.reasoning && (
                <ReasoningPopover
                  variant="icon-only"
                  reasoning={row.reasoning}
                  claimId={row.id}
                  align="left"
                  conf={row.conf}
                />
              )}
            </div>
            {row.supersedeReason && (
              <div className="mt-2 rounded-lg bg-[var(--rule-soft)] px-3 py-2 text-[11.5px] text-[var(--ink-2)]">
                Superseded: {row.supersedeReason}
              </div>
            )}
            {row.disputeNote && (
              <div className="mt-2 rounded-lg bg-[var(--warn-soft)] px-3 py-2 text-[11.5px] text-[var(--warn)]">
                {row.disputeNote}
              </div>
            )}
            {row.reviewNote && (
              <div className="mt-2 rounded-lg bg-[var(--bad-soft)] px-3 py-2 text-[11.5px] text-[var(--bad)]">
                {row.reviewNote}
              </div>
            )}
          </div>
          </div>
        )
      })}
    </div>
  )
}

function EntityList({ rows, highlight, showFieldIds }: { rows: EntityRow[]; highlight: string | null; showFieldIds: boolean }) {
  const nav = useNav()
  return (
    <div className="print-artifact-list divide-y divide-[var(--rule-soft)]">
      {rows.map((row) => {
        const confTone = row.conf < 0.6 ? 'bad' : row.conf < 0.8 ? 'warn' : 'good'
        return (
          <div
            key={row.id}
            className={`grid grid-cols-[1fr_100px_120px_120px] gap-4 px-6 py-4 text-[11.5px] ${
              highlight === row.id ? 'flash' : ''
            } hover:bg-[var(--bg)]`}
          >
            <div>
              <div className={`text-[14px] font-medium [overflow-wrap:break-word] ${row.candidate ? 'text-[var(--ink-3)]' : 'text-[var(--ink)]'}`} title={row.canonical}>
                {row.canonical}
                <SourceDot source={row.dataSource ?? 'mock'} show={nav?.showSources ?? false} />
              </div>
              {showFieldIds && (
                <div className="mt-1 font-mono text-[10.5px] text-[var(--ink-3)]">{row.id}</div>
              )}
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11.5px] text-[var(--ink-2)]">
                <span className="font-mono text-[var(--ink-3)]">{row.type.replace(/_/g, ' ').toLowerCase()}</span>
                <span>&middot;</span>
                <span>{row.aliases} aliases</span>
                {row.candidate && <span className="rounded-full bg-[var(--warn-soft)] px-2 py-0.5 text-[10.5px] text-[var(--warn)]">candidate</span>}
                {row.recent && <span className="rounded-full bg-[var(--good-soft)] px-2 py-0.5 text-[10.5px] text-[var(--good)]">new</span>}
              </div>
            </div>
            <div className="text-right font-mono text-[11.5px] text-[var(--ink-2)]">
              {row.mentions}
              <div className="text-[10.5px] text-[var(--ink-3)]">mentions</div>
            </div>
            <div className="font-mono text-[11.5px] text-[var(--ink-3)]">
              {row.asic}
              <div className="text-[10.5px] text-[var(--ink-2)]">{row.lastSeen}</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--rule-soft)]">
                <div
                  className={`${confTone === 'bad' ? 'bg-[var(--bad)]' : confTone === 'warn' ? 'bg-[var(--warn)]' : 'bg-[var(--good)]'} h-full`}
                  style={{ width: `${row.conf * 100}%` }}
                />
              </div>
              <span className="font-mono text-[11px] text-[var(--ink-2)]">{row.conf.toFixed(2)}</span>
              {row.reasoning && (
                <ReasoningPopover
                  variant="icon-only"
                  reasoning={row.reasoning}
                  claimId={row.id}
                  align="right"
                  conf={row.conf}
                />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PeopleList({ rows, highlight, showFieldIds }: { rows: PersonRow[]; highlight: string | null; showFieldIds: boolean }) {
  const nav = useNav()
  return (
    <div className="print-artifact-list divide-y divide-[var(--rule-soft)]">
      {rows.map((row) => {
        const confTone = row.conf < 0.6 ? 'bad' : row.conf < 0.8 ? 'warn' : 'good'
        return (
          <div
            key={row.id}
            className={`grid grid-cols-[1fr_100px_120px_120px] gap-4 px-6 py-4 text-[11.5px] ${
              highlight === row.id ? 'flash' : ''
            } hover:bg-[var(--bg)]`}
          >
            <div>
              <div className="text-[14px] font-medium text-[var(--ink)]">
                {row.name}<SourceDot source={row.dataSource ?? 'mock'} show={nav?.showSources ?? false} />
              </div>
              {showFieldIds && (
                <div className="mt-1 font-mono text-[10.5px] text-[var(--ink-3)]">{row.id}</div>
              )}
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11.5px] text-[var(--ink-2)]">
                <span>{row.role}</span>
                {(row.disputed || row.review) && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10.5px] ${
                      row.review ? 'bg-[var(--bad-soft)] text-[var(--bad)]' : 'bg-[var(--warn-soft)] text-[var(--warn)]'
                    }`}
                  >
                    {row.review ? 'review' : 'disputed'}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right font-mono text-[11.5px] text-[var(--ink-2)]">
              {row.mentions}
              <SourceDot source={row.dataSource ?? 'mock'} show={nav?.showSources ?? false} />
              <div className="text-[10.5px] text-[var(--ink-3)]">mentions</div>
            </div>
            <div className="font-mono text-[11.5px] text-[var(--ink-3)]">
              {row.source}
              <div className="text-[10.5px] text-[var(--ink-2)]">{row.lastSeen}</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--rule-soft)]">
                <div
                  className={`${confTone === 'bad' ? 'bg-[var(--bad)]' : confTone === 'warn' ? 'bg-[var(--warn)]' : 'bg-[var(--good)]'} h-full`}
                  style={{ width: `${row.conf * 100}%` }}
                />
              </div>
              <span className="font-mono text-[11px] text-[var(--ink-2)]">{row.conf.toFixed(2)}</span>
              {row.reasoning && (
                <ReasoningPopover
                  variant="icon-only"
                  reasoning={row.reasoning}
                  claimId={row.id}
                  align="right"
                  conf={row.conf}
                />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function renderReportSpans(spans: ReportSpan[], reasoningLookup: Record<string, Reasoning | undefined>) {
  return spans.map((span, idx) => {
    if (span.kind === 'text') {
      return (
        <span key={`t-${idx}-${span.text.slice(0, 12)}`}>
          {span.text}
        </span>
      )
    }
    const reasoning = span.reasoning ?? reasoningLookup[span.claimId]
    return (
      <ReasoningPopover
        key={`c-${span.claimId}-${idx}`}
        reasoning={reasoning}
        align="left"
        conf={span.conf}
        claimId={span.claimId}
      >
        <span className="mx-0.5 inline-flex cursor-pointer items-center rounded bg-[var(--accent-soft)] px-1.5 py-0.5 font-mono text-[11px] font-medium text-[var(--accent)] hover:bg-[#d7e5e2]">
          {span.text}
        </span>
      </ReasoningPopover>
    )
  })
}

function ReportView({
  sections,
  reasoningLookup,
}: {
  sections: ReportSection[]
  reasoningLookup: Record<string, Reasoning | undefined>
}) {
  const nav = useNav()
  return (
    <div className="max-w-[680px] px-8 py-6 font-serif text-[15px] leading-[1.65] text-[var(--ink)]">
      {sections.map((section) => (
        <div key={section.num} className="mb-6">
          <h4 className="mb-2 flex items-center gap-2 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-3)]">
            §{section.num} {section.heading}
            <SourceDot source="mock" show={nav?.showSources ?? false} />
            <span
              className={`rounded px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.04em] ${
                section.state === 'drafted'
                  ? 'bg-[var(--good-soft)] text-[var(--good)]'
                  : section.state === 'drafting'
                    ? 'bg-[var(--warn-soft)] text-[var(--warn)]'
                    : 'bg-[var(--rule-soft)] text-[var(--ink-3)]'
              }`}
            >
              {section.state}
            </span>
          </h4>
          {section.body ? (
            section.body.map((block, idx) => {
              if (block.kind === 'placeholder') {
                return (
                  <div key={`${section.num}-ph-${idx}`} className="mb-4 rounded border border-dashed border-[var(--rule)] bg-[var(--bg)] px-4 py-3 text-[13px] italic text-[var(--ink-3)]">
                    {block.text}
                  </div>
                )
              }
              return (
                <p key={`${section.num}-p-${idx}`} className="mb-4">
                  {renderReportSpans(block.spans, reasoningLookup)}
                </p>
              )
            })
          ) : (
            <div className="rounded border border-dashed border-[var(--rule)] bg-[var(--bg)] px-4 py-3 text-[13px] italic text-[var(--ink-3)]">
              Draft queued. Awaiting synthesis pass.
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function SideConflictCard({ conflicts }: { conflicts: WorkspaceData['conflicts'] }) {
  if (conflicts.length === 0) {
    return <div className="px-4 py-3 text-[11.5px] text-[var(--ink-3)]">No active conflicts.</div>
  }

  return (
    <div className="divide-y divide-[var(--rule-soft)]">
      {conflicts.map((conflict) => (
        <div key={conflict.id} className="px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <div className="text-[12.5px] font-semibold text-[var(--ink)]">{conflict.subject}</div>
            <div className="rounded-full bg-[var(--warn-soft)] px-2 py-0.5 font-mono text-[10.5px] text-[var(--warn)]">
              J {conflict.jaccard.toFixed(2)}
            </div>
          </div>
          {conflict.claims.map((claim) => (
            <div key={claim.lane} className="mt-2 grid grid-cols-[52px_1fr] gap-2 text-[11px]">
              <div className="font-mono uppercase tracking-[0.06em] text-[var(--ink-3)]">{claim.lane}</div>
              <div>
                <div className="font-mono text-[12px] text-[var(--ink)]">{claim.value}</div>
                <div className="font-mono text-[10px] text-[var(--ink-3)]">{claim.source}</div>
              </div>
            </div>
          ))}
          {conflict.authority && (
            <div className="mt-3 rounded-lg bg-[var(--accent-soft)] px-3 py-2 text-[11px] text-[var(--accent)]">
              {conflict.authority}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function SignalList({ signals, onNavigate }: { signals: CrossArtifactSignal[]; onNavigate?: (view: ArtifactView, id?: string) => void }) {
  const nav = useNav()
  return (
    <div className="divide-y divide-[var(--rule-soft)]">
      {signals.map((signal) => (
        <div
          key={`${signal.type}-${signal.t}`}
          className={`grid grid-cols-[48px_1fr] gap-3 px-4 py-3 text-[11.5px] ${onNavigate ? 'cursor-pointer hover:bg-[var(--bg)]' : ''}`}
          onClick={() => onNavigate?.(signal.target.view, signal.target.id)}
        >
          <div className="font-mono text-[10.5px] text-[var(--ink-3)]">{signal.t}</div>
          <div>
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">
              {signal.type.replace(/_/g, ' ')}
              <SourceDot source="mock" show={nav?.showSources ?? false} />
            </div>
            <div className="text-[var(--ink-2)]">{signal.payload}</div>
            <div className="mt-1 font-mono text-[10px] text-[var(--ink-3)]">{signal.impact}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function AtriumDashboard({ data, view, initialTab = 'chronology' }: AtriumDashboardProps) {
  const nav = useNav()
  const [localTab, setLocalTab] = useState<ArtifactView>(initialTab)
  const [localListFilter, setLocalListFilter] = useState<ListStatusFilter>('all')
  const [showFieldIds, setShowFieldIds] = useState(false)
  const activeTab = nav ? (view ?? nav.view) : localTab
  const highlight = nav?.highlight ?? null
  const listFilter = nav?.listFilter ?? localListFilter
  const setListFilter = nav?.setListFilter ?? setLocalListFilter
  const showSources = nav?.showSources ?? false

  const artifact = findArtifact(data.artifacts, activeTab) ?? data.artifacts[0]
  const isListArtifact = artifact?.kind === 'list'
  const loadedCount =
    isListArtifact && isListArtifactId(activeTab) ? loadedListCount(data, activeTab) : 0
  const runTotal = isListArtifact ? (artifact?.count ?? 0) : 0

  const filteredChronology = useMemo(
    () =>
      data.chronology.filter((row) =>
        matchesListFilter(chronologyListStatus(row), listFilter)
      ),
    [data.chronology, listFilter]
  )

  const filteredEntities = useMemo(
    () =>
      data.entities.filter((row) => matchesListFilter(entityListStatus(row), listFilter)),
    [data.entities, listFilter]
  )

  const filteredPeople = useMemo(
    () =>
      data.people.filter((row) => matchesListFilter(personListStatus(row), listFilter)),
    [data.people, listFilter]
  )

  const reasoningLookup = useMemo(() => {
    const lookup: Record<string, Reasoning | undefined> = {}
    data.chronology.forEach((row) => {
      lookup[row.id] = row.reasoning
    })
    data.people.forEach((row) => {
      lookup[row.id] = row.reasoning
    })
    data.entities.forEach((row) => {
      lookup[row.id] = row.reasoning
    })
    return lookup
  }, [data.chronology, data.people, data.entities])

  const currentConflicts = data.conflicts.filter((conflict) => {
    if (activeTab === 'chronology') return conflict.artifact === 'chronology'
    if (activeTab === 'people') return conflict.artifact === 'person'
    if (activeTab === 'entities') return conflict.artifact === 'entity'
    return false
  })

  const setTab = (tab: ArtifactView) => {
    if (nav) nav.go(tab)
    else {
      setLocalTab(tab)
      setLocalListFilter('all')
    }
  }

  const exportHandlers = useMemo(() => {
    if (activeTab === 'chronology') {
      return {
        pdf: exportPdf,
        excel: () => exportChronologyCsv(filteredChronology, 'chronology'),
        word: () => exportChronologyWord(filteredChronology, 'chronology'),
      }
    }
    if (activeTab === 'entities') {
      return {
        pdf: exportPdf,
        excel: () => exportEntityCsv(filteredEntities, 'entity-register'),
        word: () => exportEntityWord(filteredEntities, 'entity-register'),
      }
    }
    if (activeTab === 'people') {
      return {
        pdf: exportPdf,
        excel: () => exportPeopleCsv(filteredPeople, 'people-register'),
        word: () => exportPeopleWord(filteredPeople, 'people-register'),
      }
    }
    return { pdf: exportPdf, excel: () => {}, word: () => {} }
  }, [activeTab, filteredChronology, filteredEntities, filteredPeople])

  return (
    <div className="theme-atrium min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--rule)] px-8 py-4">
        <div className="flex min-w-0 flex-wrap items-center gap-6">
          <div
            className={`flex shrink-0 items-center gap-3 text-[14px] font-semibold ${nav ? 'cursor-pointer hover:opacity-90' : ''}`}
            onClick={() => nav?.go('monitor')}
          >
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[var(--accent)] shadow-[0_0_0_4px_var(--accent-soft)]" />
            Atrium · output review
          </div>
          <div className="min-w-0 truncate text-[13px] text-[var(--ink-3)]">
            Workspace · Royal Commission · <b className="font-medium text-[var(--ink)]">{data.doc.title}</b>
            <SourceDot source={data.isRealData ? 'real' : 'mock'} show={showSources} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[12.5px] text-[var(--ink-2)]">
          <button
            type="button"
            onClick={() => nav?.toggleSources()}
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.04em] ${
              showSources
                ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'border-[var(--rule)] bg-[var(--panel)] text-[var(--ink-3)]'
            }`}
          >
            Sources<SourceDot source="real" show />
          </button>
          <button
            type="button"
            onClick={() => setShowFieldIds((prev) => !prev)}
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.04em] ${
              showFieldIds
                ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'border-[var(--rule)] bg-[var(--panel)] text-[var(--ink-3)]'
            }`}
          >
            IDs
          </button>
          <button
            type="button"
            onClick={() => nav?.go('evidence')}
            className="inline-flex items-center gap-1 rounded-full border border-[var(--rule)] bg-[var(--panel)] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.04em] text-[var(--ink-3)] hover:bg-[var(--rule-soft)] hover:text-[var(--ink)]"
          >
            Graph →
          </button>
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--rule)] bg-[var(--panel)] px-3 py-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--good)]" />
            Workflow healthy
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--rule)] bg-[var(--panel)] px-3 py-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--warn)]" />
            {data.kpi.openConflicts} conflicts pending
          </span>
          <span className="font-mono text-[12px] text-[var(--ink-3)]">{data.doc.id}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 px-8 py-6 lg:grid-cols-[300px_1fr_320px]">
        <div className="flex flex-col gap-4">
          <div className="rounded-[14px] border border-[var(--rule)] bg-[var(--panel)] p-5 shadow-[0_1px_0_var(--rule-soft)]">
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-3)]">Document</div>
            <div className="mt-2 font-serif text-[22px] font-medium leading-tight text-[var(--ink)]">{data.doc.title}</div>
            <dl className="mt-4 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-[12px] text-[var(--ink-2)]">
              <dt className="text-[var(--ink-3)]">Pages</dt>
              <dd className="font-mono text-[var(--ink)]">{data.doc.pages.toLocaleString()}<SourceDot source={data.isRealData ? 'real' : 'mock'} show={showSources} /></dd>
              <dt className="text-[var(--ink-3)]">Type</dt>
              <dd className="font-mono text-[var(--ink)]">{data.doc.docType}</dd>
              <dt className="text-[var(--ink-3)]">Ingested</dt>
              <dd className="font-mono text-[var(--ink)]">{data.doc.ingestedAt}<SourceDot source={data.isRealData ? 'real' : 'mock'} show={showSources} /></dd>
            </dl>
          </div>
          <div className="rounded-[14px] border border-[var(--rule)] bg-[var(--panel)] px-5 py-4 shadow-[0_1px_0_var(--rule-soft)]">
            <div className="mb-2 flex items-baseline justify-between">
              <div className="font-mono text-[18px] font-semibold text-[var(--ink)]">{data.doc.elapsedHours.toFixed(1)}h</div>
              <div className="text-[12px] text-[var(--ink-3)]">of {data.doc.timeBudgetHours}h</div>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--rule-soft)]">
              <div
                className="h-full bg-[var(--accent)]"
                style={{ width: `${(data.doc.elapsedHours / data.doc.timeBudgetHours) * 100}%` }}
              />
            </div>
          </div>
          <div className="rounded-[14px] border border-[var(--rule)] bg-[var(--panel)] px-5 py-4 shadow-[0_1px_0_var(--rule-soft)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-3)]">Pipelines</div>
            <div className="mt-3 space-y-3">
              {data.pipelines.map((pipe) => (
                <div key={pipe.id} className="border-b border-[var(--rule-soft)] pb-3 last:border-b-0 last:pb-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="text-[12px] font-medium text-[var(--ink)]">
                      {pipe.short ? pipe.short.split(' · ')[1] ?? pipe.name : pipe.name}
                      <SourceDot source={pipe.statusSource ?? 'mock'} show={showSources} />
                    </div>
                    <div className="font-mono text-[10.5px] text-[var(--ink-3)]">P{pipe.id}</div>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-[var(--ink-2)]">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--rule-soft)]">
                      <div className="h-full bg-[var(--accent)]" style={{ width: `${pipe.progress * 100}%` }} />
                    </div>
                    <span className="font-mono text-[11px] text-[var(--ink-2)]">{(pipe.progress * 100).toFixed(0)}%<SourceDot source={pipe.progressSource ?? 'mock'} show={showSources} /></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[14px] border border-[var(--rule)] bg-[var(--panel)] shadow-[0_1px_0_var(--rule-soft)]">
          <div className="flex items-center gap-2 border-b border-[var(--rule)] px-5 pt-4">
            {nav && (
              <button
                className="mr-3 flex items-center gap-2 border-r border-[var(--rule)] pr-3 text-[12.5px] text-[var(--ink-2)] hover:text-[var(--accent)]"
                onClick={() => nav.go('monitor')}
              >
                &larr; Monitor
              </button>
            )}
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className={`border-b-2 px-3 pb-3 text-[12.5px] font-medium ${
                  activeTab === tab.id
                    ? 'border-[var(--accent)] text-[var(--ink)]'
                    : 'border-transparent text-[var(--ink-2)] hover:text-[var(--ink)]'
                }`}
              >
                {tab.label}
                {tab.countKey === 'count' && (
                  <span className="ml-2 rounded-full bg-[var(--rule-soft)] px-2 py-0.5 font-mono text-[10.5px] text-[var(--ink-3)]">
                    {findArtifact(data.artifacts, tab.id)?.count ?? (isListArtifactId(tab.id) ? loadedListCount(data, tab.id) : 0)}
                    <SourceDot
                      source={data.isRealData ? 'real' : 'mock'}
                      show={showSources}
                    />
                  </span>
                )}
                {tab.countKey === 'sections' && (
                  <span className="ml-2 rounded-full bg-[var(--rule-soft)] px-2 py-0.5 font-mono text-[10.5px] text-[var(--ink-3)]">
                    {findArtifact(data.artifacts, tab.id)?.sections ?? 0}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="border-b border-[var(--rule-soft)] px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-3)]">
                  {isListArtifact ? 'List artifact' : 'Report artifact'} · updated {artifact?.lastUpdate ?? '—'}
                </div>
                <div className="mt-2 font-serif text-[24px] font-medium text-[var(--ink)]">
                  {artifact?.name ?? formatViewLabel(activeTab)}
                </div>
                <div className="mt-1 text-[12.5px] text-[var(--ink-2)]">
                  {isListArtifact
                    ? `Showing ${loadedCount.toLocaleString()} sample claim${loadedCount === 1 ? '' : 's'} · Full run: ${runTotal.toLocaleString()} · agreement ${(artifact?.agreement ?? 0).toFixed(2)} · gate ${artifact?.gate ?? 0.85}`
                    : `Reviewing ${artifact?.sections ?? 0} sections · ${artifact?.drafted ?? 0} drafted · ${artifact?.critiqued ?? 0} in critic loop · ${(artifact?.sections ?? 0) - (artifact?.drafted ?? 0) - (artifact?.critiqued ?? 0)} queued`}
                  <SourceDot source={isListArtifact && activeTab === 'people' && data.people.some((row) => row.dataSource === 'real') ? 'real' : 'mock'} show={showSources} />
                </div>
              </div>
              {isListArtifact && (
                <ExportMenu
                  onExportFullReport={() => void exportFullReport(data.doc.id)}
                  onExportPdf={exportHandlers.pdf}
                  onExportExcel={exportHandlers.excel}
                  onExportWord={exportHandlers.word}
                />
              )}
            </div>

            {isListArtifact && activeTab === 'chronology' && (
              <ArtifactListHeader
                rows={data.chronology}
                getStatus={chronologyListStatus}
                activeFilter={listFilter}
                onFilterChange={setListFilter}
              />
            )}
            {isListArtifact && activeTab === 'entities' && (
              <ArtifactListHeader
                rows={data.entities}
                getStatus={entityListStatus}
                activeFilter={listFilter}
                onFilterChange={setListFilter}
              />
            )}
            {isListArtifact && activeTab === 'people' && (
              <ArtifactListHeader
                rows={data.people}
                getStatus={personListStatus}
                activeFilter={listFilter}
                onFilterChange={setListFilter}
              />
            )}

            {!isListArtifact && (
              <div className="mt-4 flex flex-wrap items-center gap-5">
                <div className="text-[11.5px] text-[var(--ink-3)]">
                  <b className="font-mono text-[18px] text-[var(--ink)]">
                    {artifact?.drafted}/{artifact?.sections}
                  </b>{' '}
                  drafted
                </div>
                <div className="text-[11.5px] text-[var(--ink-3)]">
                  <b
                    className={`font-mono text-[18px] ${(artifact?.critiqued ?? 0) > 0 ? 'text-[var(--warn)]' : 'text-[var(--ink)]'}`}
                  >
                    {artifact?.critiqued}
                  </b>{' '}
                  critic revisions
                </div>
                <div className="flex h-1.5 min-w-[120px] flex-1 overflow-hidden rounded-full bg-[var(--rule-soft)]">
                  <div
                    className="h-full shrink-0 bg-[var(--good)]"
                    style={{
                      width: `${((artifact?.drafted ?? 0) / (artifact?.sections ?? 1)) * 100}%`,
                    }}
                  />
                  <div
                    className="h-full shrink-0 bg-[var(--warn)]"
                    style={{
                      width: `${((artifact?.critiqued ?? 0) / (artifact?.sections ?? 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {activeTab === 'chronology' && (
            <ChronologyTimeline rows={filteredChronology} highlight={highlight} showFieldIds={showFieldIds} />
          )}
          {activeTab === 'entities' && <EntityList rows={filteredEntities} highlight={highlight} showFieldIds={showFieldIds} />}
          {activeTab === 'people' && <PeopleList rows={filteredPeople} highlight={highlight} showFieldIds={showFieldIds} />}
          {activeTab === 'exec' && <ReportView sections={data.reports.exec} reasoningLookup={reasoningLookup} />}
          {activeTab === 'detailed' && <ReportView sections={data.reports.detailed} reasoningLookup={reasoningLookup} />}
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-[14px] border border-[var(--rule)] bg-[var(--panel)] shadow-[0_1px_0_var(--rule-soft)]">
            <div className="border-b border-[var(--rule)] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-2)]">
              Conflicts
            </div>
            <SideConflictCard conflicts={currentConflicts} />
          </div>
          <div className="rounded-[14px] border border-[var(--rule)] bg-[var(--panel)] shadow-[0_1px_0_var(--rule-soft)]">
            <div className="border-b border-[var(--rule)] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-2)]">
              Signals
            </div>
            <SignalList signals={data.signals} onNavigate={(v, id) => nav?.go(v, id)} />
          </div>
          <div className="rounded-[14px] border border-[var(--rule)] bg-[var(--panel)] shadow-[0_1px_0_var(--rule-soft)]">
            <div className="border-b border-[var(--rule)] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-2)]">
              External augmentation
            </div>
            <div className="divide-y divide-[var(--rule-soft)]">
              <div className="flex items-center justify-between px-4 py-3 text-[12px] text-[var(--ink-2)]">
                <span>eyecite citations tagged<SourceDot source="mock" show={showSources} /></span>
                <span className="font-mono font-semibold text-[var(--ink)]">{data.augmentation.eyeciteCitations}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 text-[12px] text-[var(--ink-2)]">
                <span>AustLII statutes verified<SourceDot source="mock" show={showSources} /></span>
                <span className="font-mono font-semibold text-[var(--ink)]">
                  {data.augmentation.austlii.verified}
                  <small className="ml-1 font-normal text-[var(--ink-3)]">/{data.augmentation.austlii.total}</small>
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 text-[12px] text-[var(--ink-2)]">
                <span>ASIC entities confirmed<SourceDot source="mock" show={showSources} /></span>
                <span className="font-mono font-semibold text-[var(--ink)]">
                  {data.augmentation.asic.confirmed}
                  <small className="ml-1 font-normal text-[var(--ink-3)]">/{data.augmentation.asic.total}</small>
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 text-[12px] text-[var(--ink-2)]">
                <span>Companies House (UK)<SourceDot source="mock" show={showSources} /></span>
                <span className="font-mono font-semibold text-[var(--ink)]">
                  {data.augmentation.companiesHouse.confirmed}
                  <small className="ml-1 font-normal text-[var(--ink-3)]">/{data.augmentation.companiesHouse.total}</small>
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 text-[12px] text-[var(--ink-2)]">
                <span>CourtListener / EDGAR<SourceDot source="mock" show={showSources} /></span>
                <span className="font-mono text-[var(--ink)]">{data.augmentation.edgar == null ? '—' : data.augmentation.edgar}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
