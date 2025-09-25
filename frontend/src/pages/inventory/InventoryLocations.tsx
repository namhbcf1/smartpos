import React, { useEffect, useMemo, useRef, useState } from 'react'
import { posApi } from '../../services/api/posApi'
import { RealtimeClient } from '../../services/realtime/realtimeClient'

type LocationRow = {
  id: string
  name: string
  description?: string
  store_id?: string
  shelf?: string
  bin?: string
  zone?: string
  is_active?: number
  created_at?: string
  updated_at?: string
  code?: string
  type?: string
  address?: string
  manager_name?: string
  contact_info?: string
  product_count?: number
  total_quantity?: number
  total_value?: number
}

const initialForm: Partial<LocationRow> = {
  name: '',
  code: '',
  type: 'warehouse',
  address: '',
  description: '',
  manager_name: '',
  contact_info: '',
  shelf: '',
  bin: '',
  zone: '',
  is_active: 1,
}

export default function InventoryLocations() {
  const [rows, setRows] = useState<LocationRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [includeInactive, setIncludeInactive] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<LocationRow | null>(null)
  const [form, setForm] = useState<Partial<LocationRow>>(initialForm)
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting'|'connected'|'sse'|'disconnected'|'reconnecting'>('connecting')
  const realtimeRef = useRef<RealtimeClient | null>(null)

  const wsUrl = import.meta.env.VITE_CLOUDFLARE_WS_URL as string | undefined

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await posApi.getWarehouseLocations(page, limit, search)
      if (res.success && Array.isArray(res.data)) {
        setRows(res.data as any)
        setTotal(res.data.length)
      } else {
        throw new Error(res.error || 'Failed to load locations')
      }
    } catch (e: any) {
      setError(e?.message || 'Không thể tải danh sách vị trí kho')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, includeInactive])

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchData()
  }

  const openCreate = () => {
    setEditing(null)
    setForm(initialForm)
    setShowForm(true)
  }

  const openEdit = (row: LocationRow) => {
    setEditing(row)
    setForm({ ...initialForm, ...row })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditing(null)
    setForm(initialForm)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setForm(prev => ({ ...prev, [name]: checked ? 1 : 0 }))
  }

  const save = async () => {
    if (!form.name || !form.name.trim()) {
      setError('Vui lòng nhập tên vị trí')
      return
    }
    if (!form.code || !String(form.code).trim()) {
      setError('Vui lòng nhập mã (code) vị trí')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const payload = {
        name: String(form.name),
        code: String(form.code),
        type: (form.type as string) || 'warehouse',
        address: form.address || '',
        description: form.description || '',
        is_active: (form.is_active ?? 1) === 1,
        manager_name: form.manager_name || '',
        contact_info: form.contact_info || ''
      }
      if (editing?.id) {
        const res = await posApi.updateLocation(editing.id, payload as any)
        if (!res?.success) throw new Error(res?.error || 'Cập nhật thất bại')
      } else {
        const res = await posApi.createLocation(payload as any)
        if (!res?.success) throw new Error(res?.error || 'Tạo mới thất bại')
      }
      closeForm()
      fetchData()
    } catch (e: any) {
      setError(e?.message || 'Lưu vị trí thất bại')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (row: LocationRow) => {
    if (!confirm(`Xóa vị trí "${row.name}"?`)) return
    try {
      const res = await posApi.deleteLocation(row.id)
      if (!res?.success) throw new Error(res?.error || 'Xóa thất bại')
      fetchData()
    } catch (e: any) {
      setError(e?.message || 'Xóa vị trí thất bại')
    }
  }

  useEffect(() => {
    const client = new RealtimeClient({
      wsUrl: wsUrl,
      topics: ['inventory'],
      onStatus: setRealtimeStatus,
      onEvent: (evt) => {
        if (evt?.type?.includes('inventory') || evt?.type?.includes('location')) {
          fetchData()
        }
      }
    })
    realtimeRef.current = client
    client.start()
    return () => client.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit])

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vị trí kho</h1>
          <p className="text-sm text-gray-500">Quản lý vị trí lưu trữ, cửa hàng, khu vực.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={
            realtimeStatus === 'connected' ? 'text-green-600 text-sm' :
            realtimeStatus === 'sse' ? 'text-amber-600 text-sm' :
            realtimeStatus === 'reconnecting' ? 'text-amber-600 text-sm' : 'text-gray-500 text-sm'
          }>
            Realtime: {realtimeStatus}
          </span>
          <button className="btn btn-primary" onClick={openCreate}>+ Thêm vị trí</button>
          <a className="btn" href="/inventory/locations/export.csv" target="_blank" rel="noreferrer">Xuất CSV</a>
          <button className={`btn ${importing ? 'loading' : ''}`} onClick={() => fileInputRef.current?.click()} type="button">Nhập CSV</button>
          <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={async (e) => {
            const file = e.target.files?.[0]
            if (!file) return
            setImporting(true)
            try {
              const res = await posApi.importLocations(file as any)
              if (!res?.success) throw new Error(res?.error || 'Nhập CSV thất bại')
              fetchData()
            } catch (err: any) {
              setError(err?.message || 'Nhập CSV thất bại')
            } finally {
              setImporting(false)
              if (fileInputRef.current) fileInputRef.current.value = ''
            }
          }} />
        </div>
      </div>

      <form className="flex items-center gap-3" onSubmit={onSearchSubmit}>
        <input
          name="q"
          placeholder="Tìm theo tên, mô tả, khu vực..."
          className="input input-bordered w-full max-w-md"
                  value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={includeInactive} onChange={(e) => setIncludeInactive(e.target.checked)} />
          Bao gồm đã vô hiệu hóa
        </label>
        <button className="btn btn-secondary" type="submit">Tìm kiếm</button>
      </form>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Tổng vị trí</div>
            <div className="stat-value text-primary">{total}</div>
          </div>
        </div>
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Hoạt động</div>
            <div className="stat-value text-success">{rows.filter(r => (r.is_active ?? 1) === 1).length}</div>
          </div>
        </div>
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Tạm tắt</div>
            <div className="stat-value">{rows.filter(r => (r.is_active ?? 1) !== 1).length}</div>
          </div>
        </div>
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Giá trị tồn (hiển thị)</div>
            <div className="stat-value">{rows.reduce((s, r) => s + (typeof r.total_value === 'number' ? r.total_value : 0), 0).toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="overflow-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Tên</th>
              <th className="px-3 py-2 text-left">Mã</th>
              <th className="px-3 py-2 text-left">Loại</th>
              <th className="px-3 py-2 text-left">Khu vực/Kệ/Ngăn</th>
              <th className="px-3 py-2 text-left">Sản phẩm</th>
              <th className="px-3 py-2 text-left">SL tổng</th>
              <th className="px-3 py-2 text-left">Giá trị</th>
              <th className="px-3 py-2 text-left">Trạng thái</th>
              <th className="px-3 py-2 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-3 py-3" colSpan={9}>Đang tải...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="px-3 py-6 text-center text-gray-500" colSpan={9}>Không có dữ liệu</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2">
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-gray-500">{r.description}</div>
                  </td>
                  <td className="px-3 py-2">{r.code || '-'}</td>
                  <td className="px-3 py-2">{r.type || 'warehouse'}</td>
                  <td className="px-3 py-2">{[r.zone, r.shelf, r.bin].filter(Boolean).join(' / ') || '-'}</td>
                  <td className="px-3 py-2">{r.product_count ?? '-'}</td>
                  <td className="px-3 py-2">{r.total_quantity ?? '-'}</td>
                  <td className="px-3 py-2">{typeof r.total_value === 'number' ? r.total_value.toLocaleString() : '-'}</td>
                  <td className="px-3 py-2">
                    {r.is_active ? <span className="badge badge-success">Hoạt động</span> : <span className="badge">Tắt</span>}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex gap-2">
                      <a className="btn btn-xs" href={`/inventory?location_id=${encodeURIComponent(r.id)}`}>Xem tồn</a>
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

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">Tổng: {total}</div>
        <div className="flex items-center gap-2">
          <select className="select select-bordered select-sm" value={limit} onChange={e => { setLimit(parseInt(e.target.value)); setPage(1) }}>
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

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{editing ? 'Cập nhật vị trí' : 'Thêm vị trí'}</h2>
              <button className="btn btn-ghost" onClick={closeForm}>✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label"><span className="label-text">Tên</span></label>
                <input className="input input-bordered w-full" name="name" value={form.name || ''} onChange={handleChange} />
              </div>
              <div>
                <label className="label"><span className="label-text">Mã</span></label>
                <input className="input input-bordered w-full" name="code" value={form.code || ''} onChange={handleChange} />
              </div>
              <div>
                <label className="label"><span className="label-text">Loại</span></label>
                <select className="select select-bordered w-full" name="type" value={form.type as string || 'warehouse'} onChange={handleChange}>
                  <option value="warehouse">Kho tổng</option>
                  <option value="store">Cửa hàng</option>
                  <option value="virtual">Ảo</option>
                  <option value="damaged">Hàng lỗi</option>
                  <option value="quarantine">Cách ly</option>
                </select>
              </div>
              <div>
                <label className="label"><span className="label-text">Địa chỉ</span></label>
                <input className="input input-bordered w-full" name="address" value={form.address || ''} onChange={handleChange} />
              </div>
              <div className="md:col-span-2">
                <label className="label"><span className="label-text">Mô tả</span></label>
                <textarea className="textarea textarea-bordered w-full" name="description" value={form.description || ''} onChange={handleChange} />
              </div>
              <div>
                <label className="label"><span className="label-text">Khu vực</span></label>
                <input className="input input-bordered w-full" name="zone" value={form.zone || ''} onChange={handleChange} />
              </div>
              <div>
                <label className="label"><span className="label-text">Kệ</span></label>
                <input className="input input-bordered w-full" name="shelf" value={form.shelf || ''} onChange={handleChange} />
              </div>
              <div>
                <label className="label"><span className="label-text">Ngăn</span></label>
                <input className="input input-bordered w-full" name="bin" value={form.bin || ''} onChange={handleChange} />
              </div>
              <div>
                <label className="label"><span className="label-text">Quản lý</span></label>
                <input className="input input-bordered w-full" name="manager_name" value={form.manager_name || ''} onChange={handleChange} />
              </div>
              <div>
                <label className="label"><span className="label-text">Liên hệ</span></label>
                <input className="input input-bordered w-full" name="contact_info" value={form.contact_info || ''} onChange={handleChange} />
              </div>
              <div className="md:col-span-2 flex items-center gap-3">
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="is_active" checked={(form.is_active ?? 1) === 1} onChange={handleCheckbox} />
                  Hoạt động
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


