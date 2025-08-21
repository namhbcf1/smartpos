import { useEffect, useRef, useState } from 'react'

export function Sales() {
  const [events, setEvents] = useState<string[]>([])
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const url = 'wss://pos-backend-bangachieu2.bangachieu2.workers.dev/ws/inventory/main'
    const ws = new WebSocket(url)
    wsRef.current = ws
    ws.onmessage = (ev) => setEvents((prev) => [ev.data, ...prev].slice(0, 20))
    return () => ws.close()
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl mb-4">Bán hàng (Realtime)</h1>
      <div className="space-y-2">
        {events.map((e, i) => (
          <div key={i} className="bg-gray-800 p-2 rounded text-sm">{e}</div>
        ))}
      </div>
    </div>
  )
}


