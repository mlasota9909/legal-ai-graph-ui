import type { ChronologyClaim, EntityRow, PersonRow } from '../types/contracts'
import type { ClaimListStatus, ListStatusFilter } from '../types/listFilter'

export function chronologyListStatus(row: ChronologyClaim): ClaimListStatus | null {
  if (row.status === 'accepted' || row.status === 'disputed' || row.status === 'superseded') {
    return row.status
  }
  return null
}

export function entityListStatus(row: EntityRow): ClaimListStatus {
  if (row.status) return row.status
  if (row.candidate) return 'disputed'
  return 'accepted'
}

export function personListStatus(row: PersonRow): ClaimListStatus {
  if (row.status) return row.status
  if (row.disputed || row.review) return 'disputed'
  return 'accepted'
}

export function matchesListFilter(status: ClaimListStatus | null, filter: ListStatusFilter): boolean {
  if (filter === 'all') return true
  return status === filter
}

export function countByStatus<T>(
  rows: T[],
  getStatus: (row: T) => ClaimListStatus | null
): { all: number; accepted: number; disputed: number; superseded: number } {
  const counts = { all: rows.length, accepted: 0, disputed: 0, superseded: 0 }
  for (const row of rows) {
    const s = getStatus(row)
    if (s === 'accepted') counts.accepted += 1
    if (s === 'disputed') counts.disputed += 1
    if (s === 'superseded') counts.superseded += 1
  }
  return counts
}
