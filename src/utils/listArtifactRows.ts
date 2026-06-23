import type { ArtifactView, WorkspaceData } from '../types/contracts'

const LIST_ARTIFACT_IDS = ['chronology', 'entities', 'people'] as const

export type ListArtifactId = (typeof LIST_ARTIFACT_IDS)[number]

export function isListArtifactId(id: ArtifactView): id is ListArtifactId {
  return (LIST_ARTIFACT_IDS as readonly string[]).includes(id)
}

/** Rows actually loaded in the UI for this list artifact (mock preview set). */
export function loadedListCount(data: WorkspaceData, id: ListArtifactId): number {
  if (id === 'chronology') return data.chronology.length
  if (id === 'entities') return data.entities.length
  return data.people.length
}
