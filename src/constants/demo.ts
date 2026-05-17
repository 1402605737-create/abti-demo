import type { ApiConfig, Season, TimeOfDay } from '@/types/demo'

export const GENRE_OPTIONS = [
  '悬疑',
  '治愈',
  '爱情',
  '科幻',
  '成长',
  '犯罪',
  '文艺',
  '公路',
  '动画',
  '黑色幽默',
  '都市',
  '纪录片',
] as const

export const EMOJI_OPTIONS = ['🌃', '🌧️', '🛰️', '🎞️', '💔', '🌙', '🚇', '🧊', '🌊', '✨'] as const

export const TIME_OPTIONS: TimeOfDay[] = ['清晨', '午后', '傍晚', '深夜']

export const SEASON_OPTIONS: Season[] = ['春天', '夏天', '秋天', '冬天']

export const DEFAULT_API_CONFIG: ApiConfig = {
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4.1-mini',
  temperatureParse: 0.5,
  temperaturePersona: 1.0,
  temperatureBSide: 1.1,
}

export const STORAGE_KEYS = {
  config: 'b-side-demo-config',
  selections: 'b-side-demo-selections',
  result: 'b-side-demo-result',
} as const

export const EXAMPLE_SELECTIONS = {
  selections: ['🌃', '悬疑', '治愈', '都市', '🎞️'],
  timeOfDay: '深夜' as TimeOfDay,
  season: '夏天' as Season,
}
