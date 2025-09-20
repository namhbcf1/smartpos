import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import apiClient from '../../services/api/client'

export default function PurchaseReceive() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [poId, setPoId] = useState<string>('')
  const [note, setNote] = useState('')

  useEffect(() => {
    const id = params.get('id') || ''
    setPoId(id)
  }, [params])

  const submit = async () => {
    if (!poId) return
    setLoading(true)
    try {
      await apiClient.post(`/purchase-orders/${poId}/receive`, { note })
      navigate('/purchases')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Nhận hàng PO</h1>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/purchases')}>Quay lại</button>
      </div>

      <div className="bg-base-100 rounded-lg shadow p-4 max-w-xl">
        <div className="mb-3">
          <label className="block text-sm mb-1">PO ID</label>
          <input className="input input-bordered w-full" value={poId} onChange={(e) => setPoId(e.target.value)} placeholder="Nhập mã PO" />
        </div>
        <div className="mb-4">
          <label className="block text-sm mb-1">Ghi chú</label>
          <textarea className="textarea textarea-bordered w-full" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <button className="btn btn-primary" disabled={!poId || loading} onClick={submit}>
          {loading ? 'Đang xử lý...' : 'Xác nhận nhận hàng'}
        </button>
      </div>
    </div>
  )
}



