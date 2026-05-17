export type TimeOfDay = '清晨' | '午后' | '傍晚' | '深夜'

export type Season = '春天' | '夏天' | '秋天' | '冬天'

export type GenerationMode = 'all' | 'persona' | 'b-side'

export type RunStep = 'parse' | 'persona' | 'b-side'

export type PromptMessage = {
  role: 'system' | 'user'
  content: string
}

export type GenerationConfig = {
  temperatureParse: number
  temperaturePersona: number
  temperatureBSide: number
}

export type UserSelectionsPayload = {
  selections: string[]
  timeOfDay: TimeOfDay
  season: Season
}

export type ServiceHealth = {
  ok: boolean
  configured: boolean
  modelName: string | null
}

export type ParseResult = {
  primary_genres: string[]
  emotional_tone: string
  comfort_zone: string
  blind_spot_direction: string
}

export type GenreDistributionItem = {
  genre: string
  weight: number
}

export type PersonaResult = {
  personality_name: string
  keywords: string[]
  description: string
  watch_pattern: string
  genre_distribution: GenreDistributionItem[]
  signature_scene: string
  hidden_trait: string
}

export type SongInfo = {
  name: string
  artist: string
  genre: string
  year: number
  cover_emoji: string
}

export type BSideResult = {
  bridge_line: string
  song: SongInfo
  why_b_side: string
  connection: string
  listen_moment: string
  one_line_lyric: string
}

export type RawResponses = {
  parse: string | null
  persona: string | null
  bSide: string | null
}

export type DemoRunResult = {
  parseResult: ParseResult | null
  personaResult: PersonaResult | null
  bSideResult: BSideResult | null
  rawResponses: RawResponses
}

export type DemoStatus = 'idle' | 'running' | 'success' | 'error'

export type StepLog = {
  step: RunStep
  status: 'pending' | 'running' | 'success' | 'error'
  durationMs: number | null
  message: string
}
