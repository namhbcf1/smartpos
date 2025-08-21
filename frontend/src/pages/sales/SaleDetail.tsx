import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../../services/api/client'

export default function SaleDetail() {
  const { id } = useParams()
  const [sale, setSale] = useState<any>(null)
  useEffect(() => { (async()=>{
    const res = await api.get(`/api/sales/${id}`)
    setSale(res.data)
  })() }, [id])
  if (!sale) return <div className="p-4">Đang tải...</div>
  return (
    <div className="p-4 space-y-3">
      <h1 className="text-xl font-semibold">Hoá đơn #{sale.id}</h1>
      <div className="bg-white rounded p-4">
        {(sale.lines||[]).map((l:any)=> (
          <div key={l.id} className="flex items-center justify-between border-b py-2">
            <div>{l.product_name}</div>
            <div>x{l.quantity}</div>
            <div>{l.unit_price?.toLocaleString('vi-VN')}</div>
          </div>
        ))}
        <div className="text-right font-semibold mt-2">Tổng: {sale.total?.toLocaleString('vi-VN')}</div>
      </div>
    </div>
  )
}


