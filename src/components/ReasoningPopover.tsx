import { useCallback, useState, type MouseEvent, type ReactNode } from 'react'
import type { Reasoning } from '../types/contracts'
import { useNav } from '../context/NavContext'

interface ReasoningPopoverProps {
  reasoning?: Reasoning | null
  align?: 'left' | 'right'
  /** Confidence shown in the header (citations / some chips). */
  conf?: number
  /** When set with workspace nav, opens the (stub) evidence inspector route. */
  claimId?: string
  /** Use compact trigger for list rows / chips. */
  variant?: 'inline' | 'icon-only'
  children?: ReactNode
}

function normalizeDissent(d: string | undefined): boolean {
  if (!d) return false
  const t = d.trim()
  return t !== '—' && t !== 'None' && t !== '-'
}

export function ReasoningPopover({
  reasoning,
  align = 'left',
  conf,
  claimId,
  variant = 'inline',
  children,
}: ReasoningPopoverProps) {
  const nav = useNav()
  const [hover, setHover] = useState(false)
  const [pinned, setPinned] = useState(false)
  const open = hover || pinned
  const content = reasoning

  const alignClass = align === 'right' ? 'right-0' : 'left-0'

  const onEvidence = useCallback(
    (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (nav && claimId) nav.go('evidence', claimId)
    },
    [nav, claimId]
  )

  if (variant === 'icon-only' && !reasoning) return null

  const trigger =
    variant === 'icon-only' ? (
      <button
        type="button"
        aria-label="Show reasoning"
        className={`inline-flex cursor-help items-center justify-center rounded border-0 bg-transparent p-0.5 text-[var(--ink-3)] transition hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] ${
          pinned ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : ''
        }`}
        onClick={(e) => {
          e.stopPropagation()
          if (reasoning) setPinned((p) => !p)
        }}
      >
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path
            d="M2.5 3.5h7M2.5 6h7M2.5 8.5h4"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
      </button>
    ) : (
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation()
          if (reasoning) setPinned((p) => !p)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            if (reasoning) setPinned((p) => !p)
          }
        }}
        className={`inline-flex ${reasoning ? 'cursor-pointer' : ''}`}
      >
        {children}
      </span>
    )

  return (
    <span
      className="relative inline-flex align-middle"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {trigger}
      {open && content && (
        <div
          className={`absolute ${alignClass} bottom-full z-[200] mb-1.5 w-[300px] rounded-lg border border-[var(--rule)] bg-[var(--panel)] px-3 py-3 text-left font-sans text-[11.5px] font-normal leading-relaxed text-[var(--ink-2)] shadow-xl`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-2 flex items-baseline justify-between gap-3 font-mono text-[9.5px] uppercase tracking-[0.06em] text-[var(--ink-3)]">
            <span className="font-semibold text-[var(--accent)]">
              ↳ {content.method.toLowerCase().replace(/_/g, ' ')}
            </span>
            <span>
              {content.lanes}
              {conf != null && (
                <span className="text-[var(--ink-2)]"> · conf {conf.toFixed(2)}</span>
              )}
            </span>
          </div>
          <div className="mb-2 text-[12px] text-[var(--ink)]">{content.text}</div>
          {normalizeDissent(content.dissent) && (
            <div className="mb-2 border-t border-[var(--rule-soft)] pt-2 text-[11px] text-[var(--warn)]">
              <span className="mr-1 font-mono text-[9.5px] font-semibold uppercase tracking-[0.06em]">
                Dissent
              </span>
              {content.dissent}
            </div>
          )}
          {claimId && nav && (
            <button
              type="button"
              className="mt-1 w-full border-t border-[var(--rule-soft)] pt-2 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--accent)] hover:text-[#2d4844]"
              onClick={onEvidence}
            >
              Open in evidence inspector →
            </button>
          )}
        </div>
      )}
    </span>
  )
}
