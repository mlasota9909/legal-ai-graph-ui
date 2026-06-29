export type DataSource = 'real' | 'mock' | 'simulated' | 'unavailable' | 'unknown'

export const DATA_SOURCE_LABELS: Record<DataSource, string> = {
  real: 'real data',
  simulated: 'simulated data',
  mock: 'mock data',
  unavailable: 'source unavailable',
  unknown: 'unknown source state',
}

export function isDataSource(value: unknown): value is DataSource {
  return (
    value === 'real' ||
    value === 'simulated' ||
    value === 'mock' ||
    value === 'unavailable' ||
    value === 'unknown'
  )
}

export function parseDataSource(value: unknown): DataSource {
  if (isDataSource(value)) return value
  if (value == null || value === '') return 'unavailable'
  return 'unknown'
}

export function parseOptionalDataSource(value: unknown): DataSource | undefined {
  if (value == null || value === '') return undefined
  return parseDataSource(value)
}
