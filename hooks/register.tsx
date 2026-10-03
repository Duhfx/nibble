import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { NibbleMood, NibblePet, NibbleStage, NibbleUsage } from '../types'
import { STRINGS } from './i18n'
import { HUES, PET_WIDTH, USAGE_WIDTH, heat, petPanel, usagePanel } from './band'
import { ACCENT, cells, sprite, svg } from './sprites'

const pet = atom({ plugin: 'nibble-context', key: 'pet' } as const, null)
const flash = atom({ plugin: 'nibble-context', key: 'flash' } as const, null)
const frame = atom({ plugin: 'nibble-context', key: 'frame' } as const, 0)
const usage = atom({ plugin: 'nibble-context', key: 'usage' } as const, null)

const HATCH = 15
// ponytail: thresholds tuned for ~500 tool calls/day: adult day 1, master ~1 week, legend ~6 weeks, then a star every ~10 days.
const STAGES: [NibbleStage, number][] = [['egg', 0], ['baby', HATCH], ['adult', 150], ['master', 3000], ['legend', 20000]]
const STAR = 5000
const LEGEND = 20000
const MINUTE = 60_000
const EDITS = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit'])
const TESTS = /\b(test|tests|pytest|jest|vitest|rspec|phpunit)\b/

const stageOf = (xp: number): NibbleStage => STAGES.findLast(([, min]) => xp >= min)![0]
const starsOf = (xp: number) => (xp < LEGEND ? 0 : Math.floor((xp - LEGEND) / STAR))

// What the xp bar leads to.
const GOAL: Record<NibbleStage, string> = { egg: '🐣', baby: '🟣', adult: '👑', master: '🌟', legend: '★' }
const clamp = (n: number) => Math.max(0, Math.min(100, n))

function moodOf(p: NibblePet, flashed: NibbleMood | undefined, now: number): NibbleMood {
  if (flashed) return flashed
  if (p.energy < 15 || now - p.lastActive > 10 * MINUTE) return 'sleep'
  if (p.food < 25) return 'hungry'
  if (p.joy < 25) return 'sad'
  if (p.joy > 75) return 'happy'
  return 'ok'
}

const bar = (n: number) => '▰'.repeat(Math.round(n / 20)) + '▱'.repeat(5 - Math.round(n / 20))

let flashes = 0

async function refreshUsage($: EngineInterface) {
  const u = await $.session.usage()
  const now = await $.clock.now()
  const saved = ((await $.store.get('limits')) ?? {}) as Record<string, NibbleUsage['session']>
  const limit = (kind: string) => {
    const r = u.rateLimits.find(l => l.kind === kind)
    if (r) return { percent: r.percentUsed, resetsAt: r.resetsAt }
    // A new session learns its limits only with its first response: until then, show the last known ones that haven't reset.
    const last = saved[kind]
    return last?.resetsAt && Date.parse(last.resetsAt) > now ? last : undefined
  }
  const next: NibbleUsage = { startedAt: u.startedAt, context: u.context.percent, session: limit('five_hour'), week: limit('seven_day') }
  if (u.rateLimits.length > 0) await $.store.set('limits', { five_hour: next.session, seven_day: next.week })
  await update($, usage, () => next)
}

