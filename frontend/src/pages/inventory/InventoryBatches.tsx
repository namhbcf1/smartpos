import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { posApi } from '../../services/api/posApi'
import { API_V1_BASE_URL } from '../../services/api'

type Batch = {
  id: string
  product_id: string
  product_name?: string
  batch_number: string
  lot_number?: string
  expiry_date?: string
  manufacture_date?: string
  quantity: number
  location_id?: string
  location_name?: string
  supplier_id?: string
  supplier_name?: string
  purchase_price?: number
  created_at: string
  updated_at: string
}

export default function InventoryBatches() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [productId, setProductId] = useState<string>('')
  const [locationId, setLocationId] = useState<string>('')
  const [supplierId, setSupplierId] = useState<string>('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Batch | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['batches', { page, limit, search, productId, locationId, supplierId }],
    queryFn: async () => {
      const res = await posApi.getProductBatches(page, limit, search, productId || undefined, locationId || undefined, supplierId || undefined)
      return res
    }
  })

  const createMutation = useMutation({
    mutationFn: (payload: Partial<Batch>) => posApi.createBatch({
      product_id: payload.product_id!,
      batch_number: payload.batch_number!,
      lot_number: payload.lot_number,
      expiry_date: payload.expiry_date,
      manufacture_date: payload.manufacture_date,
      quantity: Number(payload.quantity || 0),
      location_id: payload.location_id,
      supplier_id: payload.supplier_id,
      purchase_price: payload.purchase_price
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['batches'] }); setShowForm(false); setEditing(null) }
  })

  const updateMutation = useMutation({
    mutationFn: (payload: Batch) => posApi.updateBatch(payload.id, {
      product_id: payload.product_id,
      batch_number: payload.batch_number,
      lot_number: payload.lot_number,
      expiry_date: payload.expiry_date,
      manufacture_date: payload.manufacture_date,
      quantity: payload.quantity,
      location_id: payload.location_id,
      supplier_id: payload.supplier_id,
      purchase_price: payload.purchase_price
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['batches'] }); setShowForm(false); setEditing(null) }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => posApi.deleteBatch(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['batches'] })
  })

  // Realtime: refetch on inventory updates
  useEffect(() => {
    try {
      const url = (import.meta as any).env.VITE_CLOUDFLARE_WS_URL || 'wss://namhbcf-api.bangachieu2.workers.dev/api/v1/ws'
      wsRef.current = new WebSocket(url)
      wsRef.current.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data)
          if (msg?.type?.includes('inventory')) {
            qc.invalidateQueries({ queryKey: ['batches'] })
          }
        } catch {}
      }
    } catch {}
    return () => { try { wsRef.current?.close() } catch {} }
  }, [qc])

  const rows: Batch[] = useMemo(() => (data?.data as any) || [], [data])
  const pagination = (data as any)?.pagination

  const getExportUrl = () => {
    const params = new URLSearchParams()
    if (search) params.append('q', search)
    if (productId) params.append('product_id', productId)
    if (locationId) params.append('location_id', locationId)
    if (supplierId) params.append('supplier_id', supplierId)
    return `${API_V1_BASE_URL}/inventory/batches/export.csv?${params.toString()}`
  }

  const getExpiryInfo = (date?: string) => {
    if (!date) return { label: '-', className: '' }
    const d = new Date(date)
    const now = new Date()
    const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays < 0) return { label: d.toLocaleDateString('vi-VN'), className: 'text-error font-medium' }
    if (diffDays <= 7) return { label: d.toLocaleDateString('vi-VN'), className: 'text-error' }
    if (diffDays <= 30) return { label: d.toLocaleDateString('vi-VN'), className: 'text-warning' }
    return { label: d.toLocaleDateString('vi-VN'), className: '' }
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const payload: any = {
      id: editing?.id,
      product_id: String(form.get('product_id') || ''),
      batch_number: String(form.get('batch_number') || ''),
      lot_number: String(form.get('lot_number') || ''),
      expiry_date: String(form.get('expiry_date') || ''),
      manufacture_date: String(form.get('manufacture_date') || ''),
      quantity: Number(form.get('quantity') || 0),
      location_id: String(form.get('location_id') || ''),
      supplier_id: String(form.get('supplier_id') || ''),
      purchase_price: Number(form.get('purchase_price') || 0)
    }
    if (editing) updateMutation.mutate(payload as Batch)
    else createMutation.mutate(payload)
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Lô hàng (Batches)</h1>
          <p className="text-sm text-gray-500">Theo dõi hạn dùng, số lô/lot và vị trí tồn</p>
        </div>
        <div className="flex gap-2">
          <button className="btn" onClick={() => { setEditing(null); setShowForm(true) }}>Thêm lô mới</button>
          <a className="btn btn-outline" href="/inventory/locations">Vị trí kho</a>
          <a className="btn btn-outline" href="/inventory/alerts">Cảnh báo</a>
          <a className="btn btn-outline" href="/inventory/reorder">Đề xuất đặt hàng</a>
          <button className="btn btn-outline" onClick={() => { window.location.href = getExportUrl() }}>Xuất CSV</button>
        </div>
      </div>

      <div className="bg-base-100 rounded-lg p-4 shadow">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input className="input input-bordered" placeholder="Tìm kiếm (mã lô, sản phẩm)" value={search} onChange={(e) => setSearch(e.target.value)} />
          <input className="input input-bordered" placeholder="Product ID" value={productId} onChange={(e) => setProductId(e.target.value)} />
          <input className="input input-bordered" placeholder="Location ID" value={locationId} onChange={(e) => setLocationId(e.target.value)} />
          <input className="input input-bordered" placeholder="Supplier ID" value={supplierId} onChange={(e) => setSupplierId(e.target.value)} />
          <div className="flex gap-2">
            <select className="select select-bordered" value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <button className="btn" onClick={() => qc.invalidateQueries({ queryKey: ['batches'] })}>Lọc</button>
          </div>
        </div>
      </div>

      {isLoading && <div className="p-6"><span className="loading loading-spinner" /> Đang tải...</div>}
      {error && <div className="alert alert-error">Không tải được dữ liệu.</div>}

      {!isLoading && (
        <div className="bg-base-100 rounded-lg shadow overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Mã lô</th>
                <th>Sản phẩm</th>
                <th>HSD</th>
                <th>NSX</th>
                <th>Số lượng</th>
                <th>Vị trí</th>
                <th>Nhà cung cấp</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id}>
                  <td>
                    <div className="font-medium">{b.batch_number}</div>
                    {b.lot_number && <div className="text-xs text-gray-500">Lot: {b.lot_number}</div>}
                  </td>
                  <td>
                    <div className="font-medium">{b.product_name || b.product_id}</div>
                  </td>
                  <td>
                    {(() => { const info = getExpiryInfo(b.expiry_date); return <span className={info.className}>{info.label}</span> })()}
                  </td>
                  <td>{b.manufacture_date ? new Date(b.manufacture_date).toLocaleDateString('vi-VN') : '-'}</td>
                  <td>{b.quantity}</td>
                  <td>{b.location_name || b.location_id || '-'}</td>
                  <td>{b.supplier_name || b.supplier_id || '-'}</td>
                  <td className="text-right">
                    <div className="flex gap-1 justify-end">
                      <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(b); setShowForm(true) }}>Sửa</button>
                      <button className="btn btn-ghost btn-sm text-error" onClick={() => { if (confirm('Xoá lô này?')) deleteMutation.mutate(b.id) }}>Xoá</button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={8} className="text-center text-sm text-gray-500">Chưa có lô hàng</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {pagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">Trang {pagination.page}/{pagination.pages || 1}</div>
          <div className="join">
            <button className="join-item btn" disabled={page<=1} onClick={() => setPage(page-1)}>«</button>
            <button className="join-item btn btn-active">{page}</button>
            <button className="join-item btn" disabled={pagination.pages && page>=pagination.pages} onClick={() => setPage(page+1)}>»</button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl bg-white text-gray-900">
            <h3 className="font-bold text-lg mb-4 text-gray-900 ? 'Cập nhật lô hàng' : 'Thêm lô hàng'}</h3>">
            <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input name="product_id" defaultValue={editing?.product_id} className="input input-bordered bg-white  text-gray-900  border-gray-300 placeholder="Product ID" required />
              <input name="batch_number" defaultValue={editing?.batch_number} className="input input-bordered bg-white  text-gray-900  border-gray-300 placeholder="Batch number" required />
              <input name="lot_number" defaultValue={editing?.lot_number} className="input input-bordered bg-white  text-gray-900  border-gray-300 placeholder="Lot number" />
              <input type="date" name="expiry_date" defaultValue={editing?.expiry_date?.slice(0,10)} className="input input-bordered bg-white  text-gray-900  border-gray-300 />">
              <input type="date" name="manufacture_date" defaultValue={editing?.manufacture_date?.slice(0,10)} className="input input-bordered bg-white  text-gray-900  border-gray-300 />">
              <input type="number" name="quantity" defaultValue={editing?.quantity || 0} className="input input-bordered bg-white  text-gray-900  border-gray-300 placeholder="Số lượng" required />
              <input name="location_id" defaultValue={editing?.location_id} className="input input-bordered bg-white  text-gray-900  border-gray-300 placeholder="Location ID" />
              <input name="supplier_id" defaultValue={editing?.supplier_id} className="input input-bordered bg-white  text-gray-900  border-gray-300 placeholder="Supplier ID" />
              <input type="number" step="0.01" name="purchase_price" defaultValue={editing?.purchase_price || 0} className="input input-bordered bg-white  text-gray-900  border-gray-300 placeholder="Giá nhập" />

              <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                <button type="button" className="btn btn-ghost" onClick={() => { setShowForm(false); setEditing(null) }}>Huỷ</button>
                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && <span className="loading loading-spinner loading-sm" />}
                  {editing ? 'Lưu thay đổi' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
