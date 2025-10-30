import { Hono } from 'hono'
import { Env } from '../../types'

// AI Chat API - supports multiple providers:
//  - cloudflare: Cloudflare Workers AI (FREE: 10k neurons/day)
//  - ollama: Self-hosted Ollama
//  - openai: OpenAI-compatible servers
//
// Endpoints:
//  - POST /api/ai/chat    -> AI chat completion
//  - GET  /api/ai/models  -> List available models

const app = new Hono<{ Bindings: Env }>()

function getProvider(env: Env): 'cloudflare' | 'ollama' | 'openai' {
  return (env.AI_PROVIDER as any) || 'cloudflare'
}

function getBaseUrl(env: Env): string {
  return env.OLLAMA_BASE_URL || 'http://localhost:11434'
}

function getDefaultModel(env: Env): string {
  const provider = getProvider(env)
  if (provider === 'cloudflare') {
    return '@cf/meta/llama-3.1-8b-instruct'
  }
  return env.OLLAMA_MODEL || 'llama3:8b'
}

function getDefaultOptions(env: Env): Record<string, any> | undefined {
  const raw = (env as any).OLLAMA_DEFAULT_OPTIONS_JSON
  if (!raw) return undefined
  try {
    const parsed = JSON.parse(String(raw))
    if (parsed && typeof parsed === 'object') return parsed
  } catch {}
  return undefined
}

// Optional lightweight key check to avoid public abuse when exposed
function isAuthorized(req: Request, env: Env): boolean {
  const requiredKey = env.OLLAMA_PROXY_KEY
  if (!requiredKey) return true
  const provided = req.headers.get('x-api-key') || ''
  return provided === requiredKey
}

// GET /api/ai/models -> list available models
app.get('/models', async (c) => {
  try {
    if (!isAuthorized(c.req.raw, c.env)) {
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }

    const provider = getProvider(c.env)

    if (provider === 'cloudflare') {
      // Return Cloudflare Workers AI models
      return c.json({
        success: true,
        data: {
          available_models: [
            {
              id: '@cf/meta/llama-3.1-8b-instruct',
              name: 'Llama 3.1 8B Instruct',
              description: 'Meta\'s Llama 3.1 8B parameter model optimized for instruction following',
              provider: 'Cloudflare Workers AI',
              free_tier: true
            },
            {
              id: '@cf/google/gemma-7b-it',
              name: 'Gemma 7B IT',
              description: 'Google\'s Gemma 7B parameter instruction-tuned model',
              provider: 'Cloudflare Workers AI',
              free_tier: true
            }
          ],
          default_model: '@cf/meta/llama-3.1-8b-instruct',
          free_tier_limit: '10,000 Neurons/day',
          provider: 'cloudflare'
        }
      })
    } else if (provider === 'openai') {
      const baseUrl = getBaseUrl(c.env)
      const res = await fetch(`${baseUrl}/v1/models`, { method: 'GET' })
      const data = await res.json()
      return c.json({ success: true, data, provider: 'openai' })
    } else {
      const baseUrl = getBaseUrl(c.env)
      const res = await fetch(`${baseUrl}/api/tags`, { method: 'GET' })
      const data = await res.json()
      return c.json({ success: true, data, provider: 'ollama' })
    }
  } catch (e: any) {
    return c.json({ success: false, error: e?.message || 'Failed to list models' }, 500)
  }
})

// POST /api/ai/chat -> AI chat completion
// Body: { messages: [{role, content}], model?, stream? }
app.post('/chat', async (c) => {
  try {
    if (!isAuthorized(c.req.raw, c.env)) {
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }

    const body = await c.req.json()
    const messages = Array.isArray(body?.messages) ? body.messages : []
    const requestedModel = typeof body?.model === 'string' && body.model.length > 0 ? body.model : null
    const model = requestedModel || getDefaultModel(c.env)
    const stream = Boolean(body?.stream)
    const userOptions = body?.options && typeof body.options === 'object' ? body.options : undefined

    if (messages.length === 0) {
      return c.json({ success: false, error: 'messages is required' }, 400)
    }

    const provider = getProvider(c.env)

    // === Cloudflare Workers AI ===
    if (provider === 'cloudflare') {
      try {
        const aiResponse = await c.env.AI.run(model, {
          messages: messages,
          stream: stream,
          max_tokens: 2048,
          temperature: 0.7,
          top_p: 0.9
        })

        if (stream) {
          // Return streaming response
          return new Response(aiResponse as any, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive'
            }
          })
        }

        // Non-streaming response
        return c.json({
          success: true,
          data: {
            message: (aiResponse as any).response,
            model: model,
            provider: 'cloudflare',
            usage: {
              prompt_tokens: (aiResponse as any).usage?.prompt_tokens || 0,
              completion_tokens: (aiResponse as any).usage?.completion_tokens || 0,
              total_tokens: (aiResponse as any).usage?.total_tokens || 0
            }
          }
        })
      } catch (aiError: any) {
        console.error('❌ Cloudflare AI Error:', aiError)
        return c.json({
          success: false,
          error: aiError.message || 'Cloudflare AI request failed',
          details: aiError.toString()
        }, 500)
      }
    }

    // === OpenAI-compatible servers ===
    if (provider === 'openai') {
      const mergedOptions: Record<string, any> = { ...(getDefaultOptions(c.env) || {}) }
      if (userOptions) Object.assign(mergedOptions, userOptions)

      const payload = {
        model,
        messages,
        stream,
        temperature: mergedOptions.temperature,
        max_tokens: mergedOptions.num_predict,
      }
      const baseUrl = getBaseUrl(c.env)
      const res = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      return c.json({ success: res.ok, data, provider: 'openai' }, res.ok ? 200 : 500)
    }

    // === Ollama ===
    const mergedOptions: Record<string, any> = { ...(getDefaultOptions(c.env) || {}) }
    if (userOptions) Object.assign(mergedOptions, userOptions)

    const preset = c.req.header('x-ai-preset') || ''
    if (preset) {
      // Presets to help low-VRAM GPUs
      if (preset === 'gpu') {
        mergedOptions.num_gpu = mergedOptions.num_gpu ?? 1
        mergedOptions.num_ctx = mergedOptions.num_ctx ?? 2048
      } else if (preset === 'gpu-aggressive') {
        mergedOptions.num_gpu = 1
        mergedOptions.num_ctx = mergedOptions.num_ctx ?? 2048
        mergedOptions.temperature = mergedOptions.temperature ?? 0.2
      } else if (preset === 'cpu-safe') {
        mergedOptions.num_gpu = 0
        mergedOptions.num_ctx = mergedOptions.num_ctx ?? 2048
      }
    }

    const payload: any = { model, messages, stream }
    if (Object.keys(mergedOptions).length > 0) payload.options = mergedOptions

    const baseUrl = getBaseUrl(c.env)
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (stream) {
      return new Response(res.body, {
        headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/x-ndjson' },
        status: res.status
      })
    }

    const data = await res.json()
    return c.json({ success: true, data, provider: 'ollama' }, res.ok ? 200 : 500)
  } catch (e: any) {
    return c.json({ success: false, error: e?.message || 'AI request failed' }, 500)
  }
})

export default app


