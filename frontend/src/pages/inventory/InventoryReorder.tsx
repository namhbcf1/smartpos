import { useEffect, useMemo, useRef, useState } from 'react'
import { posApi } from '../../services/api/posApi'
import { RealtimeClient } from '../../services/realtime/realtimeClient'

type Suggestion = {
  id: string
  product_id: string
  product_name?: string
  sku?: string
  current_stock?: number
  min_stock?: number
  suggested_quantity?: number
  urgency_level?: string
  supplier_id?: string
  supplier_name?: string
  estimated_cost?: number
  created_at?: string
}

export default function InventoryReorder() {
  const [rows, setRows] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [urgency, setUrgency] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [total, setTotal] = useState(0)
  const [selected, setSelected] = useState<string[]>([])
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting'|'connected'|'sse'|'disconnected'|'reconnecting'>('connecting')
  const wsUrl = import.meta.env.VITE_CLOUDFLARE_WS_URL as string | undefined
  const clientRef = useRef<RealtimeClient | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await posApi.getReorderSuggestions(urgency || undefined)
      if (res.success) {
        const data = (res.data || []) as Suggestion[]
        setRows(data)
        setTotal(data.length)
      } else {
        throw new Error(res.error || 'Failed to fetch reorder suggestions')
      }
    } catch (e: any) {
      setError(e?.message || 'Không thể tải đề xuất đặt hàng')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urgency])

  useEffect(() => {
    const client = new RealtimeClient({
      wsUrl,
      topics: ['inventory'],
      onStatus: setRealtimeStatus,
      onEvent: (evt) => {
        if (evt?.type?.includes('inventory') || evt?.type?.includes('stock')) fetchData()
      }
    })
    clientRef.current = client
    client.start()
    return () => client.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit])

  const toggleSelected = (id: string, checked: boolean) => {
    setSelected(prev => checked ? Array.from(new Set([...prev, id])) : prev.filter(x => x !== id))
  }

  const createPO = () => {
    if (selected.length === 0) { alert('Chọn ít nhất 1 đề xuất'); return }
    const ids = selected.join(',')
    // Điều hướng tới trang tạo PO cùng tham số gợi ý
    window.location.href = `/purchases/new?reorder=${encodeURIComponent(ids)}`
  }

  const totalEstimated = useMemo(() => rows
    .filter(r => selected.includes(r.id))
    .reduce((s, r) => s + (r.estimated_cost || 0), 0), [rows, selected])

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Đề xuất đặt hàng</h1>
          <p className="text-sm text-gray-500">Tự động gợi ý số lượng đặt thêm dựa trên tồn kho.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={
            realtimeStatus === 'connected' ? 'text-green-600 text-sm' :
            realtimeStatus === 'sse' ? 'text-amber-600 text-sm' :
            realtimeStatus === 'reconnecting' ? 'text-amber-600 text-sm' : 'text-gray-500 text-sm'
          }>Realtime: {realtimeStatus}</span>
          <button className="btn btn-primary" onClick={createPO}>Tạo đơn mua ({selected.length})</button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <select className="select select-bordered" value={urgency} onChange={e => setUrgency(e.target.value)}>
          <option value="">Tất cả mức độ</option>
          <option value="critical">Rất gấp</option>
          <option value="high">Cao</option>
          <option value="medium">Trung bình</option>
          <option value="low">Thấp</option>
        </select>
        <div className="ml-auto flex items-center gap-2">
          <div className="text-sm text-gray-600">Tổng chi phí dự kiến: {totalEstimated.toLocaleString()}</div>
          <select className="select select-bordered select-sm" value={limit} onChange={(e) => { setLimit(parseInt(e.target.value)); setPage(1) }}>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <div className="join">
            <button className="btn btn-sm join-item" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>«</button>
            <button className="btn btn-sm join-item" disabled>{page}/{pages}</button>
            <button className="btn btn-sm join-item" disabled={page >= pages} onClick={() => setPage(p => Math.min(pages, p + 1))}>»</button>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="overflow-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left"><input type="checkbox" checked={selected.length > 0 && selected.length === rows.length} onChange={(e) => setSelected(e.target.checked ? rows.map(r => r.id) : [])} /></th>
              <th className="px-3 py-2 text-left">Sản phẩm</th>
              <th className="px-3 py-2 text-left">Tồn hiện tại</th>
              <th className="px-3 py-2 text-left">Tối thiểu</th>
              <th className="px-3 py-2 text-left">Đề xuất đặt</th>
              <th className="px-3 py-2 text-left">Nhà cung cấp</th>
              <th className="px-3 py-2 text-left">Mức độ</th>
              <th className="px-3 py-2 text-left">Chi phí dự kiến</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-3 py-3" colSpan={8}>Đang tải...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="px-3 py-6 text-center text-gray-500" colSpan={8}>Không có dữ liệu</td></tr>
            ) : (
              rows.map(r => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2"><input type="checkbox" checked={selected.includes(r.id)} onChange={(e) => toggleSelected(r.id, e.target.checked)} /></td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{r.product_name || r.product_id}</div>
                    <div className="text-xs text-gray-500">SKU: {r.sku || '-'}</div>
                  </td>
                  <td className="px-3 py-2">{r.current_stock ?? '-'}</td>
                  <td className="px-3 py-2">{r.min_stock ?? '-'}</td>
                  <td className="px-3 py-2">{r.suggested_quantity ?? '-'}</td>
                  <td className="px-3 py-2">{r.supplier_name || r.supplier_id || '-'}</td>
                  <td className="px-3 py-2">{r.urgency_level || '-'}</td>
                  <td className="px-3 py-2">{typeof r.estimated_cost === 'number' ? r.estimated_cost.toLocaleString() : '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}


