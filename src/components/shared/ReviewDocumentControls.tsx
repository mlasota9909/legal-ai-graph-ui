export function ReviewDocumentControls() {
  return (
    <div className="flex flex-wrap gap-2 text-[11px]" aria-label="Document management">
      <button
        type="button"
        disabled
        title="Upload API is not available in this review service."
        className="rounded border border-[var(--rule)] bg-[var(--panel-dim)] px-3 py-1.5 font-mono uppercase tracking-[0.04em] text-[var(--ink-3)] disabled:cursor-not-allowed"
      >
        Upload document unavailable
      </button>
      <button
        type="button"
        disabled
        title="No safe archive or delete endpoint is configured; no document data was changed."
        className="rounded border border-[var(--rule)] bg-[var(--panel-dim)] px-3 py-1.5 font-mono uppercase tracking-[0.04em] text-[var(--ink-3)] disabled:cursor-not-allowed"
      >
        Archive/Delete unavailable
      </button>
    </div>
  )
}