const pad = (n: number) => String(n).padStart(2, '0')
const clock = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`

// Applies a change, persists it, and celebrates stage changes.
async function change($: EngineInterface, fn: (p: NibblePet) => NibblePet) {
  const before = await read($, pet)
  if (before === null) return
  const after = await update($, pet, p => fn(p!))
  await $.store.set('pet', after)
  const t = STRINGS[after!.lang ?? 'pt-BR']
  if (stageOf(before.xp) !== stageOf(after!.xp)) {
    $.ui.toast(t.arrival[stageOf(after!.xp)].replace('{n}', after!.name), { timeoutMs: 6000 })
    await show($, 'happy', 5000)
  } else if (starsOf(after!.xp) > starsOf(before.xp)) {
    $.ui.toast(t.star.replace('{n}', after!.name).replace('{k}', String(starsOf(after!.xp))), { timeoutMs: 6000 })
    await show($, 'happy', 5000)
  }
}

async function show($: EngineInterface, mood: NibbleMood, ms: number) {
  const id = ++flashes
  await update($, flash, () => ({ mood, id }))
  $.clock.after(ms, () => void update($, flash, f => (f?.id === id ? null : f)))
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const now = await $.clock.now()
    const saved = (await $.store.get('pet')) as NibblePet | undefined
    const away = saved ? (now - saved.lastSeen) / MINUTE : 0
    // ponytail: offline it gets hungry slowly (1 point per 10 min) and wakes up rested.
    const loaded: NibblePet = saved
      ? { ...saved, food: clamp(saved.food - away / 10), energy: away > 30 ? 100 : saved.energy, lastActive: now, lastSeen: now }
      : { name: 'Nibble', xp: 0, food: 80, joy: 60, energy: 100, lastActive: now, lastSeen: now }
    await update($, pet, () => loaded)
    await $.store.set('pet', loaded)

    $.clock.every(400, () => void update($, frame, f => (f + 1) % 1200))
    await refreshUsage($)
    $.clock.every(MINUTE, async () => {
      await refreshUsage($)
      const t = await $.clock.now()
      await change($, p => {
        const idle = t - p.lastActive > 5 * MINUTE
        return {
          ...p,
          food: stageOf(p.xp) === 'egg' ? p.food : clamp(p.food - 1),
          energy: clamp(p.energy + (idle ? 4 : -1)),
          joy: clamp(p.joy + Math.sign(50 - p.joy)),
          lastSeen: t,
        }
      })
    })

    await $.command.register({ name: 'nibble-lang', description: 'Nibble: idioma / language (pt-BR | en)' })
    await $.command.register({ name: 'nibble-name', description: 'Nibble: renomear o bichinho / rename your pet' })

    return next(e)
  })

  on('command.run', { command: 'nibble-name' }, async ($, e) => {
    const name = e.args.trim().replace(/\s+/g, ' ')
    const p = await read($, pet)
    const en = p?.lang === 'en'
    if (!name || name.length > 16) return { text: en ? 'Use: /nibble-name <name> (up to 16 characters)' : 'Use: /nibble-name <nome> (até 16 caracteres)' }
    await change($, x => ({ ...x, name }))
    await show($, 'happy', 3000)
    return { text: en ? `Your pet is now called ${name}.` : `Seu bichinho agora se chama ${name}.` }
  })

  on('command.run', { command: 'nibble-lang' }, async ($, e) => {
    const arg = e.args.trim().toLowerCase()
    const lang = arg.startsWith('en') ? 'en' : arg.startsWith('pt') ? 'pt-BR' : undefined
    if (!lang) return { text: 'Use: /nibble-lang pt-BR | en' }
    await change($, p => ({ ...p, lang }))
    return { text: lang === 'en' ? `${(await read($, pet))?.name} now speaks English.` : `${(await read($, pet))?.name} agora fala português.` }
  })

  on('turn.complete', async ($, e, next) => {
    await refreshUsage($)
    return next(e)
  })

  on('prompt.submit', async ($, e, next) => {
    const now = await $.clock.now()
    await change($, p => ({ ...p, joy: clamp(p.joy + 2), lastActive: now }))
    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    const ran = await next(e)
    if (ran.deny !== undefined) return ran

    const now = await $.clock.now()
    const failed = ran.isError === true
    const isTest = e.tool === 'Bash' && TESTS.test((e as { command?: string }).command ?? '')
    const isEdit = EDITS.has(e.tool)

    await change($, p => ({
      ...p,
      xp: p.xp + (isTest && !failed ? 3 : isEdit || e.tool === 'Bash' ? 1 : 0),
      food: clamp(p.food + (failed ? 0 : isEdit ? 4 : e.tool === 'Bash' ? 2 : 0)),
      joy: clamp(p.joy + (isTest ? (failed ? -8 : 12) : failed ? -3 : 0)),
      energy: clamp(p.energy - 0.5),
      lastActive: now,
    }))

    if (isTest) await show($, failed ? 'worried' : 'happy', 4000)
    else if (failed) await show($, 'worried', 2500)
    else if (isEdit) await show($, 'eating', 1600)

    return ran
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const p = await read($, pet)
    if (e.props.hasSurvey || p === null) return next(e)

    const { Box, Text } = $.ui.resolve(e)
    const t = STRINGS[p.lang ?? 'pt-BR']
    const stage = stageOf(p.xp)
    const accent = ACCENT[stage]
    const flashed = (await read($, flash))?.mood
    const u = await read($, usage)
    // The pet worries about a full context or a nearly spent limit, unless something more immediate is going on.
    const alert =
      flashed || stage === 'egg' || u === null ? undefined
      : (u.context ?? 0) >= 80 ? t.contextFull
      : Math.max(u.session?.percent ?? 0, u.week?.percent ?? 0) >= 90 ? t.limitNear
      : undefined
    const calm = moodOf(p, flashed, await $.clock.now())
    const mood = alert && calm !== 'sleep' ? 'worried' : calm

    const cracks = p.xp >= HATCH * 0.6
    const phrase = stage === 'egg' ? (cracks ? t.eggCracking : t.eggCalm) : mood === 'worried' && alert ? alert : t.phrases[mood]
    const stars = starsOf(p.xp)
    const starText = stars > 0 ? '★'.repeat(Math.min(stars, 5)) + (stars > 5 ? `×${stars}` : '') : ''
    const index = STAGES.findIndex(([s]) => s === stage)
    const [from, to] = stage === 'legend' ? [LEGEND + stars * STAR, LEGEND + (stars + 1) * STAR] : [STAGES[index][1], STAGES[index + 1][1]]
    const progress = ((p.xp - from) / (to - from)) * 100
    const badge = `${t.stage[stage]} · ${t.level} ${Math.floor(Math.sqrt(p.xp))}`

    const petMeters = [
      ...(stage === 'egg' ? [] : [
        { label: t.joy, percent: p.joy, color: HUES.joy },
        { label: t.food, percent: p.food, color: HUES.food },
        { label: t.energy, percent: p.energy, color: HUES.energy },
      ]),
      { label: `✨ xp ${GOAL[stage]}`, percent: progress, color: accent },
    ]
    const resets = (iso: string | undefined, withDay: boolean) => {
      if (!iso) return undefined
      const d = new Date(iso)
      return `↻ ${withDay ? `${t.days[d.getDay()]} ` : ''}${clock(d)}`
    }
    const now = await $.clock.now()
    // At the average pace since the window opened: where usage "should" be now, and when it would hit 100%.
    const limitMeter = (label: string, l: NonNullable<NibbleUsage['session']>, length: number, withDay: boolean) => {
      const ends = l.resetsAt ? Date.parse(l.resetsAt) : NaN
      const elapsed = now - (ends - length)
      if (Number.isNaN(ends) || elapsed <= 0) return { label, percent: l.percent, wide: true, caption: resets(l.resetsAt, withDay) }
      const pace = (elapsed / length) * 100
      // ponytail: linear projection from the window's average; ignored in its first 10%, where a few calls swing it wildly.
      const runsOutAt = l.percent > 0 && pace >= 10 ? now + (elapsed * (100 - l.percent)) / l.percent : Infinity
      if (runsOutAt >= ends) return { label, percent: l.percent, pace, wide: true, caption: resets(l.resetsAt, withDay) }
      const d = new Date(runsOutAt)
      return { label, percent: l.percent, pace, wide: true, caption: resets(l.resetsAt, withDay), warn: t.runsOut.replace('{t}', `${withDay ? `${t.days[d.getDay()]} ` : ''}${clock(d)}`) }
    }
    const usageMeters = u === null ? [] : [
      ...(u.context === undefined ? [] : [{ label: t.context, percent: u.context, caption: `${t.started} ${clock(new Date(u.startedAt))}` }]),
      ...(u.session ? [limitMeter(t.session, u.session, 5 * 60 * MINUTE, false)] : []),
      ...(u.week ? [limitMeter(t.week, u.week, 7 * 24 * 60 * MINUTE, true)] : []),
    ].map(m => ({ ...m, color: heat(m.percent), value: `${Math.round(m.percent)}%` }))

    if (e.surface === 'desktop') {
      const { Svg } = $.ui.resolve(e)
      const pose = { stage, mood, blink: false, chomp: true, spark: true, cracks }
      const art = svg(sprite(pose), sprite({ ...pose, blink: true }), mood, stage === 'legend')
      return (
        <Box flexDirection="row" flexWrap="wrap" justifyContent="space-between" alignItems="center" paddingX={1} gap={2}>
          <Svg
            source={petPanel({ sprite: art, name: p.name, accent, badge, stars: starText, phrase, meters: petMeters })}
            alt={`${p.name}, ${badge}: ${phrase}`}
            width={PET_WIDTH}
            height={54}
          />
          {usageMeters.length > 0 && (
            <Svg
              source={usagePanel(usageMeters)}
              alt={usageMeters.map(m => `${m.label} ${m.value}`).join(', ')}
              width={USAGE_WIDTH}
              height={54}
            />
          )}
        </Box>
      )
    }

    let art = null
    if (e.surface === 'terminal') {
      const { Raster } = $.ui.resolve(e)
      const f = await read($, frame)
      const pace = mood === 'sleep' ? 3 : mood === 'happy' || mood === 'eating' ? 0 : 1
      const lift = (f >> pace) & 1
      const shift = stage === 'egg' && cracks && f % 6 < 2 ? (f % 2 ? 1 : -1) : 0
      const pose = { stage, mood, blink: f % 12 === 0, chomp: f % 2 === 0, spark: !e.props.isWorking || f % 2 === 0, cracks, twinkle: ((f >> 1) & 1) as 0 | 1 }
      art = <Raster key="pet" columns={18} rows={9} cells={cells(sprite(pose), lift, shift)} />
    }

    const meterText = (m: { label: string; percent: number; color: string; value?: string; caption?: string; warn?: string }) => (
      <Text>
        <Text dimColor>{m.label} </Text>
        <Text color={m.color}>{bar(m.percent)}{m.value ? ` ${m.value}` : ''}</Text>
        {m.caption && <Text dimColor> {m.caption}</Text>}
        {m.warn && <Text color="#e5484d" bold> {m.warn}</Text>}
        <Text>   </Text>
      </Text>
    )

    return (
      <Box flexDirection="row" gap={2} paddingX={1} alignItems="center">
        {art}
        <Box flexDirection="column" flexGrow={1}>
          <Text wrap="truncate">
            <Text bold color={accent}>{p.name}</Text>
            {starText && <Text color="#e0a020"> {starText}</Text>}
            <Text color={accent}>  {badge}  </Text>
            <Text italic dimColor>{phrase}</Text>
          </Text>
          <Text wrap="truncate">{petMeters.map(meterText)}</Text>
          {e.props.bodyColumns >= 100 && usageMeters.length > 0 && <Text wrap="truncate">{usageMeters.map(meterText)}</Text>}
        </Box>
      </Box>
    )
  })
}
