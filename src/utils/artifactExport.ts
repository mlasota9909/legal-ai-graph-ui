import type { ChronologyClaim, EntityRow, PersonRow } from '../types/contracts'

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10)
}

function downloadText(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 150)
}

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

export function exportChronologyCsv(rows: ChronologyClaim[], artifactSlug: string) {
  const header = ['id', 'date', 'page', 'title', 'status', 'lane', 'confidence', 'who']
  const lines = rows.map((r) =>
    [
      r.id,
      r.date,
      String(r.page),
      r.title,
      r.status,
      r.lane,
      r.conf.toFixed(2),
      r.who.join('; '),
    ]
      .map(escapeCsv)
      .join(',')
  )
  downloadText(`${artifactSlug}-${dateStamp()}.csv`, [header.join(','), ...lines].join('\n'), 'text/csv;charset=utf-8')
}

export function exportEntityCsv(rows: EntityRow[], artifactSlug: string) {
  const header = ['id', 'canonical', 'type', 'mentions', 'aliases', 'confidence', 'asic', 'lastSeen', 'status']
  const lines = rows.map((r) =>
    [r.id, r.canonical, r.type, String(r.mentions), String(r.aliases), r.conf.toFixed(2), r.asic ?? '', r.lastSeen, r.status ?? 'accepted']
      .map(escapeCsv)
      .join(',')
  )
  downloadText(`${artifactSlug}-${dateStamp()}.csv`, [header.join(','), ...lines].join('\n'), 'text/csv;charset=utf-8')
}

export function exportPeopleCsv(rows: PersonRow[], artifactSlug: string) {
  const header = ['id', 'name', 'role', 'mentions', 'confidence', 'source', 'lastSeen', 'status']
  const lines = rows.map((r) =>
    [
      r.id,
      r.name,
      r.role,
      String(r.mentions),
      r.conf.toFixed(2),
      r.source,
      r.lastSeen,
      r.status ?? (r.disputed || r.review ? 'disputed' : 'accepted'),
    ]
      .map(escapeCsv)
      .join(',')
  )
  downloadText(`${artifactSlug}-${dateStamp()}.csv`, [header.join(','), ...lines].join('\n'), 'text/csv;charset=utf-8')
}

export function exportChronologyWord(rows: ChronologyClaim[], artifactSlug: string) {
  const lines = rows.map(
    (r) =>
      `${r.date}\t${r.page}\t${r.title}\t${r.status}\t${r.lane}\t${r.conf.toFixed(2)}\t${r.who.join(', ')}`
  )
  downloadText(`${artifactSlug}-${dateStamp()}.txt`, lines.join('\n'), 'text/plain;charset=utf-8')
}

export function exportEntityWord(rows: EntityRow[], artifactSlug: string) {
  const lines = rows.map(
    (r) =>
      `${r.canonical}\t${r.type}\t${r.mentions}\t${r.aliases}\t${r.conf.toFixed(2)}\t${r.asic ?? ''}\t${r.status ?? 'accepted'}`
  )
  downloadText(`${artifactSlug}-${dateStamp()}.txt`, lines.join('\n'), 'text/plain;charset=utf-8')
}

export function exportPeopleWord(rows: PersonRow[], artifactSlug: string) {
  const lines = rows.map(
    (r) =>
      `${r.name}\t${r.role}\t${r.mentions}\t${r.conf.toFixed(2)}\t${r.source}\t${r.status ?? (r.disputed ? 'disputed' : 'accepted')}`
  )
  downloadText(`${artifactSlug}-${dateStamp()}.txt`, lines.join('\n'), 'text/plain;charset=utf-8')
}

export function exportPdf() {
  window.print()
}

export async function exportFullReport(docId: string): Promise<void> {
  const url = `/api/docs/${encodeURIComponent(docId)}/export/html`
  const a = document.createElement('a')
  a.href = url
  a.download = `${docId}-report.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
