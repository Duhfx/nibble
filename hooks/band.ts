// Desktop band: two SVG panels with a fixed layout. Mid-tone colors so they read on light and dark themes alike.

const MUTED = '#8b8aa0'
const TRACK = '#8b8aa0'
const FONT = 'font-family="system-ui,-apple-system,Segoe UI,sans-serif"'

export const HUES = { joy: '#e5679a', food: '#e0a020', energy: '#3a9fe0' }

// Green while comfortable, amber past 60%, red past 85%.
export const heat = (n: number) => (n > 85 ? '#e5484d' : n > 60 ? '#e0a020' : '#2fb88a')

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const cut = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1)}…` : s)

type Meter = { label: string; percent: number; color: string; value?: string; caption?: string; warn?: string; pace?: number; wide?: boolean }

// One labelled meter: label and value on top, a rounded bar, an optional caption below.
function meter(m: Meter, x: number, y: number, width: number): string {
  const fill = Math.max(0, Math.min(100, m.percent)) / 100 * width
  return `<text x="${x}" y="${y}" font-size="10.5" fill="${MUTED}">${esc(m.label)}</text>
${m.value ? `<text x="${x + width}" y="${y}" font-size="10.5" font-weight="650" text-anchor="end" fill="${m.color}">${esc(m.value)}</text>` : ''}
<rect x="${x}" y="${y + 5}" width="${width}" height="5" rx="2.5" fill="${TRACK}" fill-opacity="0.22"/>
${fill > 0 ? `<rect x="${x}" y="${y + 5}" width="${Math.max(fill, 5)}" height="5" rx="2.5" fill="${m.color}"/>` : ''}
${m.pace !== undefined ? `<rect x="${x + Math.min(100, m.pace) / 100 * width - 0.75}" y="${y + 3}" width="1.5" height="9" rx="0.75" fill="${MUTED}"/>` : ''}
${m.caption ? `<text x="${x}" y="${y + 23}" font-size="10" fill="${MUTED}" fill-opacity="0.85">${esc(m.caption)}</text>` : ''}`
}

export type PetPanel = {
  sprite: string
  name: string
  accent: string
  badge: string
  stars: string
  phrase: string
  meters: Meter[]
}

export const PET_WIDTH = 352
export const USAGE_WIDTH = 360
const HEIGHT = 54

export function petPanel(p: PetPanel): string {
  const art = p.sprite.replace('<svg ', '<svg x="0" y="3" width="48" height="48" ')
  const meters = p.meters.map((m, i) => meter(m, 60 + i * 73, 33, 62)).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${PET_WIDTH}" height="${HEIGHT}" viewBox="0 0 ${PET_WIDTH} ${HEIGHT}" ${FONT}>
${art}
<text x="60" y="15" font-size="13">
<tspan font-weight="700" fill="${p.accent}">${esc(p.name)}</tspan>${p.stars ? `<tspan dx="4" fill="#e0a020" font-size="11">${esc(p.stars)}</tspan>` : ''}<tspan dx="7" font-size="10.5" fill="${p.accent}" font-weight="600">${esc(p.badge)}</tspan><tspan dx="8" font-size="11" font-style="italic" fill="${MUTED}">${esc(cut(p.phrase, 34))}</tspan>
</text>
${meters}
</svg>`
}

export function usagePanel(meters: Meter[]): string {
  // Limit columns get more room than context: their title row carries the reset time and, when it comes first, the run-out time.
  const room = USAGE_WIDTH - (meters.length - 1) * 14
  const share = meters.reduce((sum, m) => sum + (m.wide ? 4 : 3), 0)
  let x = 0
  const body = meters.map(m => {
    const width = (room * (m.wide ? 4 : 3)) / share
    const caption = m.caption ? `<text x="${x}" y="15" font-size="10" fill="${MUTED}" fill-opacity="0.85">${esc(m.caption)}</text>` : ''
    const warn = m.warn ? `<text x="${x + width}" y="15" font-size="10" font-weight="650" text-anchor="end" fill="#e5484d">${esc(m.warn)}</text>` : ''
    const out = caption + warn + meter({ ...m, caption: undefined }, x, 33, width)
    x += width + 14
    return out
  }).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${USAGE_WIDTH}" height="${HEIGHT}" viewBox="0 0 ${USAGE_WIDTH} ${HEIGHT}" ${FONT}>${body}</svg>`
}
