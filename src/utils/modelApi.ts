import type { RunStep, ServiceHealth } from '@/types/demo'

type RequestOptions = {
  temperature: number
  signal?: AbortSignal
}

type StructuredJsonResponse<T> = {
  rawText: string
  parsed: T
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}

export function buildBackendUrl(path: string, apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '') {
  if (!path.startsWith('/')) {
    throw new Error('接口路径必须以 / 开头')
  }

  const normalized = trimTrailingSlash(apiBaseUrl.trim())
  return normalized ? `${normalized}${path}` : path
}

export async function fetchServiceHealth(signal?: AbortSignal) {
  const response = await fetch(buildBackendUrl('/api/health'), { signal })

  if (!response.ok) {
    throw new Error(`服务端健康检查失败（${response.status}）`)
  }

  return (await response.json()) as ServiceHealth
}

export async function requestStructuredJson<T>(
  step: RunStep,
  payload: Record<string, unknown>,
  options: RequestOptions,
) {
  const response = await fetch(buildBackendUrl('/api/generate'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      step,
      ...payload,
      temperature: options.temperature,
    }),
    signal: options.signal,
  })

  const rawText = await response.text()

  if (!response.ok) {
    throw new Error(`接口请求失败（${response.status}）：${rawText.slice(0, 240)}`)
  }

  let data: StructuredJsonResponse<T>
  try {
    data = JSON.parse(rawText) as StructuredJsonResponse<T>
  } catch {
    throw new Error('接口返回的不是有效 JSON')
  }

  if (!data.rawText) {
    throw new Error('服务端没有返回原始结果')
  }

  return data
}
