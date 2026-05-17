import { describe, expect, it } from 'vitest'

import { buildChatCompletionUrl, extractJsonString, safeJsonParse } from '@/utils/modelApi'

describe('modelApi helpers', () => {
  it('补全 chat completions 路径', () => {
    expect(buildChatCompletionUrl('https://api.openai.com/v1')).toBe(
      'https://api.openai.com/v1/chat/completions',
    )
  })

  it('保留已经是 completions 的地址', () => {
    expect(buildChatCompletionUrl('https://example.com/v1/chat/completions')).toBe(
      'https://example.com/v1/chat/completions',
    )
  })

  it('解析 markdown code fence 中的 JSON', () => {
    const raw = '```json\n{"foo":"bar"}\n```'
    expect(extractJsonString(raw)).toBe('{"foo":"bar"}')
    expect(safeJsonParse<{ foo: string }>(raw)).toEqual({ foo: 'bar' })
  })
})
