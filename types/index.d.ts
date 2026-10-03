export type NibbleStage = 'egg' | 'baby' | 'adult' | 'master' | 'legend'
export type NibbleMood = 'ok' | 'happy' | 'eating' | 'hungry' | 'sad' | 'worried' | 'sleep'

export type NibbleLang = 'pt-BR' | 'en'

export type NibblePet = {
  name: string
  xp: number
  food: number
  joy: number
  energy: number
  lastActive: number
  lastSeen: number
  lang?: NibbleLang
}

// The session figures shown on the band's right side.
export type NibbleUsage = {
  startedAt: number
  context?: number
  session?: { percent: number; resetsAt?: string }
  week?: { percent: number; resetsAt?: string }
}

export type NibbleFlash = { mood: NibbleMood; id: number }

declare module 'claude-code' {
  interface PluginState {
    nibble: { pet: NibblePet | null; flash: NibbleFlash | null; frame: number; usage: NibbleUsage | null }
  }
}
