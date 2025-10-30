import { Hono } from 'hono';
import { Env } from '../../types';

const app = new Hono<{ Bindings: Env }>();

/**
 * AI Chat endpoint using Cloudflare Workers AI
 * POST /api/ai/chat
 *
 * Request body:
 * {
 *   "messages": [
 *     { "role": "system", "content": "You are a helpful assistant" },
 *     { "role": "user", "content": "Hello" }
 *   ]
 * }
 */
app.post('/chat', async (c) => {
  try {
    const { messages } = await c.req.json();

    if (!messages || !Array.isArray(messages)) {
      return c.json({
        success: false,
        error: 'Invalid request: messages array is required'
      }, 400);
    }

    // Use Cloudflare Workers AI with Llama 3.1 8B Instruct
    const response = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: messages,
      stream: false, // Start with non-streaming for simplicity
      max_tokens: 2048,
      temperature: 0.7,
      top_p: 0.9
    });

    return c.json({
      success: true,
      data: {
        message: response.response,
        model: '@cf/meta/llama-3.1-8b-instruct',
        usage: {
          prompt_tokens: response.usage?.prompt_tokens || 0,
          completion_tokens: response.usage?.completion_tokens || 0,
          total_tokens: response.usage?.total_tokens || 0
        }
      }
    });
  } catch (error: any) {
    console.error('❌ AI Chat Error:', error);
    return c.json({
      success: false,
      error: error.message || 'Internal server error',
      details: error.toString()
    }, 500);
  }
});

/**
 * AI Chat endpoint with streaming support
 * POST /api/ai/chat/stream
 */
app.post('/chat/stream', async (c) => {
  try {
    const { messages } = await c.req.json();

    if (!messages || !Array.isArray(messages)) {
      return c.json({
        success: false,
        error: 'Invalid request: messages array is required'
      }, 400);
    }

    // Use Cloudflare Workers AI with streaming
    const stream = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: messages,
      stream: true,
      max_tokens: 2048,
      temperature: 0.7,
      top_p: 0.9
    });

    // Return the stream directly
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (error: any) {
    console.error('❌ AI Chat Stream Error:', error);
    return c.json({
      success: false,
      error: error.message || 'Internal server error',
      details: error.toString()
    }, 500);
  }
});

/**
 * Get available AI models
 * GET /api/ai/models
 */
app.get('/models', async (c) => {
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
      free_tier_limit: '10,000 Neurons/day'
    }
  });
});

export default app;
