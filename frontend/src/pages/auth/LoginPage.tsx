import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'

const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { login, isAuthenticated } = useAuth()
  const isOnline = useOnlineStatus()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123')
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log('User is authenticated, redirecting to dashboard...')
      // Use replace to prevent back button issues
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])



  async function submit(e: React.FormEvent) {
    e.preventDefault()

    if (!isOnline) {
      setError('Cần kết nối internet để đăng nhập')
      return
    }

    if (!username) {
      setError('Vui lòng nhập tên đăng nhập hoặc email')
      return
    }

    setError('')
    setLoading(true)

    try {
      // For username-only authentication, pass empty password if not provided
      await login(username, password || '')
      // Don't navigate immediately - let the useEffect handle it
      console.log('Login successful, waiting for auth state update...')
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại')
      console.error('Login failed:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOnline) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🌐</div>
          <h1 className="text-2xl font-bold text-red-800 mb-2">Đăng nhập yêu cầu kết nối internet</h1>
          <p className="text-red-600">Vui lòng kiểm tra kết nối mạng để tiếp tục.</p>
          <div className="mt-4 p-4 bg-red-100 rounded-lg max-w-md mx-auto">
            <p className="text-sm text-red-700">
              Hệ thống POS này hoạt động 100% online với Cloudflare Workers + D1 Database.
              Không có chế độ offline.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">💻</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ComputerPOS Pro</h1>
          <p className="text-gray-600">Hệ thống POS 100% Online</p>
          <div className="flex items-center justify-center space-x-2 mt-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-sm text-green-600 font-medium">Cloudflare Workers + D1</span>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={submit} className="space-y-6">
            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="text-red-400 mr-3">⚠️</div>
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Username/Email Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Tên đăng nhập hoặc Email
              </label>
              <input
                id="username"
                data-testid="login-username-input"
                name="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="admin hoặc admin@computerpos.vn"
                required
                autoComplete="username"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu <span className="text-gray-400 text-xs">(tùy chọn)</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  data-testid="login-password-input"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors pr-12"
                  placeholder="Nhập mật khẩu (tùy chọn)"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                <span className="text-sm text-gray-700">Ghi nhớ đăng nhập</span>
              </label>
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Quên mật khẩu?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang đăng nhập...</span>
                </div>
              ) : (
                'Đăng nhập'
              )}
            </button>


          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>© 2024 ComputerPOS Pro - 100% Online POS System</p>
          <p className="mt-1">Powered by Cloudflare Workers + D1 Database</p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
