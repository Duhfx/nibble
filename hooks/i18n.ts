import type { NibbleLang, NibbleMood, NibbleStage } from '../types'

type Strings = {
  phrases: Record<NibbleMood, string>
  eggCalm: string
  eggCracking: string
  stage: Record<NibbleStage, string>
  arrival: Record<NibbleStage, string>
  star: string
  level: string
  contextFull: string
  limitNear: string
  context: string
  session: string
  week: string
  joy: string
  food: string
  energy: string
  started: string
  days: string[]
  runsOut: string
}

export const STRINGS: Record<NibbleLang, Strings> = {
  'pt-BR': {
    phrases: {
      ok: 'de boa, olhando seu código',
      happy: 'testes verdes! que dia lindo ✨',
      eating: 'nhom nhom… que diff gostoso',
      hungry: 'com fome… bora editar algo?',
      sad: 'meio tristinho… um carinho?',
      worried: 'eita, deu erro ali…',
      sleep: 'zzz…',
    },
    eggCalm: 'algo se mexe aqui dentro…',
    eggCracking: 'crec… crec…',
    stage: { egg: 'ovo', baby: 'bebê', adult: 'adulto', master: 'mestre', legend: 'lenda' },
    arrival: { egg: '', baby: '🐣 {n} nasceu!', adult: '✨ {n} evoluiu!', master: '👑 {n} virou mestre!', legend: '🌟 {n} virou uma lenda!' },
    star: '★ {n} ganhou a estrela nº {k}!',
    level: 'nv',
    contextFull: 'cabeça cheia… /compact?',
    limitNear: 'cansadinho… o limite tá acabando',
    context: 'contexto',
    session: 'limite 5h',
    week: 'limite semanal',
    joy: '♥ humor',
    food: '🍗 comida',
    energy: '⚡ energia',
    started: 'início',
    runsOut: '⚠ {t}',
    days: ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'],
  },
  en: {
    phrases: {
      ok: 'chilling, watching your code',
      happy: 'tests are green! what a day ✨',
      eating: 'nom nom… tasty diff',
      hungry: 'hungry… edit something?',
      sad: 'feeling down… a pat maybe?',
      worried: 'uh oh, something failed…',
      sleep: 'zzz…',
    },
    eggCalm: 'something stirs inside…',
    eggCracking: 'crack… crack…',
    stage: { egg: 'egg', baby: 'baby', adult: 'adult', master: 'master', legend: 'legend' },
    arrival: { egg: '', baby: '🐣 {n} hatched!', adult: '✨ {n} evolved!', master: '👑 {n} became a master!', legend: '🌟 {n} became a legend!' },
    star: '★ {n} earned star #{k}!',
    level: 'lv',
    contextFull: 'my head is full… /compact?',
    limitNear: 'getting tired… limit almost reached',
    context: 'context',
    session: '5h limit',
    week: 'weekly limit',
    joy: '♥ mood',
    food: '🍗 food',
    energy: '⚡ energy',
    started: 'started',
    runsOut: '⚠ {t}',
    days: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
  },
}
