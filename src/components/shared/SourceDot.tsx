import { DATA_SOURCE_LABELS } from '../../utils/dataSource'
import type { DataSource } from '../../utils/dataSource'

interface SourceDotProps {
  source: DataSource
  show: boolean
}

const COLORS: Record<DataSource, string> = {
  real: '#22c55e',
  simulated: '#eab308',
  mock: '#ef4444',
  unavailable: '#64748b',
  unknown: '#8b5cf6',
}

export function SourceDot({ source, show }: SourceDotProps) {
  return (
    <span
      aria-hidden="true"
      title={DATA_SOURCE_LABELS[source]}
      style={{
        backgroundColor: COLORS[source],
        display: show ? 'inline-block' : 'inline-block',
        height: 6,
        marginLeft: 4,
        opacity: show ? 1 : 0,
        verticalAlign: 'middle',
        width: 6,
      }}
      className="rounded-full"
    />
  )
}
