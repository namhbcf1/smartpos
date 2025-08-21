import { NavLink } from 'react-router-dom'

const sections = [
  { title: 'Tổng quan', links: [
    { to: '/dashboard', label: 'Dashboard' },
  ]},
  { title: 'Bán hàng', links: [
    { to: '/pos', label: 'POS' },
    { to: '/pos/held', label: 'Tạm giữ' },
    { to: '/pos/end-of-day', label: 'Chốt ngày' },
    { to: '/pos/online', label: 'Online' },
    { to: '/sales', label: 'Hóa đơn' },
  ]},
  { title: 'Sản phẩm', links: [
    { to: '/products', label: 'Products' },
    { to: '/inventory', label: 'Tồn kho' },
  ]},
  { title: 'Nhập hàng', links: [
    { to: '/purchases', label: 'PO' },
  ]},
  { title: 'Serial & Bảo hành', links: [
    { to: '/serials', label: 'Serials' },
    { to: '/warranty', label: 'Warranty' },
  ]},
  { title: 'Báo cáo', links: [
    { to: '/reports', label: 'Reports' },
  ]},
  { title: 'Cài đặt', links: [
    { to: '/settings', label: 'Settings' },
  ]},
]

export default function SidebarNav() {
  return (
    <nav className="space-y-4 text-sm">
      {sections.map((sec) => (
        <div key={sec.title}>
          <div className="uppercase text-xs opacity-60 mb-1">{sec.title}</div>
          <ul className="space-y-1">
            {sec.links.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  className={({ isActive }) => `btn btn-ghost btn-sm justify-start w-full ${isActive ? 'bg-primary/10 text-primary' : ''}`}
                >{l.label}</NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}


