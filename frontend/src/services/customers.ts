export type ListParams = {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string; // e.g. name:asc
  type?: string;
  status?: string;
  points_min?: number;
  points_max?: number;
  dob_month?: number;
  has_contact?: string; // email|phone|both
};

const base = (import.meta as any).env?.VITE_API_BASE_URL || 'https://namhbcf-api.bangachieu2.workers.dev';

export async function listCustomers(params: ListParams) {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.search) qs.set('search', params.search);
  if (params.sort) qs.set('sort', params.sort);
  if (params.type) qs.set('type', params.type);
  if (params.status) qs.set('status', params.status);
  if (params.points_min != null) qs.set('points_min', String(params.points_min));
  if (params.points_max != null) qs.set('points_max', String(params.points_max));
  if (params.dob_month != null) qs.set('dob_month', String(params.dob_month));
  if (params.has_contact) qs.set('has_contact', params.has_contact);
  const res = await fetch(`${base}/api/customers?${qs.toString()}`, {
    headers: {
      'X-Tenant-ID': 'default',
      Authorization: localStorage.getItem('auth_token') ? `Bearer ${localStorage.getItem('auth_token')}` : ''
    }
  });
  if (!res.ok) throw new Error('Failed to fetch customers');
  return res.json();
}

export async function deleteCustomer(id: string) {
  const res = await fetch(`${base}/api/customers/${id}`, {
    method: 'DELETE',
    headers: {
      'X-Tenant-ID': 'default',
      Authorization: localStorage.getItem('auth_token') ? `Bearer ${localStorage.getItem('auth_token')}` : ''
    }
  });
  if (!res.ok) throw new Error('Failed to delete customer');
}

export async function exportCustomersCsv(params: ListParams) {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.sort) qs.set('sort', params.sort);
  if (params.type) qs.set('type', params.type);
  if (params.status) qs.set('status', params.status);
  if (params.points_min != null) qs.set('points_min', String(params.points_min));
  if (params.points_max != null) qs.set('points_max', String(params.points_max));
  if (params.dob_month != null) qs.set('dob_month', String(params.dob_month));
  if (params.has_contact) qs.set('has_contact', params.has_contact);
  return `${base}/api/customers/export.csv?${qs.toString()}`;
}

export async function importCustomersCsv(file: File, validateOnly = false) {
  const form = new FormData();
  form.append('file', file);
  const url = `${base}/api/customers/import${validateOnly ? '?validate=1' : ''}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'X-Tenant-ID': 'default',
      Authorization: localStorage.getItem('auth_token') ? `Bearer ${localStorage.getItem('auth_token')}` : ''
    },
    body: form
  });
  if (!res.ok) throw new Error('Failed to import customers');
  return res.json();
}

export async function checkDuplicates(payload: { email?: string; phone?: string }) {
  const res = await fetch(`${base}/api/customers/duplicates/check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': 'default',
      Authorization: localStorage.getItem('auth_token') ? `Bearer ${localStorage.getItem('auth_token')}` : ''
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to check duplicates');
  return res.json();
}


