import type { NibbleMood, NibbleStage } from '../types'

// 16x16 sprites, one char per pixel. '.' is transparent.
type Form = 'egg' | 'baby' | 'adult'

const SHAPES: Record<Form, string[]> = {
  egg: [
    '................',
    '................',
    '......oooo......',
    '.....ohhbbo.....',
    '....ohhbbbbo....',
    '....ohbbbbbo....',
    '...ohbbbbbbbo...',
    '...obbbbbaabo...',
    '...obbbbbaabo...',
    '..obbaabbbbbbo..',
    '..obbaabbbbbbo..',
    '..obbbbbbabbbo..',
    '..osbbbbbbbbso..',
    '...osbbbbbbso...',
    '....osssssso....',
    '.....oooooo.....',
  ],
  baby: [
    '................',
    '.......Yy.......',
    '.......yy.......',
    '........s.......',
    '........s.......',
    '.....oooooo.....',
    '....ohhhbbbo....',
    '...ohhbbbbbbo...',
    '..ohbbbbbbbbbo..',
    '..obbbbbbbbbbo..',
    '.obbbbbbbbbbbbo.',
    '.obbbbbbbbbbbbo.',
    '.obbbbbbbbbbbbo.',
    '.osbbbbbbbbbbso.',
    '..osssssssssso..',
    '...oooooooooo...',
  ],
  adult: [
    '..o..........o..',
    '.oco........oco.',
    '.ocbo......obco.',
    '.obbboooooobbbo.',
    '.ohhbbbbbbbbbbo.',
    '.ohbbbbbbbbbbbo.',
    '.obbbbbbbbbbbbo.',
    '.obbbbbbbbbbbbo.',
    '.obbbbbbbbbbbbo.',
    '.osbbbbbbbbbbso.',
    '..ossbbbbbbsso..',
    '...oobbbbbboo...',
    '..obbbllllbbbo..',
    '.obobllllllbobo.',
    '..oobbllllbboo..',
    '...ooo....ooo...',
  ],
}

// Master and legend reuse the adult body; their look comes from the crown, palette and sparkles.
const formOf = (stage: NibbleStage): Form => (stage === 'master' || stage === 'legend' ? 'adult' : stage)

const CROWN = ['Y.YY.Y', 'yyyyyy', 'yymmyy']

// Two sets of sparkle pixels that take turns around the legend.
const SPARKLES = [[[0, 4], [15, 10]], [[15, 3], [0, 11]]]

// Where the face goes: eyes at x=3 and x=9 (4 wide), mouth at x=6, cheeks at x=3 and x=11.
const FACE: Record<'baby' | 'adult', { eyes: number; mouth: number }> = {
  baby: { eyes: 9, mouth: 11 },
  adult: { eyes: 6, mouth: 8 },
}

const EYES = {
  open: ['.wk.', '.kk.'],
  closed: ['....', '.kk.'],
  happy: ['.kk.', 'k..k'],
}

const MOUTHS = {
  smile: ['k..k', '.kk.'],
  grin: ['kmmk', '.kk.'],
  flat: ['....', '.kk.'],
  frown: ['.kk.', 'k..k'],
  o: ['.kk.', '.kk.'],
}

const INK: Record<string, number> = {
  k: 0x1d1b33,
  w: 0xffffff,
  c: 0xff8fb1,
  m: 0xe8475f,
  t: 0x6ec8ff,
  y: 0xffc93d,
  Y: 0xfff3b0,
}

export const PALETTES: Record<NibbleStage, Record<string, number>> = {
  egg: { o: 0x8a80c4, b: 0xf1eeff, h: 0xffffff, s: 0xc9c2ea, a: 0xff9ec4 },
  baby: { o: 0x1d7a5e, b: 0x6fe9bd, h: 0xc4ffe8, s: 0x35b38c },
  adult: { o: 0x4636a8, b: 0x9d8cff, h: 0xd9d2ff, s: 0x6857d6, l: 0xf2efff },
  master: { o: 0x4636a8, b: 0x9d8cff, h: 0xd9d2ff, s: 0x6857d6, l: 0xf2efff },
  legend: { o: 0xa8509a, b: 0xffd6ef, h: 0xffffff, s: 0xeaa6dc, l: 0xfff4c4 },
}

// The accent shown in the band's text for each stage.
export const ACCENT: Record<NibbleStage, string> = {
  egg: '#d07fb0',
  baby: '#2fb88a',
  adult: '#7b6cf0',
  master: '#d9a21b',
  legend: '#e06cc0',
}

export type Grid = (number | null)[][]

type Pose = { stage: NibbleStage; mood: NibbleMood; blink: boolean; chomp: boolean; spark: boolean; cracks: boolean; twinkle?: 0 | 1 }

function stamp(rows: string[][], art: string[], x: number, y: number) {
  art.forEach((line, dy) =>
    [...line].forEach((ch, dx) => {
      if (ch !== '.') rows[y + dy][x + dx] = ch
    }),
  )
}

