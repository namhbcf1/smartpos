import { useEffect, useState } from 'react'

export function Products() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      setLoading(true)
      try {
        const res = await fetch('https://pos-backend-bangachieu2.bangachieu2.workers.dev/api/v1/products', {
          headers: { 'Authorization': `Bearer ${(window as any).jwt || ''}` },
          signal: controller.signal
        })
        if (!res.ok) throw new Error('Load failed')
        const data = await res.json()
        setItems(data.data || [])
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => controller.abort()
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl mb-4">Sản phẩm</h1>
      {loading ? 'Đang tải...' : (
        <div className="space-y-2">
          {items.map((p: any) => (
            <div key={p.id} className="bg-gray-800 p-3 rounded">
              <div className="font-medium">{p.name}</div>
              <div className="text-sm text-gray-400">SKU: {p.sku}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


