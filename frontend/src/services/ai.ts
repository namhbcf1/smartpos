export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export async function aiChat(messages: ChatMessage[], options?: { model?: string; stream?: boolean; signal?: AbortSignal; apiKey?: string }) {
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(options?.apiKey ? { 'x-api-key': options.apiKey } : {})
    },
    body: JSON.stringify({ messages, model: options?.model, stream: options?.stream })
  })

  if (!res.ok) {
    let error = 'Request failed'
    try {
      const data = await res.json()
      error = data?.error || error
    } catch {}
    throw new Error(error)
  }

  // Non-stream for simplicity
  const data = await res.json()
  return data
}


