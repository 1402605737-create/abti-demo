import { describe, expect, it } from 'vitest'

import { buildBackendUrl } from '@/utils/modelApi'

describe('modelApi helpers', () => {
  it('在未配置服务端域名时使用相对路径', () => {
    expect(buildBackendUrl('/api/generate')).toBe('/api/generate')
  })

  it('在配置服务端域名时拼接完整地址', () => {
    expect(buildBackendUrl('/api/health', 'https://api.example.com/')).toBe(
      'https://api.example.com/api/health',
    )
  })
})
