import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api/client'

interface Supplier { id: string; name: string }
interface Product { id: string; name: string; sku: string; cost_price?: number }

export default function PurchaseCreate() {
  const navigate = useNavigate()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [supplierId, setSupplierId] = useState('')
  const [items, setItems] = useState<Array<{ product_id: string; quantity: number; unit_price: number }>>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [s, p] = await Promise.all([
          api.get('/suppliers'),
          api.get('/products?limit=100')
        ])
        setSuppliers(s.data?.data || s.data || [])
        setProducts(p.data?.data || p.data || [])
      } catch {}
    }
    load()
  }, [])

  const addItem = (productId: string) => {
    const prod = products.find(p => p.id === productId)
    if (!prod) return
    setItems(prev => [...prev, { product_id: prod.id, quantity: 1, unit_price: prod.cost_price || 0 }])
  }

  const updateItem = (idx: number, field: 'quantity' | 'unit_price', value: number) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it))
  }

  const total = items.reduce((s, it) => s + it.quantity * it.unit_price, 0)

  const save = async () => {
    if (!supplierId || items.length === 0) return
    setSaving(true)
    try {
      const res = await api.post('/purchase-orders', {
        supplier_id: supplierId, 
        items 
      })
      navigate('/purchases')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Tạo đơn nhập hàng</h1>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/purchases')}>Hủy</button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-base-100 rounded-lg shadow p-4 md:col-span-2">
          <div className="mb-4">
            <label className="block text-sm mb-1">Nhà cung cấp</label>
            <select className="select select-bordered w-full" value={supplierId} onChange={e => setSupplierId(e.target.value)}>
              <option value="">Chọn nhà cung cấp</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="mb-3">
            <label className="block text-sm mb-1">Thêm sản phẩm</label>
            <div className="flex gap-2">
              <select className="select select-bordered flex-1" onChange={e => { if (e.target.value) { addItem(e.target.value); e.currentTarget.selectedIndex = 0 } }}>
                <option value="">Chọn sản phẩm</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th className="w-32">SL</th>
                  <th className="w-40">Đơn giá</th>
                  <th className="text-right w-40">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => {
                  const prod = products.find(p => p.id === it.product_id)
                  return (
                    <tr key={idx}>
                      <td>{prod?.name}</td>
                      <td>
                        <input 
                          type="number" 
                          className="input input-bordered w-full" 
                          min={1} 
                          value={it.quantity}
                          onChange={e => updateItem(idx, 'quantity', Math.max(1, Number(e.target.value) || 1))} 
                        />
                      </td>
                      <td>
                        <input 
                          type="number" 
                          className="input input-bordered w-full" 
                          min={0} 
                          value={it.unit_price}
                          onChange={e => updateItem(idx, 'unit_price', Math.max(0, Number(e.target.value) || 0))} 
                        />
                      </td>
                      <td className="text-right">{(it.quantity * it.unit_price).toLocaleString('vi-VN')} ₫</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-base-100 rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">Tổng cộng</div>
            <div className="text-lg font-bold text-success">{total.toLocaleString('vi-VN')} ₫</div>
          </div>
          <button className="btn btn-primary w-full" disabled={!supplierId || items.length === 0 || saving} onClick={save}>
            {saving ? 'Đang lưu...' : 'Tạo PO'}
          </button>
        </div>
      </div>
    </div>
  )
}




