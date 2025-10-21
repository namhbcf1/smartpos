const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'https://namhbcf-api.bangachieu2.workers.dev/api'

interface ApiResponse<T = any> { success: boolean; data?: T; message?: string; error?: string }

export class ApiService_ApiServicetsx {
  private getAuthHeaders() {
    const token = localStorage.getItem('authToken')
    return { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`
      const response = await fetch(url, { ...options, headers: { ...this.getAuthHeaders(), ...options.headers } })
      const data = await response.json()
      if (!response.ok) return { success: false, error: data.message || response.statusText, message: data.message || 'An error occurred' }
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message || 'Network error' }
    }
  }
  getCategories() { return this.request('/categories') }
  getProducts(params?: Record<string, any>) { const q = new URLSearchParams(params as any).toString(); return this.request(`/products${q ? `?${q}` : ''}`) }
}

export default ApiService_ApiServicetsx;

