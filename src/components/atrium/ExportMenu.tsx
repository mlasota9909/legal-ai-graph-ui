import { useEffect, useRef, useState } from 'react'

interface ExportMenuProps {
  onExportFullReport: () => void
  onExportPdf: () => void
  onExportExcel: () => void
  onExportWord: () => void
}

export function ExportMenu({ onExportFullReport, onExportPdf, onExportExcel, onExportWord }: ExportMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-lg border border-[var(--rule)] bg-[var(--panel)] px-3 py-1.5 text-[12.5px] font-medium text-[var(--ink)] hover:bg-[var(--rule-soft)]"
      >
        Export
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[140px] overflow-hidden rounded-lg border border-[var(--rule)] bg-[var(--panel)] py-1 shadow-lg">
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-[12px] text-[var(--ink)] hover:bg-[var(--bg)]"
            onClick={() => {
              setOpen(false)
              onExportFullReport()
            }}
          >
            Full Report
          </button>
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-[12px] text-[var(--ink)] hover:bg-[var(--bg)]"
            onClick={() => {
              setOpen(false)
              onExportPdf()
            }}
          >
            Print
          </button>
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-[12px] text-[var(--ink)] hover:bg-[var(--bg)]"
            onClick={() => {
              setOpen(false)
              onExportExcel()
            }}
          >
            Export Excel
          </button>
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-[12px] text-[var(--ink)] hover:bg-[var(--bg)]"
            onClick={() => {
              setOpen(false)
              onExportWord()
            }}
          >
            Export Word
          </button>
        </div>
      )}
    </div>
  )
}
