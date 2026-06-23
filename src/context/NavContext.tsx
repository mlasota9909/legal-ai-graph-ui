import { createContext, useContext } from 'react'
import type { ArtifactView } from '../types/contracts'
import type { ListStatusFilter } from '../types/listFilter'

export interface NavState {
  view: ArtifactView
  highlight: string | null
  listFilter: ListStatusFilter
  showSources: boolean
  setListFilter: (filter: ListStatusFilter) => void
  go: (view: ArtifactView, highlightId?: string, listFilter?: ListStatusFilter) => void
  selectRun: (documentId: string) => void
  toggleSources: () => void
}

export const NavContext = createContext<NavState | null>(null)

export function useNav(): NavState | null {
  return useContext(NavContext)
}
