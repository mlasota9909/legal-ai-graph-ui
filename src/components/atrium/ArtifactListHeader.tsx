import type { ClaimListStatus, ListStatusFilter } from '../../types/listFilter'
import { countByStatus } from '../../utils/listStatus'

const FILTER_TABS: { id: ListStatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'disputed', label: 'Disputed' },
  { id: 'superseded', label: 'Superseded' },
]

interface ArtifactListHeaderProps<T> {
  rows: T[]
  getStatus: (row: T) => ClaimListStatus | null
  activeFilter: ListStatusFilter
  onFilterChange: (filter: ListStatusFilter) => void
}

export function ArtifactListHeader<T>({
  rows,
  getStatus,
  activeFilter,
  onFilterChange,
}: ArtifactListHeaderProps<T>) {
  const counts = countByStatus(rows, getStatus)
  const total = counts.all || 1
  const segAccepted = (counts.accepted / total) * 100
  const segDisputed = (counts.disputed / total) * 100
  const segSuperseded = (counts.superseded / total) * 100

  const countForTab = (id: ListStatusFilter) => {
    if (id === 'all') return counts.all
    return counts[id]
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-end gap-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onFilterChange(tab.id)}
            className={`border-b-2 px-3 py-1.5 text-[12.5px] font-medium transition ${
              activeFilter === tab.id
                ? 'border-[var(--accent)] text-[var(--ink)]'
                : 'border-transparent text-[var(--ink-2)] hover:text-[var(--ink)]'
            }`}
          >
            {tab.label}{' '}
            <span
              className={`font-mono text-[11px] font-normal ${
                activeFilter === tab.id ? 'text-[var(--accent)]' : 'text-[var(--ink-3)]'
              }`}
            >
              {countForTab(tab.id)}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-3 flex h-1.5 min-w-[120px] overflow-hidden rounded-full bg-[var(--rule-soft)]">
        <div className="h-full shrink-0 bg-[var(--good)]" style={{ width: `${segAccepted}%` }} />
        <div className="h-full shrink-0 bg-[var(--warn)]" style={{ width: `${segDisputed}%` }} />
        <div className="h-full shrink-0 bg-[var(--ink-3)]" style={{ width: `${segSuperseded}%` }} />
      </div>
    </div>
  )
}
