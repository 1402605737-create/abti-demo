import type { ApiConfig, PromptMessage } from '@/types/demo'

type RequestOptions = {
  temperature: number
  signal?: AbortSignal
}

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}

export function buildChatCompletionUrl(baseUrl: string) {
  const normalized = trimTrailingSlash(baseUrl.trim())

  if (!normalized) {
    throw new Error('请先填写 Base URL')
  }

  if (/\/chat\/completions$/i.test(normalized)) {
    return normalized
  }

  return `${normalized}/chat/completions`
}

export function extractJsonString(content: string) {
  const fencedMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim()
  }
  return content.trim()
}

export function safeJsonParse<T>(content: string): T {
  const cleaned = extractJsonString(content)
  return JSON.parse(cleaned) as T
}

export async function requestStructuredJson<T>(
  config: ApiConfig,
  messages: PromptMessage[],
  options: RequestOptions,
) {
  if (!config.apiKey.trim()) {
    throw new Error('请先填写 API Key')
  }

  if (!config.model.trim()) {
    throw new Error('请先填写模型名')
  }

  const url = buildChatCompletionUrl(config.baseUrl)

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: config.model.trim(),
      messages,
      temperature: options.temperature,
      response_format: { type: 'json_object' },
    }),
    signal: options.signal,
  })

  const rawText = await response.text()

  if (!response.ok) {
    throw new Error(`接口请求失败（${response.status}）：${rawText.slice(0, 240)}`)
  }

  let payload: ChatCompletionResponse
  try {
    payload = JSON.parse(rawText) as ChatCompletionResponse
  } catch {
    throw new Error('接口返回的不是有效 JSON')
  }

  const content = payload.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('模型没有返回可解析的内容')
  }

  return {
    rawText: content,
    parsed: safeJsonParse<T>(content),
  }
}
