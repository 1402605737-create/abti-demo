import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import { rateLimit } from 'express-rate-limit'

import { buildBSidePrompt, buildParsePrompt, buildPersonaPrompt } from './prompts.mjs'

dotenv.config()

const app = express()
const port = Number(process.env.PORT ?? 3000)
const currentFile = fileURLToPath(import.meta.url)
const currentDir = path.dirname(currentFile)
const distDir = path.resolve(currentDir, '../dist')
const distIndexFile = path.join(distDir, 'index.html')
const hasBuiltFrontend = fs.existsSync(distIndexFile)
const allowedOrigins = (process.env.CORS_ORIGIN ?? '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)

app.set('trust proxy', 1)
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true)
        return
      }

      callback(new Error('当前来源未被服务端允许访问'))
    },
  }),
)
app.use(express.json({ limit: '1mb' }))
app.use(
  '/api',
  rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000),
    max: Number(process.env.RATE_LIMIT_MAX ?? 30),
    standardHeaders: true,
    legacyHeaders: false,
  }),
)

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, '')
}

function buildChatCompletionUrl(baseUrl) {
  const normalized = trimTrailingSlash(baseUrl.trim())

  if (!normalized) {
    throw new Error('服务端缺少 OPENAI_BASE_URL 配置')
  }

  if (/\/chat\/completions$/i.test(normalized)) {
    return normalized
  }

  return `${normalized}/chat/completions`
}

function extractJsonString(content) {
  const fencedMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim()
  }
  return content.trim()
}

function safeJsonParse(content) {
  const cleaned = extractJsonString(content)
  return JSON.parse(cleaned)
}

function getModelConfig() {
  return {
    baseUrl: process.env.OPENAI_BASE_URL?.trim() ?? '',
    apiKey: process.env.OPENAI_API_KEY?.trim() ?? '',
    model: process.env.OPENAI_MODEL?.trim() ?? '',
  }
}

function isUserSelectionsPayload(value) {
  return Boolean(
    value &&
      Array.isArray(value.selections) &&
      typeof value.timeOfDay === 'string' &&
      typeof value.season === 'string',
  )
}

function isParseResult(value) {
  return Boolean(
    value &&
      Array.isArray(value.primary_genres) &&
      typeof value.emotional_tone === 'string' &&
      typeof value.comfort_zone === 'string' &&
      typeof value.blind_spot_direction === 'string',
  )
}

function isPersonaResult(value) {
  return Boolean(
    value &&
      typeof value.personality_name === 'string' &&
      Array.isArray(value.keywords) &&
      Array.isArray(value.genre_distribution) &&
      typeof value.hidden_trait === 'string' &&
      typeof value.description === 'string',
  )
}

function buildMessages(step, body) {
  if (step === 'parse') {
    if (!isUserSelectionsPayload(body) || body.selections.length === 0) {
      throw new Error('parse 步骤缺少有效的用户偏好输入')
    }
    return buildParsePrompt(body)
  }

  if (step === 'persona') {
    if (!isUserSelectionsPayload(body) || !isParseResult(body.parseResult)) {
      throw new Error('persona 步骤缺少输入解析结果')
    }
    return buildPersonaPrompt(body, body.parseResult)
  }

  if (step === 'b-side') {
    if (!isParseResult(body.parseResult) || !isPersonaResult(body.personaResult)) {
      throw new Error('b-side 步骤缺少 A 面或输入解析结果')
    }
    return buildBSidePrompt(body.parseResult, body.personaResult)
  }

  throw new Error('不支持的生成步骤')
}

async function requestStructuredJson(step, body) {
  const config = getModelConfig()
  if (!config.apiKey || !config.baseUrl || !config.model) {
    throw new Error('服务端尚未配置 OPENAI_BASE_URL / OPENAI_API_KEY / OPENAI_MODEL')
  }

  const messages = buildMessages(step, body)
  const response = await fetch(buildChatCompletionUrl(config.baseUrl), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: typeof body.temperature === 'number' ? body.temperature : 1,
      response_format: { type: 'json_object' },
    }),
  })

  const rawResponse = await response.text()
  if (!response.ok) {
    throw new Error(`模型接口请求失败（${response.status}）：${rawResponse.slice(0, 240)}`)
  }

  let payload
  try {
    payload = JSON.parse(rawResponse)
  } catch {
    throw new Error('模型接口返回的不是有效 JSON')
  }

  const content = payload.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('模型没有返回可解析内容')
  }

  return {
    rawText: content,
    parsed: safeJsonParse(content),
  }
}

app.get('/api/health', (_req, res) => {
  const config = getModelConfig()
  res.json({
    ok: true,
    configured: Boolean(config.apiKey && config.baseUrl && config.model),
    modelName: config.model || null,
  })
})

app.post('/api/generate', async (req, res) => {
  try {
    const { step } = req.body ?? {}
    if (step !== 'parse' && step !== 'persona' && step !== 'b-side') {
      res.status(400).json({ error: 'step 必须是 parse、persona 或 b-side' })
      return
    }

    const result = await requestStructuredJson(step, req.body)
    res.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : '服务端生成失败'
    const statusCode =
      /尚未配置|缺少|不支持/.test(message) ? 400 :
      /来源/.test(message) ? 403 :
      /模型接口请求失败/.test(message) ? 502 :
      500
    res.status(statusCode).json({ error: message })
  }
})

if (hasBuiltFrontend) {
  app.use(express.static(distDir))

  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile(distIndexFile)
  })
}

app.listen(port, () => {
  console.log(`ABTI app listening on http://localhost:${port}`)
})
