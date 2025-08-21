import { useState } from 'react'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch('https://pos-backend-bangachieu2.bangachieu2.workers.dev/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      if (!res.ok) throw new Error('Login failed')
      const data = await res.json() as any
      // Store in memory (no local/session storage per rules). In production, use cookies via Set-Cookie.
      (window as any).jwt = data.token
      location.href = '/'
    } catch (err: any) {
      setError(err.message || 'Failed')
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Đăng nhập</h1>
      <form onSubmit={submit} className="space-y-4 max-w-sm">
        <input className="w-full bg-gray-800 p-2" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="w-full bg-gray-800 p-2" placeholder="Mật khẩu" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        {error && <div className="text-red-400">{error}</div>}
        <button className="bg-blue-600 px-4 py-2" type="submit">Đăng nhập</button>
      </form>
    </div>
  )
}


