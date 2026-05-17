import { LoaderCircle, RefreshCcw, Sparkles, Wand2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { ChipField } from '@/components/ChipField'
import { ResultSection } from '@/components/ResultSection'
import {
  DEFAULT_GENERATION_CONFIG,
  EMOJI_OPTIONS,
  EXAMPLE_SELECTIONS,
  GENRE_OPTIONS,
  SEASON_OPTIONS,
  STORAGE_KEYS,
  TIME_OPTIONS,
} from '@/constants/demo'
import { useDemoStore } from '@/store/useDemoStore'
import type {
  BSideResult,
  DemoRunResult,
  GenerationMode,
  GenerationConfig,
  ParseResult,
  PersonaResult,
  RunStep,
  Season,
  ServiceHealth,
  StepLog,
  TimeOfDay,
  UserSelectionsPayload,
} from '@/types/demo'
import { buildBackendUrl, fetchServiceHealth, requestStructuredJson } from '@/utils/modelApi'

const defaultLogs: StepLog[] = [
  { step: 'parse', status: 'pending', durationMs: null, message: '等待开始' },
  { step: 'persona', status: 'pending', durationMs: null, message: '等待开始' },
  { step: 'b-side', status: 'pending', durationMs: null, message: '等待开始' },
]

function readStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function writeStorage<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
}

function getStepLabel(step: RunStep) {
  if (step === 'parse') return '输入解析'
  if (step === 'persona') return 'A 面人格'
  return 'B 面推荐'
}

function hasParseShape(value: ParseResult) {
  return Boolean(
    value &&
      Array.isArray(value.primary_genres) &&
      value.emotional_tone &&
      value.comfort_zone &&
      value.blind_spot_direction,
  )
}

function hasPersonaShape(value: PersonaResult) {
  return Boolean(
    value &&
      value.personality_name &&
      Array.isArray(value.keywords) &&
      Array.isArray(value.genre_distribution) &&
      value.hidden_trait,
  )
}

function hasBSideShape(value: BSideResult) {
  return Boolean(
    value &&
      value.bridge_line &&
      value.song?.name &&
      value.song?.artist &&
      value.why_b_side &&
      value.one_line_lyric,
  )
}

type ServiceStatus = 'checking' | 'ready' | 'not-configured' | 'error'

