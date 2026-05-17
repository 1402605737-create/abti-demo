import { create } from 'zustand'

import { DEFAULT_API_CONFIG } from '@/constants/demo'
import type {
  ApiConfig,
  BSideResult,
  DemoRunResult,
  DemoStatus,
  ParseResult,
  PersonaResult,
  Season,
  StepLog,
  TimeOfDay,
} from '@/types/demo'

type DemoStore = {
  selections: string[]
  timeOfDay: TimeOfDay
  season: Season
  apiConfig: ApiConfig
  result: DemoRunResult
  status: DemoStatus
  activeStep: string | null
  errorMessage: string | null
  requestStartedAt: number | null
  requestDurationMs: number | null
  stepLogs: StepLog[]
  showApiKey: boolean
  setSelections: (selections: string[]) => void
  setTimeOfDay: (timeOfDay: TimeOfDay) => void
  setSeason: (season: Season) => void
  updateApiConfig: (patch: Partial<ApiConfig>) => void
  hydrate: (payload: Partial<Pick<DemoStore, 'selections' | 'timeOfDay' | 'season' | 'apiConfig' | 'result'>>) => void
  setStatus: (status: DemoStatus) => void
  setActiveStep: (step: string | null) => void
  setErrorMessage: (message: string | null) => void
  setRequestStartedAt: (value: number | null) => void
  setRequestDurationMs: (value: number | null) => void
  setShowApiKey: (show: boolean) => void
  setStepLogs: (logs: StepLog[]) => void
  updateResult: (patch: Partial<DemoRunResult>) => void
  setParseResult: (parseResult: ParseResult, rawText: string) => void
  setPersonaResult: (personaResult: PersonaResult, rawText: string) => void
  setBSideResult: (bSideResult: BSideResult, rawText: string) => void
  resetRuntime: () => void
  hardReset: () => void
}

const emptyResult: DemoRunResult = {
  parseResult: null,
  personaResult: null,
  bSideResult: null,
  rawResponses: {
    parse: null,
    persona: null,
    bSide: null,
  },
}

export const useDemoStore = create<DemoStore>((set) => ({
  selections: ['🌃', '悬疑', '治愈'],
  timeOfDay: '深夜',
  season: '夏天',
  apiConfig: DEFAULT_API_CONFIG,
  result: emptyResult,
  status: 'idle',
  activeStep: null,
  errorMessage: null,
  requestStartedAt: null,
  requestDurationMs: null,
  stepLogs: [],
  showApiKey: false,
  setSelections: (selections) => set({ selections }),
  setTimeOfDay: (timeOfDay) => set({ timeOfDay }),
  setSeason: (season) => set({ season }),
  updateApiConfig: (patch) =>
    set((state) => ({
      apiConfig: {
        ...state.apiConfig,
        ...patch,
      },
    })),
  hydrate: (payload) =>
    set((state) => ({
      selections: payload.selections ?? state.selections,
      timeOfDay: payload.timeOfDay ?? state.timeOfDay,
      season: payload.season ?? state.season,
      apiConfig: payload.apiConfig ?? state.apiConfig,
      result: payload.result ?? state.result,
    })),
  setStatus: (status) => set({ status }),
  setActiveStep: (activeStep) => set({ activeStep }),
  setErrorMessage: (errorMessage) => set({ errorMessage }),
  setRequestStartedAt: (requestStartedAt) => set({ requestStartedAt }),
  setRequestDurationMs: (requestDurationMs) => set({ requestDurationMs }),
  setShowApiKey: (showApiKey) => set({ showApiKey }),
  setStepLogs: (stepLogs) => set({ stepLogs }),
  updateResult: (patch) =>
    set((state) => ({
      result: {
        ...state.result,
        ...patch,
      },
    })),
  setParseResult: (parseResult, rawText) =>
    set((state) => ({
      result: {
        ...state.result,
        parseResult,
        rawResponses: {
          ...state.result.rawResponses,
          parse: rawText,
        },
      },
    })),
  setPersonaResult: (personaResult, rawText) =>
    set((state) => ({
      result: {
        ...state.result,
        personaResult,
        rawResponses: {
          ...state.result.rawResponses,
          persona: rawText,
        },
      },
    })),
  setBSideResult: (bSideResult, rawText) =>
    set((state) => ({
      result: {
        ...state.result,
        bSideResult,
        rawResponses: {
          ...state.result.rawResponses,
          bSide: rawText,
        },
      },
    })),
  resetRuntime: () =>
    set((state) => ({
      status: 'idle',
      activeStep: null,
      errorMessage: null,
      requestStartedAt: null,
      requestDurationMs: null,
      stepLogs: state.stepLogs.map((item) => ({
        ...item,
        status: 'pending',
        durationMs: null,
      })),
    })),
  hardReset: () =>
    set({
      selections: ['🌃', '悬疑', '治愈'],
      timeOfDay: '深夜',
      season: '夏天',
      apiConfig: DEFAULT_API_CONFIG,
      result: emptyResult,
      status: 'idle',
      activeStep: null,
      errorMessage: null,
      requestStartedAt: null,
      requestDurationMs: null,
      stepLogs: [],
      showApiKey: false,
    }),
}))
