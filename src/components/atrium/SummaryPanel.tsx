import type { SummaryResponse } from '../../types/contracts'

interface SummaryPanelProps {
  summary: SummaryResponse | null
}

export function SummaryPanel({ summary }: SummaryPanelProps) {
  if (!summary) {
    return (
      <div className="px-6 py-8 text-[13px] text-[var(--ink-3)]">
        Loading document summary…
      </div>
    )
  }

  const pageRefs = (provenance: SummaryResponse['overview']['provenance']) => {
    const pages = [...new Set(provenance.map((p) => p.page_start).filter((p): p is number => p != null))].sort((a, b) => a - b)
    if (pages.length === 0) return null
    return (
      <div className="mt-2 flex flex-wrap gap-1">
        {pages.slice(0, 8).map((p) => (
          <span key={p} className="font-mono text-[10px] text-[var(--ink-3)] bg-[var(--rule-soft)] px-1.5 py-0.5 rounded">
            p.{p}
          </span>
        ))}
        {pages.length > 8 && (
          <span className="font-mono text-[10px] text-[var(--ink-3)]">+{pages.length - 8} more</span>
        )}
      </div>
    )
  }

  return (
    <div className="divide-y divide-[var(--rule-soft)]">
      {/* Header / data source badge */}
      <div className="px-6 py-4 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-3)]">
          Graph-grounded summary
        </span>
        <span className="font-mono text-[10px] text-[var(--accent)] bg-[var(--rule-soft)] px-2 py-0.5 rounded">
          {summary.data_source}
        </span>
      </div>

      {/* Overview */}
      <div className="px-6 py-5">
        <p className="text-[var(--ink)] leading-relaxed text-[13.5px]">{summary.overview.text}</p>
        {pageRefs(summary.overview.provenance)}
      </div>

      {/* Sections */}
      {summary.sections.map((section, i) => (
        <div key={i} className="px-6 py-5">
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-2)] mb-2">
            {section.title}
          </h3>
          <p className="text-[13px] text-[var(--ink)] leading-relaxed">{section.text}</p>
          {pageRefs(section.provenance)}
        </div>
      ))}

      {/* Recommendations */}
      {summary.recommendations && summary.recommendations.length > 0 && (
        <div className="px-6 py-5">
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-2)] mb-3">
            Recommendations ({summary.recommendations.length})
          </h3>
          <div className="space-y-3">
            {summary.recommendations.slice(0, 5).map((rec, i) => (
              <div key={i} className="text-[13px] text-[var(--ink)] leading-relaxed border-l-2 border-[var(--accent)] pl-3">
                {rec.rec_text}
                {rec.rec_page != null && (
                  <span className="ml-2 font-mono text-[10px] text-[var(--ink-3)]">p.{rec.rec_page}</span>
                )}
              </div>
            ))}
            {summary.recommendations.length > 5 && (
              <p className="text-[11px] text-[var(--ink-3)]">+ {summary.recommendations.length - 5} more recommendations</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