// One 16x16 frame as colors, null where transparent.
export function sprite(pose: Pose): Grid {
  const rows = SHAPES[formOf(pose.stage)].map(line => [...line])

  if (pose.stage === 'egg') {
    if (pose.cracks) {
      for (const [x, y] of [[6, 5], [7, 4], [8, 5], [9, 4]]) rows[y][x] = 'o'
    }
  } else {
    const { eyes, mouth } = FACE[formOf(pose.stage) as 'baby' | 'adult']
    const m = pose.mood
    const eye =
      m === 'happy' || m === 'eating' ? EYES.happy
      : m === 'sad' || m === 'sleep' || pose.blink ? EYES.closed
      : EYES.open
    const lips =
      m === 'happy' ? MOUTHS.grin
      : m === 'eating' ? (pose.chomp ? MOUTHS.grin : MOUTHS.flat)
      : m === 'sad' ? MOUTHS.frown
      : m === 'hungry' || m === 'worried' ? MOUTHS.o
      : m === 'sleep' ? MOUTHS.flat
      : MOUTHS.smile
    stamp(rows, eye, 3, eyes)
    stamp(rows, eye, 9, eyes)
    stamp(rows, lips, 6, mouth)
    if (m === 'ok' || m === 'happy' || m === 'eating') {
      stamp(rows, ['cc'], 3, mouth)
      stamp(rows, ['cc'], 11, mouth)
    }
    if (m === 'sad') rows[eyes + 2][4] = 't'
    if (m === 'worried') stamp(rows, ['t', 't'], 13, eyes - 3)
    if (pose.stage === 'baby' && !pose.spark) {
      rows[1][7] = 'y'
    }
    if (pose.stage === 'master' || pose.stage === 'legend') stamp(rows, CROWN, 5, 0)
    if (pose.stage === 'legend' && pose.twinkle !== undefined) {
      for (const [x, y] of SPARKLES[pose.twinkle]) rows[y][x] = 'Y'
    }
  }

  const palette = { ...INK, ...PALETTES[pose.stage] }
  return rows.map(line => line.map(ch => (ch === '.' ? null : palette[ch])))
}

const DEFAULT = 0x01000000
const SHADOW = 0x2c2a40

// Terminal: an 18x18 canvas (sprite, bob and shadow) packed two pixels per cell with half blocks.
export function cells(art: Grid, lift: number, shift: number): string {
  const canvas: Grid = Array.from({ length: 18 }, () => Array(18).fill(null))
  const half = lift ? 4 : 5
  for (let x = 9 - half; x < 9 + half; x++) canvas[17][x] = SHADOW
  art.forEach((line, y) => line.forEach((c, x) => {
    if (c !== null) canvas[1 + y - lift][1 + x + shift] = c
  }))

  const words = new Uint32Array(18 * 9 * 3)
  let i = 0
  for (let r = 0; r < 9; r++) {
    for (let x = 0; x < 18; x++) {
      const top = canvas[2 * r][x]
      const bottom = canvas[2 * r + 1][x]
      if (top === null && bottom === null) words.set([0x20, DEFAULT, DEFAULT], i)
      else if (top === null) words.set([0x2584, bottom!, DEFAULT], i)
      else words.set([0x2580, top, bottom ?? DEFAULT], i)
      i += 3
    }
  }
  return new Uint8Array(words.buffer).toBase64()
}

const hex = (c: number) => `#${c.toString(16).padStart(6, '0')}`

function rects(art: Grid, only?: Grid): string {
  let out = ''
  art.forEach((line, y) => {
    let x = 0
    while (x < 16) {
      const c = line[x]
      const skip = c === null || (only !== undefined && only[y][x] === c)
      if (skip) { x++; continue }
      let end = x + 1
      while (end < 16 && line[end] === c && !(only !== undefined && only[y][end] === c)) end++
      out += `<rect x="${x}" y="${y}" width="${end - x}" height="1" fill="${hex(c!)}"/>`
      x = end
    }
  })
  return out
}

// Desktop: SVG with SMIL doing the bob, the blink and the z's, so nothing redraws per frame.
export function svg(open: Grid, blink: Grid, mood: NibbleMood, sparkles: boolean): string {
  const asleep = mood === 'sleep'
  const dur = asleep ? '3.2s' : mood === 'happy' || mood === 'eating' ? '0.6s' : '1.4s'
  const lift = asleep ? 0.4 : 1
  const z = asleep
    ? [0, 1].map(n => `<text x="16" y="3" font-family="ui-monospace,monospace" font-size="${3 - n}" font-weight="700" fill="#9d8cff" opacity="0">z<animate attributeName="opacity" values="0;1;0" dur="3s" begin="${n * 1.5}s" repeatCount="indefinite"/><animateTransform attributeName="transform" type="translate" values="0 2;1.5 -1.5" dur="3s" begin="${n * 1.5}s" repeatCount="indefinite"/></text>`).join('')
    : ''
  const twinkle = sparkles
    ? SPARKLES.map((set, n) => `<g opacity="${1 - n}"><animate attributeName="opacity" values="${1 - n};${n}" calcMode="discrete" dur="1.2s" repeatCount="indefinite"/>${set.map(([x, y]) => `<rect x="${x}" y="${y}" width="1" height="1" fill="#fff3b0"/>`).join('')}</g>`).join('')
    : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1 -2 21 21" shape-rendering="crispEdges">
<ellipse cx="8" cy="17.2" rx="5" ry="0.8" fill="#000" opacity="0.22" shape-rendering="auto"><animate attributeName="rx" values="5;4.2;5" dur="${dur}" repeatCount="indefinite"/></ellipse>
<g><animateTransform attributeName="transform" type="translate" values="0 0;0 -${lift};0 0" dur="${dur}" repeatCount="indefinite"/>
${rects(open)}
<g opacity="0"><animate attributeName="opacity" values="0;1;0" keyTimes="0;0.93;0.97" calcMode="discrete" dur="4.5s" repeatCount="indefinite"/>${rects(blink, open)}</g>
</g>${twinkle}${z}</svg>`
}
