import React, { useEffect, useMemo, useRef, useState } from 'react'
import { posApi } from '../../services/api/posApi'
import { RealtimeClient } from '../../services/realtime/realtimeClient'

type AlertRow = {
  id: string
  product_id: string
  product_name?: string
  sku?: string
  alert_type: string
  threshold_value?: number
  current_value?: number
  message?: string
  is_active: number
  created_at?: string
  updated_at?: string
}

const initialForm: Partial<AlertRow> = {
  product_id: '',
  alert_type: 'low_stock',
  threshold_value: 5,
  current_value: undefined,
  message: ''
}

export default function InventoryAlerts() {
  const [rows, setRows] = useState<AlertRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [total, setTotal] = useState(0)
  const [filterType, setFilterType] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<AlertRow | null>(null)
  const [form, setForm] = useState<Partial<AlertRow>>(initialForm)
  const [saving, setSaving] = useState(false)
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting'|'connected'|'sse'|'disconnected'|'reconnecting'>('connecting')
  const wsUrl = import.meta.env.VITE_CLOUDFLARE_WS_URL as string | undefined
  const clientRef = useRef<RealtimeClient | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await posApi.getInventoryAlerts(filterType || undefined)
      if (res.success) {
        const data = (res.data || []) as AlertRow[]
        setRows(data)
        setTotal(data.length)
      } else {
        throw new Error(res.error || 'Failed to fetch alerts')
      }
    } catch (e: any) {
      setError(e?.message || 'Không thể tải cảnh báo')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType])

  useEffect(() => {
    const client = new RealtimeClient({
      wsUrl,
      topics: ['inventory'],
      onStatus: setRealtimeStatus,
      onEvent: (evt) => {
        if (evt?.type?.includes('stock') || evt?.type?.includes('alert')) fetchData()
      }
    })
    clientRef.current = client
    client.start()
    return () => client.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(initialForm)
    setShowForm(true)
  }

  const openEdit = (row: AlertRow) => {
    setEditing(row)
    setForm({ ...row })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditing(null)
    setForm(initialForm)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: name === 'threshold_value' || name === 'current_value' ? Number(value) : value }))
  }

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = e.target
    setForm(prev => ({ ...prev, is_active: checked ? 1 : 0 }))
  }

  const save = async () => {
    if (!form.product_id) { setError('Vui lòng nhập sản phẩm'); return }
    if (!form.alert_type) { setError('Vui lòng chọn loại cảnh báo'); return }
    setSaving(true)
    setError(null)
    try {
      if (editing?.id) {
        const res = await posApi.updateAlert(editing.id, {
          product_id: form.product_id,
          alert_type: form.alert_type,
          threshold_value: form.threshold_value,
          current_value: form.current_value,
          message: form.message,
          is_active: form.is_active
        } as any)
        if (!res?.success) throw new Error(res?.error || 'Cập nhật thất bại')
      } else {
        const res = await posApi.createAlert({
          product_id: String(form.product_id),
          alert_type: String(form.alert_type),
          threshold_value: form.threshold_value,
          current_value: form.current_value,
          message: form.message,
        })
        if (!res?.success) throw new Error(res?.error || 'Tạo mới thất bại')
      }
      closeForm()
      fetchData()
    } catch (e: any) {
      setError(e?.message || 'Lưu cảnh báo thất bại')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (row: AlertRow) => {
    if (!confirm(`Xóa cảnh báo cho sản phẩm "${row.product_name || row.product_id}"?`)) return
    try {
      const res = await posApi.deleteAlert(row.id)
      if (!res?.success) throw new Error(res?.error || 'Xóa thất bại')
      fetchData()
    } catch (e: any) {
      setError(e?.message || 'Xóa cảnh báo thất bại')
    }
  }

  const pages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit])

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cảnh báo kho</h1>
          <p className="text-sm text-gray-500">Thiết lập và theo dõi cảnh báo tồn kho.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={
            realtimeStatus === 'connected' ? 'text-green-600 text-sm' :
            realtimeStatus === 'sse' ? 'text-amber-600 text-sm' :
            realtimeStatus === 'reconnecting' ? 'text-amber-600 text-sm' : 'text-gray-500 text-sm'
          }>Realtime: {realtimeStatus}</span>
          <button className="btn btn-primary" onClick={openCreate}>+ Thêm cảnh báo</button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <select className="select select-bordered" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">Tất cả</option>
          <option value="low_stock">Sắp hết hàng</option>
          <option value="out_of_stock">Hết hàng</option>
          <option value="overstock">Tồn kho cao</option>
          <option value="expiry">Hết hạn</option>
        </select>
        <div className="ml-auto flex items-center gap-2">
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
              <th className="px-3 py-2 text-left">Sản phẩm</th>
              <th className="px-3 py-2 text-left">Loại</th>
              <th className="px-3 py-2 text-left">Ngưỡng</th>
              <th className="px-3 py-2 text-left">Hiện tại</th>
              <th className="px-3 py-2 text-left">Ghi chú</th>
              <th className="px-3 py-2 text-left">Trạng thái</th>
              <th className="px-3 py-2 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-3 py-3" colSpan={7}>Đang tải...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="px-3 py-6 text-center text-gray-500" colSpan={7}>Không có dữ liệu</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2">
                    <div className="font-medium">{r.product_name || r.product_id}</div>
                    <div className="text-xs text-gray-500">SKU: {r.sku || '-'}</div>
                  </td>
                  <td className="px-3 py-2">{r.alert_type}</td>
                  <td className="px-3 py-2">{r.threshold_value ?? '-'}</td>
                  <td className="px-3 py-2">{r.current_value ?? '-'}</td>
                  <td className="px-3 py-2">{r.message || '-'}</td>
                  <td className="px-3 py-2">{r.is_active ? <span className="badge badge-success">Bật</span> : <span className="badge">Tắt</span>}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex gap-2">
                      <button className="btn btn-xs btn-outline" onClick={() => openEdit(r)}>Sửa</button>
                      <button className="btn btn-xs btn-error" onClick={() => remove(r)}>Xóa</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{editing ? 'Cập nhật cảnh báo' : 'Thêm cảnh báo'}</h2>
              <button className="btn btn-ghost" onClick={closeForm}>✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="label"><span className="label-text">Sản phẩm ID</span></label>
                <input className="input input-bordered w-full" name="product_id" value={form.product_id || ''} onChange={handleChange} placeholder="Nhập ID sản phẩm" />
              </div>
              <div>
                <label className="label"><span className="label-text">Loại cảnh báo</span></label>
                <select className="select select-bordered w-full" name="alert_type" value={form.alert_type as string || 'low_stock'} onChange={handleChange}>
                  <option value="low_stock">Sắp hết hàng</option>
                  <option value="out_of_stock">Hết hàng</option>
                  <option value="overstock">Tồn kho cao</option>
                  <option value="expiry">Hết hạn</option>
                </select>
              </div>
              <div>
                <label className="label"><span className="label-text">Ngưỡng (threshold)</span></label>
                <input className="input input-bordered w-full" name="threshold_value" value={form.threshold_value ?? ''} onChange={handleChange} type="number" />
              </div>
              <div>
                <label className="label"><span className="label-text">Giá trị hiện tại</span></label>
                <input className="input input-bordered w-full" name="current_value" value={form.current_value ?? ''} onChange={handleChange} type="number" />
              </div>
              <div className="md:col-span-2">
                <label className="label"><span className="label-text">Ghi chú</span></label>
                <input className="input input-bordered w-full" name="message" value={form.message || ''} onChange={handleChange} />
              </div>
              <div className="md:col-span-2 flex items-center gap-3">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={(form.is_active ?? 1) === 1} onChange={handleCheckbox} />
                  Kích hoạt
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button className="btn" onClick={closeForm} type="button">Hủy</button>
              <button className={`btn btn-primary ${saving ? 'loading' : ''}`} onClick={save} type="button">Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


