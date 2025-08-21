import { useEffect, useState } from 'react'
import api from '../../services/api/client'

export default function SalesList() {
  const [rows, setRows] = useState<any[]>([])
  const [q, setQ] = useState('')
  useEffect(() => { (async()=>{
    const res = await api.get('/api/sales', { params: { q, limit: 50 } })
    setRows(res.data.data || [])
  })() }, [q])
  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <input className="border p-2" placeholder="Tìm mã hoá đơn/khách/serial" value={q} onChange={e=>setQ(e.target.value)} />
      </div>
      <div className="bg-white rounded">
        {rows.map(r => (
          <div key={r.id} className="border-b p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">#{r.id}</div>
              <div className="text-xs text-gray-500">{new Date(r.created_at*1000).toLocaleString('vi-VN')}</div>
            </div>
            <div className="w-24 text-right">{r.total?.toLocaleString('vi-VN')}</div>
          </div>
        ))}
      </div>
    </div>
  )
}


