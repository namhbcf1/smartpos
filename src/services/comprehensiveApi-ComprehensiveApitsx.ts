import { Env } from '../types';

// This variant exposes a minimal subset used by frontend pages via Workers API
export class ComprehensiveApi_ComprehensiveApitsx {
  constructor(private baseUrl: string) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, { headers: { 'Content-Type': 'application/json' }, ...init });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  }

  dashboard = {
    overview: () => this.request('/dashboard/overview'),
    metrics: () => this.request('/dashboard/metrics')
  };

  customers = {
    list: (params?: Record<string, any>) => this.request(`/customers${params ? `?${new URLSearchParams(params as any)}` : ''}`),
    get: (id: string) => this.request(`/customers/${id}`)
  };
}

export default ComprehensiveApi_ComprehensiveApitsx;