export default function Home() {
  const [toast, setToast] = useState<string | null>(null)
  const [serviceHealth, setServiceHealth] = useState<ServiceHealth | null>(null)
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>('checking')
  const {
    selections,
    timeOfDay,
    season,
    generationConfig,
    result,
    status,
    activeStep,
    errorMessage,
    requestDurationMs,
    stepLogs,
    setSelections,
    setTimeOfDay,
    setSeason,
    updateGenerationConfig,
    hydrate,
    setStatus,
    setActiveStep,
    setErrorMessage,
    setRequestStartedAt,
    setRequestDurationMs,
    setStepLogs,
    setParseResult,
    setPersonaResult,
    setBSideResult,
    resetRuntime,
    hardReset,
  } = useDemoStore()

  useEffect(() => {
    const storedConfig = readStorage<GenerationConfig>(STORAGE_KEYS.config)
    const storedSelections = readStorage<UserSelectionsPayload>(STORAGE_KEYS.selections)
    const storedResult = readStorage<DemoRunResult>(STORAGE_KEYS.result)
    hydrate({
      generationConfig: storedConfig ?? DEFAULT_GENERATION_CONFIG,
      result: storedResult ?? result,
      selections: storedSelections?.selections ?? selections,
      timeOfDay: storedSelections?.timeOfDay ?? timeOfDay,
      season: storedSelections?.season ?? season,
    })
    setStepLogs(defaultLogs)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    writeStorage(STORAGE_KEYS.config, generationConfig)
  }, [generationConfig])

  useEffect(() => {
    writeStorage(STORAGE_KEYS.selections, { selections, timeOfDay, season })
  }, [selections, timeOfDay, season])

  useEffect(() => {
    writeStorage(STORAGE_KEYS.result, result)
  }, [result])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(null), 1800)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    const controller = new AbortController()

    const checkService = async () => {
      setServiceStatus('checking')

      try {
        const nextHealth = await fetchServiceHealth(controller.signal)
        setServiceHealth(nextHealth)
        setServiceStatus(nextHealth.configured ? 'ready' : 'not-configured')
      } catch {
        setServiceHealth(null)
        setServiceStatus('error')
      }
    }

    void checkService()
    return () => controller.abort()
  }, [])

  const connectionText = useMemo(() => {
    if (serviceStatus === 'checking') {
      return '正在检查服务端'
    }
    if (serviceStatus === 'not-configured') {
      return '服务端待配置'
    }
    if (serviceStatus === 'error') {
      return '服务端未连接'
    }
    if (status === 'error') {
      return '最近一次调用失败'
    }
    if (status === 'success') {
      return '服务端可继续调用'
    }
    return '服务端模型已就绪'
  }, [serviceStatus, status])

  const serviceBadge = useMemo(() => {
    if (serviceStatus === 'checking') return '检查中'
    if (serviceStatus === 'ready') return '已接管'
    if (serviceStatus === 'not-configured') return '待配置'
    return '异常'
  }, [serviceStatus])

  const serviceMeta = useMemo(() => {
    if (serviceStatus === 'checking') {
      return '正在检查后端服务与模型配置状态'
    }
    if (serviceStatus === 'error') {
      return '当前无法连接服务端，请检查 Node 服务、域名或反向代理'
    }
    if (serviceStatus === 'not-configured') {
      return '服务端已启动，但还没有配置 OPENAI_BASE_URL / OPENAI_API_KEY / OPENAI_MODEL'
    }
    return `当前模型：${serviceHealth?.modelName ?? '未返回'}`
  }, [serviceHealth?.modelName, serviceStatus])

  const toggleSelection = (value: string) => {
    setSelections(
      selections.includes(value)
        ? selections.filter((item) => item !== value)
        : [...selections, value],
    )
  }

  const updateLog = (step: RunStep, next: Partial<StepLog>) => {
    const base = stepLogs.length ? stepLogs : defaultLogs
    setStepLogs(base.map((item) => (item.step === step ? { ...item, ...next } : item)))
  }

  const copyContent = async (value: unknown) => {
    const content = JSON.stringify(value, null, 2)
    await navigator.clipboard.writeText(content)
    setToast('已复制到剪贴板')
  }

  const runFlow = async (mode: GenerationMode) => {
    if (!selections.length) {
      setStatus('error')
      setErrorMessage('请至少选择一个 emoji 或影视标签')
      return
    }

    resetRuntime()
    setStepLogs(defaultLogs)
    setStatus('running')
    setErrorMessage(null)
    setRequestStartedAt(performance.now())
    const flowStart = performance.now()

    try {
      let parseResult = result.parseResult
      let personaResult = result.personaResult

      if (mode === 'all' || mode === 'persona' || !result.parseResult) {
        const stepStart = performance.now()
        setActiveStep('parse')
        updateLog('parse', { status: 'running', message: '正在解析你的偏好' })
        const parseResponse = await requestStructuredJson<ParseResult>(
          'parse',
          { selections, timeOfDay, season },
          { temperature: generationConfig.temperatureParse },
        )
        if (!hasParseShape(parseResponse.parsed)) {
          throw new Error('输入解析结果缺少必要字段')
        }
        parseResult = parseResponse.parsed
        setParseResult(parseResponse.parsed, parseResponse.rawText)
        updateLog('parse', {
          status: 'success',
          durationMs: Math.round(performance.now() - stepStart),
          message: '已生成结构化偏好',
        })
      }

      if (!parseResult) {
        throw new Error('无法继续生成 A 面，因为输入解析结果不存在')
      }

      if (mode === 'all' || mode === 'persona' || !result.personaResult) {
        const stepStart = performance.now()
        setActiveStep('persona')
        updateLog('persona', { status: 'running', message: '正在生成你的 A 面人格' })
        const personaResponse = await requestStructuredJson<PersonaResult>(
          'persona',
          { selections, timeOfDay, season, parseResult },
          { temperature: generationConfig.temperaturePersona },
        )
        if (!hasPersonaShape(personaResponse.parsed)) {
          throw new Error('A 面结果缺少必要字段')
        }
        personaResult = personaResponse.parsed
        setPersonaResult(personaResponse.parsed, personaResponse.rawText)
        updateLog('persona', {
          status: 'success',
          durationMs: Math.round(performance.now() - stepStart),
          message: 'A 面结果已完成',
        })
      }

      if (mode === 'b-side' || mode === 'all') {
        if (!personaResult) {
          throw new Error('无法继续生成 B 面，因为 A 面结果不存在')
        }
        const stepStart = performance.now()
        setActiveStep('b-side')
        updateLog('b-side', { status: 'running', message: '正在寻找你的 B 面歌曲' })
        const bSideResponse = await requestStructuredJson<BSideResult>(
          'b-side',
          { parseResult, personaResult },
          { temperature: generationConfig.temperatureBSide },
        )
        if (!hasBSideShape(bSideResponse.parsed)) {
          throw new Error('B 面结果缺少必要字段')
        }
        setBSideResult(bSideResponse.parsed, bSideResponse.rawText)
        updateLog('b-side', {
          status: 'success',
          durationMs: Math.round(performance.now() - stepStart),
          message: 'B 面结果已完成',
        })
      }

      setStatus('success')
      setServiceStatus('ready')
      setActiveStep(null)
      setRequestDurationMs(Math.round(performance.now() - flowStart))
    } catch (error) {
      const message = error instanceof Error ? error.message : '生成失败，请稍后重试'
      if (/Failed to fetch|NetworkError|ERR_CONNECTION|服务端/.test(message)) {
        setServiceStatus('error')
      }
      if (activeStep === 'parse' || activeStep === 'persona' || activeStep === 'b-side') {
        updateLog(activeStep, { status: 'error', message })
      }
      setStatus('error')
      setErrorMessage(message)
      setActiveStep(null)
      setRequestDurationMs(Math.round(performance.now() - flowStart))
    }
  }

  const fillExample = () => {
    setSelections(EXAMPLE_SELECTIONS.selections)
    setTimeOfDay(EXAMPLE_SELECTIONS.timeOfDay)
    setSeason('夏天')
    setToast('已填入示例偏好')
  }

  const resetAll = () => {
    hardReset()
    localStorage.removeItem(STORAGE_KEYS.result)
    setToast('已重置 Demo 状态')
  }

  return (
    <main className="demo-shell">
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />
      <div className="grid-noise" />

      <header className="hero-card">
        <div>
          <p className="eyebrow">Your Hidden Track</p>
          <h1>你的B面</h1>
          <p className="hero-copy">
            由服务端安全调用真实模型，现场生成 A 面观影人格和 B 面歌曲推荐。
          </p>
        </div>
        <div className="hero-status">
          <span
            className={
              status === 'error' || serviceStatus === 'error' || serviceStatus === 'not-configured'
                ? 'status-dot error'
                : 'status-dot'
            }
          />
          <div>
            <strong>{connectionText}</strong>
            <p>链路：输入解析 → A 面人格 → B 面推荐</p>
          </div>
        </div>
      </header>

      <div className="workspace">
        <section className="left-column">
          <ChipField
            label="偏好标签"
            hint="可混搭 emoji 和类型标签，适合快速演示"
            options={[...EMOJI_OPTIONS, ...GENRE_OPTIONS]}
            values={selections}
            onToggle={toggleSelection}
          />

          <section className="panel-card split-panel">
            <div>
              <p className="eyebrow">时段</p>
              <div className="segmented-row">
                {TIME_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={timeOfDay === option ? 'segment active' : 'segment'}
                    onClick={() => setTimeOfDay(option as TimeOfDay)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="eyebrow">季节</p>
              <div className="segmented-row">
                {SEASON_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={season === option ? 'segment active' : 'segment'}
                    onClick={() => setSeason(option as Season)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="panel-card">
            <div className="section-head">
              <div>
                <p className="eyebrow">服务端模型配置</p>
                <p className="section-hint">正式版由后端统一保存 API Key 和 Prompt，前端只负责调用业务接口</p>
              </div>
              <span className="tiny-badge">{serviceBadge}</span>
            </div>
            <div className="service-grid">
              <div className="service-item">
                <span className="field-label">调用入口</span>
                <strong>{buildBackendUrl('/api/generate')}</strong>
                <p>本地开发默认通过 Vite 代理转发到 `localhost:3000`</p>
              </div>
              <div className="service-item">
                <span className="field-label">模型状态</span>
                <strong>{serviceHealth?.modelName ?? '待服务端配置'}</strong>
                <p>{serviceMeta}</p>
              </div>
              <div className="service-item">
                <span className="field-label">安全策略</span>
                <strong>API Key 仅保存在服务端</strong>
                <p>正式上线时请结合域名、CORS 和限流规则一起部署</p>
              </div>
            </div>

            <div className="temperature-grid">
              <label>
                <span>输入解析温度</span>
                <input
                  type="range"
                  min="0"
                  max="1.2"
                  step="0.1"
                  value={generationConfig.temperatureParse}
                  onChange={(event) => updateGenerationConfig({ temperatureParse: Number(event.target.value) })}
                />
                <strong>{generationConfig.temperatureParse.toFixed(1)}</strong>
              </label>
              <label>
                <span>A 面温度</span>
                <input
                  type="range"
                  min="0.4"
                  max="1.4"
                  step="0.1"
                  value={generationConfig.temperaturePersona}
                  onChange={(event) => updateGenerationConfig({ temperaturePersona: Number(event.target.value) })}
                />
                <strong>{generationConfig.temperaturePersona.toFixed(1)}</strong>
              </label>
              <label>
                <span>B 面温度</span>
                <input
                  type="range"
                  min="0.4"
                  max="1.5"
                  step="0.1"
                  value={generationConfig.temperatureBSide}
                  onChange={(event) => updateGenerationConfig({ temperatureBSide: Number(event.target.value) })}
                />
                <strong>{generationConfig.temperatureBSide.toFixed(1)}</strong>
              </label>
            </div>
          </section>

          <section className="panel-card">
            <div className="section-head">
              <div>
                <p className="eyebrow">操作面板</p>
                <p className="section-hint">支持整链路生成，也可以单独调试某一步</p>
              </div>
            </div>
            <div className="action-row">
              <button type="button" className="primary-action" onClick={() => void runFlow('all')} disabled={status === 'running'}>
                {status === 'running' ? <LoaderCircle className="spin" size={16} /> : <Sparkles size={16} />}
                生成整套结果
              </button>
              <button type="button" className="secondary-action" onClick={() => void runFlow('persona')} disabled={status === 'running'}>
                <Wand2 size={16} />
                只生成 A 面
              </button>
              <button type="button" className="secondary-action" onClick={() => void runFlow('b-side')} disabled={status === 'running'}>
                <Sparkles size={16} />
                只生成 B 面
              </button>
              <button type="button" className="ghost-action" onClick={fillExample} disabled={status === 'running'}>
                填充示例
              </button>
              <button type="button" className="ghost-action" onClick={resetAll} disabled={status === 'running'}>
                <RefreshCcw size={16} />
                重置
              </button>
            </div>
          </section>
        </section>

        <section className="right-column">
          <section className="hero-result-card">
            <div>
              <p className="eyebrow">A 面人格</p>
              <h2>{result.personaResult?.personality_name ?? '等待你的另一面出现'}</h2>
              <p>{result.personaResult?.description ?? '服务端模型就绪后，再点击生成整套结果。'}</p>
            </div>
            <div className="summary-metrics">
              <div>
                <span>当前步骤</span>
                <strong>{activeStep ? getStepLabel(activeStep as RunStep) : '待命中'}</strong>
              </div>
              <div>
                <span>耗时</span>
                <strong>{requestDurationMs ? `${requestDurationMs} ms` : '--'}</strong>
              </div>
            </div>
          </section>

          {result.personaResult ? (
            <section className="panel-card persona-glance">
              <div className="keyword-row">
                {result.personaResult.keywords.map((keyword) => (
                  <span key={keyword} className="keyword-pill">
                    {keyword}
                  </span>
                ))}
              </div>
              <div className="distribution-list">
                {result.personaResult.genre_distribution.map((item) => (
                  <div key={item.genre} className="distribution-item">
                    <span>{item.genre}</span>
                    <div className="distribution-bar">
                      <i style={{ width: `${item.weight * 100}%` }} />
                    </div>
                    <strong>{Math.round(item.weight * 100)}%</strong>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {result.bSideResult ? (
            <section className="panel-card song-card">
              <p className="eyebrow">B 面钥匙</p>
              <h3>
                {result.bSideResult.song.cover_emoji} {result.bSideResult.song.name}
              </h3>
              <p className="song-meta">
                {result.bSideResult.song.artist} · {result.bSideResult.song.genre} · {result.bSideResult.song.year}
              </p>
              <blockquote>{result.bSideResult.one_line_lyric}</blockquote>
            </section>
          ) : null}

          <ResultSection
            title="输入解析"
            subtitle="用于后续三段式链路的结构化偏好"
            value={result.parseResult}
            rawText={result.rawResponses.parse}
            onCopy={result.parseResult ? () => void copyContent(result.parseResult) : undefined}
          />
          <ResultSection
            title="A 面结果"
            subtitle="观影人格 JSON"
            value={result.personaResult}
            rawText={result.rawResponses.persona}
            onCopy={result.personaResult ? () => void copyContent(result.personaResult) : undefined}
          />
          <ResultSection
            title="B 面结果"
            subtitle="歌单盲区推荐 JSON"
            value={result.bSideResult}
            rawText={result.rawResponses.bSide}
            onCopy={result.bSideResult ? () => void copyContent(result.bSideResult) : undefined}
          />

          <section className="panel-card">
            <div className="section-head">
              <div>
                <p className="eyebrow">调试状态</p>
                <p className="section-hint">每一步调用都会记录耗时与当前状态</p>
              </div>
            </div>
            <div className="log-list">
              {(stepLogs.length ? stepLogs : defaultLogs).map((item) => (
                <div key={item.step} className={`log-item ${item.status}`}>
                  <div>
                    <strong>{getStepLabel(item.step)}</strong>
                    <p>{item.message}</p>
                  </div>
                  <span>{item.durationMs ? `${item.durationMs} ms` : item.status}</span>
                </div>
              ))}
            </div>
            {errorMessage ? <p className="error-banner">{errorMessage}</p> : null}
          </section>
        </section>
      </div>

      <footer className="footer-note">
        <p>提示：正式版通过服务端代理调用模型，生产 API Key 应只保存在腾讯云服务端环境变量中。</p>
      </footer>

      {toast ? <div className="toast">{toast}</div> : null}
    </main>
  )
}
