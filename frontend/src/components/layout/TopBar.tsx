export default function TopBar() {
  return (
    <header className="h-12 border-b px-4 flex items-center justify-between bg-white">
      <div className="font-semibold">ComputerPOS</div>
      <div className="flex items-center gap-3 text-sm">
        <span className="inline-flex items-center gap-1 text-green-600"><span className="w-2 h-2 rounded-full bg-green-500"></span>Online</span>
        <button className="px-2 py-1 border rounded">Tìm</button>
        <button className="px-2 py-1 border rounded">Thông báo</button>
        <button className="px-2 py-1 border rounded">Tài khoản</button>
      </div>
    </header>
  )
}


